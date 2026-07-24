// =============================================
// ClasesYa - API: Tarea por ID
// GET    /api/tareas/[id] → detalle; el dueño ve todas las entregas, el
//                           estudiante inscrito solo la suya.
// DELETE /api/tareas/[id] → borrar la tarea (solo el profesor dueño)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
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

    const tarea = await prisma.tarea.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fechaLimite: true,
        createdAt: true,
        curso: { select: { id: true, titulo: true, profesorId: true } },
      },
    });
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    const esDueño = tarea.curso.profesorId === payload.userId;
    const estaInscrito = esDueño
      ? false
      : Boolean(
          await prisma.inscripcion.findUnique({
            where: { cursoId_estudianteId: { cursoId: tarea.curso.id, estudianteId: payload.userId } },
            select: { id: true },
          })
        );

    if (!puedeVerMaterial({ esDueño, estaInscrito })) {
      return NextResponse.json({ error: "Sin acceso a esta tarea" }, { status: 403 });
    }

    if (esDueño) {
      // El profesor ve todas las entregas
      const entregas = await prisma.entrega.findMany({
        where: { tareaId: id },
        select: {
          id: true,
          comentario: true,
          url: true,
          formato: true,
          bytes: true,
          calificacion: true,
          retroalimentacion: true,
          createdAt: true,
          estudiante: { select: { id: true, nombre: true, foto: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ tarea, esDueño: true, entregas });
    }

    // El estudiante solo ve su propia entrega
    const miEntrega = await prisma.entrega.findUnique({
      where: { tareaId_estudianteId: { tareaId: id, estudianteId: payload.userId } },
      select: {
        id: true,
        comentario: true,
        url: true,
        formato: true,
        bytes: true,
        calificacion: true,
        retroalimentacion: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ tarea, esDueño: false, miEntrega });
  } catch (error) {
    console.error("Error obteniendo tarea:", error);
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
    const tarea = await prisma.tarea.findUnique({
      where: { id },
      select: { curso: { select: { profesorId: true } } },
    });
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    if (tarea.curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "No tienes permiso sobre esta tarea" }, { status: 403 });
    }

    await prisma.tarea.delete({ where: { id } });
    return NextResponse.json({ mensaje: "Tarea eliminada" });
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
