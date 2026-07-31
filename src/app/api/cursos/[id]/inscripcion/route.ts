// =============================================
// ClasesYa - API: Inscripción a un curso
// POST   /api/cursos/[id]/inscripcion → inscribirse (estudiante)
// DELETE /api/cursos/[id]/inscripcion → darse de baja
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeInscribirse, estadoInicialInscripcion } from "@/lib/dominio";
import { notificar } from "@/lib/notificaciones";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "ESTUDIANTE") {
      return NextResponse.json({ error: "Solo los estudiantes pueden inscribirse" }, { status: 403 });
    }

    const { id } = params;
    const curso = await prisma.curso.findUnique({
      where: { id },
      select: {
        id: true,
        profesorId: true,
        activo: true,
        precio: true,
        fechaInicio: true,
        fechaFin: true,
      },
    });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (curso.profesorId === payload.userId) {
      return NextResponse.json({ error: "No puedes inscribirte en tu propio curso" }, { status: 400 });
    }

    // Un curso desactivado o ya finalizado no admite nuevas inscripciones
    const vigencia = puedeInscribirse(curso);
    if (!vigencia.permitido) {
      return NextResponse.json({ error: vigencia.mensaje }, { status: 400 });
    }

    // Gratuito: acceso inmediato. De pago: queda esperando el comprobante y la
    // confirmación del profesor.
    const estado = estadoInicialInscripcion(Number(curso.precio));

    let inscripcion;
    try {
      inscripcion = await prisma.inscripcion.create({
        data: { cursoId: id, estudianteId: payload.userId, estado },
        select: { id: true, estado: true },
      });
    } catch (error) {
      // Violación de la restricción única → ya estaba inscrito
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Ya estás inscrito en este curso" }, { status: 409 });
      }
      throw error;
    }

    // Avisar al profesor de que tiene un pago por revisar
    if (estado === "PENDIENTE_PAGO") {
      const curso2 = await prisma.curso.findUnique({
        where: { id },
        select: { titulo: true },
      });
      await notificar({
        usuarioId: curso.profesorId,
        tipo: "RESERVA_NUEVA",
        mensaje: `${payload.nombre} quiere inscribirse en "${curso2?.titulo ?? "tu curso"}" y debe pagar`,
        enlace: `/cursos/${id}`,
      });
    }

    return NextResponse.json(
      {
        mensaje:
          estado === "ACTIVA"
            ? "Inscripción exitosa"
            : "Inscripción registrada. Realiza el pago y envía tu comprobante.",
        inscripcion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inscribiendo al curso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;
    await prisma.inscripcion.deleteMany({
      where: { cursoId: id, estudianteId: payload.userId },
    });

    return NextResponse.json({ mensaje: "Te has dado de baja del curso" });
  } catch (error) {
    console.error("Error dándose de baja:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
