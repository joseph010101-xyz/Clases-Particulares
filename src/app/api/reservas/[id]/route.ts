// =============================================
// ClasesYa - API: Reserva por ID
// GET   /api/reservas/[id] → detalle de una reserva
// PATCH /api/reservas/[id] → cambiar estado (confirmar/cancelar/completar)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";

// Obtener detalle de una reserva
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        servicio: {
          select: {
            id: true,
            materia: true,
            descripcion: true,
            precioHora: true,
            modalidad: true,
            profesor: {
              select: { id: true, nombre: true, foto: true, email: true },
            },
          },
        },
        estudiante: {
          select: { id: true, nombre: true, foto: true, email: true },
        },
        resena: true,
      },
    });

    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // Solo el estudiante o el profesor pueden ver la reserva
    const esEstudiante = reserva.estudianteId === payload.userId;
    const esProfesor = reserva.servicio.profesor.id === payload.userId;

    if (!esEstudiante && !esProfesor) {
      return NextResponse.json(
        { error: "No tienes permiso para ver esta reserva" },
        { status: 403 }
      );
    }

    return NextResponse.json({ reserva });
  } catch (error) {
    console.error("Error obteniendo reserva:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Cambiar estado de una reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;
    const { estado } = await request.json();

    // Validar estado
    const estadosValidos = ["CONFIRMADA", "CANCELADA", "COMPLETADA"];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido. Valores permitidos: " + estadosValidos.join(", ") },
        { status: 400 }
      );
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        servicio: { select: { profesorId: true } },
      },
    });

    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const esEstudiante = reserva.estudianteId === payload.userId;
    const esProfesor = reserva.servicio.profesorId === payload.userId;

    // Reglas de negocio para cambio de estado
    if (estado === "CONFIRMADA" && !esProfesor) {
      return NextResponse.json(
        { error: "Solo el profesor puede confirmar reservas" },
        { status: 403 }
      );
    }
    if (estado === "COMPLETADA" && !esProfesor) {
      return NextResponse.json(
        { error: "Solo el profesor puede marcar como completada" },
        { status: 403 }
      );
    }
    if (estado === "CANCELADA" && !esEstudiante && !esProfesor) {
      return NextResponse.json(
        { error: "No tienes permiso para cancelar esta reserva" },
        { status: 403 }
      );
    }

    // No se puede cambiar el estado de reservas ya completadas o canceladas
    if (reserva.estado === "COMPLETADA" || reserva.estado === "CANCELADA") {
      return NextResponse.json(
        { error: "No se puede modificar una reserva " + reserva.estado.toLowerCase() },
        { status: 400 }
      );
    }

    const reservaActualizada = await prisma.reserva.update({
      where: { id },
      data: { estado },
      include: {
        servicio: { select: { materia: true } },
      },
    });

    // Crear notificación para la otra parte
    const tipoNotificacion =
      estado === "CONFIRMADA" ? "RESERVA_CONFIRMADA" as const :
      estado === "CANCELADA" ? "RESERVA_CANCELADA" as const :
      "RESERVA_COMPLETADA" as const;

    const destinatarioId = esProfesor ? reserva.estudianteId : reserva.servicio.profesorId;
    const mensajeTexto =
      estado === "CONFIRMADA" ? `Tu reserva de ${reservaActualizada.servicio.materia} ha sido confirmada` :
      estado === "CANCELADA" ? `La reserva de ${reservaActualizada.servicio.materia} ha sido cancelada` :
      `La clase de ${reservaActualizada.servicio.materia} ha sido completada. ¡Deja tu reseña!`;

    await prisma.notificacion.create({
      data: {
        usuarioId: destinatarioId,
        tipo: tipoNotificacion,
        mensaje: mensajeTexto,
        enlace: esProfesor ? `/estudiantes/dashboard` : `/profesores/dashboard`,
      },
    });

    return NextResponse.json({
      mensaje: `Reserva ${estado.toLowerCase()} exitosamente`,
      reserva: reservaActualizada,
    });
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
