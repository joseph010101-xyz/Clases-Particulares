// =============================================
// ClasesYa - API: Ficha completa de un usuario (ADMIN o MODERADOR)
// GET /api/admin/usuarios/[id]/ficha → perfil + actividad + historial
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeModerar } from "@/lib/dominio/permisos";
import { promedioCalificaciones } from "@/lib/dominio";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeModerar(payload.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        foto: true,
        telefono: true,
        ubicacion: true,
        bio: true,
        activo: true,
        verificado: true,
        verificadoAt: true,
        ultimoAcceso: true,
        createdAt: true,
        _count: {
          select: {
            servicios: true,
            reservas: true,
            cursos: true,
            inscripciones: true,
            entregas: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Reservas donde participa (como estudiante o como profesor del servicio)
    const reservas = await prisma.reserva.findMany({
      where: {
        OR: [{ estudianteId: id }, { servicio: { profesorId: id } }],
      },
      select: {
        id: true,
        fecha: true,
        horaInicio: true,
        horaFin: true,
        estado: true,
        servicio: { select: { materia: true, profesorId: true } },
        estudiante: { select: { nombre: true } },
      },
      orderBy: { fecha: "desc" },
      take: 10,
    });

    // Calificación media recibida como profesor
    const resenasRecibidas = await prisma.resena.findMany({
      where: { reserva: { servicio: { profesorId: id } } },
      select: { calificacion: true },
    });
    const calificacionMedia = promedioCalificaciones(
      resenasRecibidas.map((r) => r.calificacion)
    );

    // Acciones administrativas que le afectaron
    const auditoria = await prisma.registroAuditoria.findMany({
      where: { objetivoId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      usuario,
      reservas,
      calificacionMedia,
      totalResenas: resenasRecibidas.length,
      auditoria,
    });
  } catch (error) {
    console.error("Error obteniendo ficha de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
