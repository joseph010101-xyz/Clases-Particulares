// =============================================
// ClasesYa - API: Inscripción a un curso
// POST   /api/cursos/[id]/inscripcion → inscribirse (estudiante)
// DELETE /api/cursos/[id]/inscripcion → darse de baja
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";

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
    const curso = await prisma.curso.findFirst({
      where: { id, activo: true },
      select: { id: true, profesorId: true },
    });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado o inactivo" }, { status: 404 });
    }
    if (curso.profesorId === payload.userId) {
      return NextResponse.json({ error: "No puedes inscribirte en tu propio curso" }, { status: 400 });
    }

    try {
      await prisma.inscripcion.create({
        data: { cursoId: id, estudianteId: payload.userId },
      });
    } catch (error) {
      // Violación de la restricción única → ya estaba inscrito
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Ya estás inscrito en este curso" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ mensaje: "Inscripción exitosa" }, { status: 201 });
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
