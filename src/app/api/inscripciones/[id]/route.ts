// =============================================
// ClasesYa - API: Revisión de una inscripción por el profesor
// PATCH /api/inscripciones/[id] → aprobar o rechazar el pago
// Body: { decision: "APROBAR" | "RECHAZAR", motivo?: string }
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import {
  puedeRevisarPago,
  estadoTrasDecision,
  type DecisionPago,
  type EstadoInscripcion,
} from "@/lib/dominio";
import { notificar } from "@/lib/notificaciones";

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
    const { decision, motivo } = await request.json();

    if (decision !== "APROBAR" && decision !== "RECHAZAR") {
      return NextResponse.json(
        { error: "Decisión inválida. Usa APROBAR o RECHAZAR." },
        { status: 400 }
      );
    }

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        estudianteId: true,
        curso: { select: { id: true, titulo: true, profesorId: true } },
      },
    });
    if (!inscripcion) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }
    // Solo el profesor dueño decide: es quien ve el dinero en su cuenta
    if (inscripcion.curso.profesorId !== payload.userId) {
      return NextResponse.json(
        { error: "Solo el profesor del curso puede revisar el pago" },
        { status: 403 }
      );
    }

    const revisable = puedeRevisarPago(inscripcion.estado as EstadoInscripcion);
    if (!revisable.permitido) {
      return NextResponse.json({ error: revisable.mensaje }, { status: 400 });
    }

    const nuevoEstado = estadoTrasDecision(decision as DecisionPago);
    const motivoLimpio = typeof motivo === "string" && motivo.trim() ? motivo.trim().slice(0, 500) : null;

    await prisma.$transaction([
      prisma.inscripcion.update({
        where: { id },
        data: { estado: nuevoEstado },
      }),
      prisma.pago.updateMany({
        where: { inscripcionId: id },
        data: {
          estado: decision === "APROBAR" ? "COMPLETADO" : "FALLIDO",
          revisadoEn: new Date(),
          motivoRechazo: decision === "RECHAZAR" ? motivoLimpio : null,
        },
      }),
    ]);

    await notificar({
      usuarioId: inscripcion.estudianteId,
      tipo: decision === "APROBAR" ? "PAGO_RECIBIDO" : "PAGO_RECHAZADO",
      mensaje:
        decision === "APROBAR"
          ? `Tu pago de "${inscripcion.curso.titulo}" fue confirmado. Ya tienes acceso al curso.`
          : `Tu pago de "${inscripcion.curso.titulo}" fue rechazado${motivoLimpio ? `: ${motivoLimpio}` : ""}`,
      enlace: `/cursos/${inscripcion.curso.id}`,
    });

    return NextResponse.json({
      mensaje: decision === "APROBAR" ? "Inscripción activada" : "Pago rechazado",
      estado: nuevoEstado,
    });
  } catch (error) {
    console.error("Error revisando la inscripción:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
