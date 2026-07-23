// =============================================
// ClasesYa - API: Curso por ID (aula virtual)
// GET    /api/cursos/[id] → detalle; el material solo se incluye para el dueño
//                           o estudiantes inscritos.
// DELETE /api/cursos/[id] → desactivar el curso (solo el profesor dueño)
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

    const curso = await prisma.curso.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        activo: true,
        createdAt: true,
        profesorId: true,
        profesor: { select: { id: true, nombre: true, foto: true, verificado: true } },
        _count: { select: { inscripciones: true, materiales: true } },
      },
    });

    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const esDueño = payload?.userId === curso.profesorId;

    let estaInscrito = false;
    if (payload && !esDueño) {
      const inscripcion = await prisma.inscripcion.findUnique({
        where: { cursoId_estudianteId: { cursoId: id, estudianteId: payload.userId } },
        select: { id: true },
      });
      estaInscrito = Boolean(inscripcion);
    }

    // El material solo se entrega a quien tiene acceso.
    let materiales: unknown[] = [];
    if (puedeVerMaterial({ esDueño, estaInscrito })) {
      materiales = await prisma.material.findMany({
        where: { cursoId: id },
        select: { id: true, titulo: true, url: true, formato: true, bytes: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
    }

    // Quitamos profesorId del objeto expuesto (ya viene en profesor.id)
    const { profesorId: _omit, ...cursoPublico } = curso;
    void _omit;

    return NextResponse.json({
      curso: cursoPublico,
      esDueño,
      estaInscrito,
      puedeVerMaterial: puedeVerMaterial({ esDueño, estaInscrito }),
      materiales,
    });
  } catch (error) {
    console.error("Error obteniendo curso:", error);
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
    const curso = await prisma.curso.findUnique({ where: { id }, select: { profesorId: true } });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "No tienes permiso sobre este curso" }, { status: 403 });
    }

    await prisma.curso.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ mensaje: "Curso desactivado" });
  } catch (error) {
    console.error("Error eliminando curso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
