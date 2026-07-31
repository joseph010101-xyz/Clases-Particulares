// =============================================
// ClasesYa - API: Pagos de toda la plataforma (ADMIN o MODERADOR)
// GET /api/admin/pagos?estado=&pagina=&porPagina= → historial y disputas
// El administrador no cobra ni reembolsa: mira la evidencia para arbitrar
// cuando el estudiante dice que pagó y el profesor dice que no lo recibió.
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeModerar } from "@/lib/dominio/permisos";

const ESTADOS = ["PENDIENTE", "COMPLETADO", "FALLIDO", "REEMBOLSADO"] as const;
type EstadoFiltro = (typeof ESTADOS)[number];

export async function GET(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeModerar(payload.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1") || 1);
    const porPagina = Math.min(
      Math.max(1, parseInt(searchParams.get("porPagina") || "20") || 20),
      100
    );

    const where =
      estado && (ESTADOS as readonly string[]).includes(estado)
        ? { estado: estado as EstadoFiltro }
        : {};

    const [pagos, total, resumen] = await Promise.all([
      prisma.pago.findMany({
        where,
        select: {
          id: true,
          monto: true,
          metodoPago: true,
          estado: true,
          referencia: true,
          comprobanteUrl: true,
          motivoRechazo: true,
          revisadoEn: true,
          createdAt: true,
          inscripcion: {
            select: {
              id: true,
              estado: true,
              estudiante: { select: { id: true, nombre: true, email: true } },
              curso: {
                select: { id: true, titulo: true, profesor: { select: { id: true, nombre: true } } },
              },
            },
          },
          reserva: {
            select: {
              id: true,
              fecha: true,
              horaInicio: true,
              estudiante: { select: { id: true, nombre: true, email: true } },
              servicio: {
                select: { materia: true, profesor: { select: { id: true, nombre: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.pago.count({ where }),
      prisma.pago.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]);

    // Se normalizan los dos orígenes (curso y clase) a una misma forma, para
    // que la tabla del administrador no tenga que distinguirlos.
    const listado = pagos.map((p) => {
      const esCurso = p.inscripcion !== null;
      const estudiante = p.inscripcion?.estudiante ?? p.reserva?.estudiante ?? null;
      const profesor = p.inscripcion?.curso.profesor ?? p.reserva?.servicio.profesor ?? null;
      return {
        id: p.id,
        origen: esCurso ? ("CURSO" as const) : ("CLASE" as const),
        concepto: p.inscripcion?.curso.titulo ?? p.reserva?.servicio.materia ?? "—",
        monto: p.monto,
        metodoPago: p.metodoPago,
        estado: p.estado,
        referencia: p.referencia,
        comprobanteUrl: p.comprobanteUrl,
        motivoRechazo: p.motivoRechazo,
        revisadoEn: p.revisadoEn,
        createdAt: p.createdAt,
        estudiante,
        profesor,
      };
    });

    return NextResponse.json({
      pagos: listado,
      resumen: Object.fromEntries(resumen.map((r) => [r.estado, r._count._all])),
      paginacion: { pagina, porPagina, total, totalPaginas: Math.ceil(total / porPagina) },
    });
  } catch (error) {
    console.error("Error listando pagos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
