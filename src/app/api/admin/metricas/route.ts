// =============================================
// ClasesYa - API: Métricas de la plataforma
// GET /api/admin/metricas → indicadores agregados (ADMIN o MODERADOR)
// =============================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeModerar } from "@/lib/dominio/permisos";

// Días que abarca la serie temporal de reservas
const DIAS_SERIE = 14;

function hace(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d;
}

function claveDia(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}

export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeModerar(payload.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const hace7 = hace(7);
    const inicioSerie = hace(DIAS_SERIE - 1);

    const [
      usuariosPorRol,
      usuariosNuevos,
      usuariosActivos,
      profesoresVerificados,
      profesoresTotal,
      reservasPorEstado,
      reservasRecientes,
      reservasSerie,
      serviciosActivos,
      cursosActivos,
      inscripciones,
      agregadoResenas,
    ] = await Promise.all([
      prisma.usuario.groupBy({ by: ["rol"], _count: { _all: true } }),
      prisma.usuario.count({ where: { createdAt: { gte: hace7 } } }),
      prisma.usuario.count({ where: { ultimoAcceso: { gte: hace7 } } }),
      prisma.usuario.count({ where: { rol: "PROFESOR", verificado: true } }),
      prisma.usuario.count({ where: { rol: "PROFESOR" } }),
      prisma.reserva.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.reserva.count({ where: { createdAt: { gte: hace7 } } }),
      prisma.reserva.findMany({
        where: { createdAt: { gte: inicioSerie } },
        select: { createdAt: true },
      }),
      prisma.servicio.count({ where: { activo: true } }),
      prisma.curso.count({ where: { activo: true } }),
      prisma.inscripcion.count(),
      prisma.resena.aggregate({ _count: { _all: true }, _avg: { calificacion: true } }),
    ]);

    // Conteo de usuarios por rol en un objeto plano
    const porRol: Record<string, number> = {};
    for (const fila of usuariosPorRol) porRol[fila.rol] = fila._count._all;
    const totalUsuarios = Object.values(porRol).reduce((a, b) => a + b, 0);

    // Conteo de reservas por estado
    const porEstado: Record<string, number> = {};
    for (const fila of reservasPorEstado) porEstado[fila.estado] = fila._count._all;
    const totalReservas = Object.values(porEstado).reduce((a, b) => a + b, 0);

    // Tasa de confirmación: reservas que el profesor aceptó o completó
    const aceptadas = (porEstado.CONFIRMADA ?? 0) + (porEstado.COMPLETADA ?? 0);
    const tasaConfirmacion = totalReservas > 0 ? Math.round((aceptadas / totalReservas) * 100) : null;

    // Serie diaria de reservas creadas (rellena los días sin actividad con 0)
    const conteoPorDia = new Map<string, number>();
    for (let i = 0; i < DIAS_SERIE; i++) {
      const d = new Date(inicioSerie);
      d.setDate(d.getDate() + i);
      conteoPorDia.set(claveDia(d), 0);
    }
    for (const r of reservasSerie) {
      const clave = claveDia(new Date(r.createdAt));
      if (conteoPorDia.has(clave)) conteoPorDia.set(clave, (conteoPorDia.get(clave) ?? 0) + 1);
    }
    const serieReservas = Array.from(conteoPorDia.entries()).map(([fecha, total]) => ({
      fecha,
      total,
    }));

    return NextResponse.json({
      usuarios: {
        total: totalUsuarios,
        porRol,
        nuevos7d: usuariosNuevos,
        activos7d: usuariosActivos,
      },
      profesores: {
        total: profesoresTotal,
        verificados: profesoresVerificados,
        pendientes: profesoresTotal - profesoresVerificados,
      },
      reservas: {
        total: totalReservas,
        porEstado,
        nuevas7d: reservasRecientes,
        tasaConfirmacion,
      },
      catalogo: {
        serviciosActivos,
        cursosActivos,
        inscripciones,
      },
      resenas: {
        total: agregadoResenas._count._all,
        promedio: agregadoResenas._avg.calificacion
          ? Math.round(agregadoResenas._avg.calificacion * 10) / 10
          : null,
      },
      serieReservas,
    });
  } catch (error) {
    console.error("Error calculando métricas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
