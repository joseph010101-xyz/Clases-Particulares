// =============================================
// ClasesYa - API: Tareas de un curso
// GET  /api/cursos/[id]/tareas → listar tareas (dueño o inscrito)
// POST /api/cursos/[id]/tareas → crear tarea (solo el profesor dueño)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tareaSchema } from "@/lib/validations";
import { puedeVerMaterial } from "@/lib/dominio/cursos";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const curso = await prisma.curso.findUnique({ where: { id }, select: { profesorId: true } });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const esDueño = curso.profesorId === payload.userId;
    const estaInscrito = esDueño
      ? false
      : Boolean(
          await prisma.inscripcion.findUnique({
            where: { cursoId_estudianteId: { cursoId: id, estudianteId: payload.userId } },
            select: { id: true },
          })
        );

    if (!puedeVerMaterial({ esDueño, estaInscrito })) {
      return NextResponse.json({ error: "Inscríbete para ver las tareas" }, { status: 403 });
    }

    const tareas = await prisma.tarea.findMany({
      where: { cursoId: id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fechaLimite: true,
        createdAt: true,
        _count: { select: { entregas: true } },
        // La entrega del estudiante actual (si es estudiante)
        entregas: esDueño
          ? false
          : {
              where: { estudianteId: payload.userId },
              select: { id: true, calificacion: true, createdAt: true },
            },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tareas, esDueño });
  } catch (error) {
    console.error("Error listando tareas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;
    const curso = await prisma.curso.findUnique({ where: { id }, select: { profesorId: true } });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "Solo el profesor del curso puede crear tareas" }, { status: 403 });
    }

    const body = await request.json();
    const resultado = tareaSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { titulo, descripcion, fechaLimite } = resultado.data;
    const tarea = await prisma.tarea.create({
      data: {
        cursoId: id,
        titulo,
        descripcion,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
      },
      select: { id: true, titulo: true },
    });

    return NextResponse.json({ mensaje: "Tarea creada", tarea }, { status: 201 });
  } catch (error) {
    console.error("Error creando tarea:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
