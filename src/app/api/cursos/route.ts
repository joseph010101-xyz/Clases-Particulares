// =============================================
// ClasesYa - API: Cursos (aula virtual)
// GET  /api/cursos            → cursos activos (o ?mios / ?inscrito del usuario)
// POST /api/cursos            → crear un curso (solo profesores)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { cursoSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mios = searchParams.get("mios") === "true";
    const inscrito = searchParams.get("inscrito") === "true";

    // Filtros que dependen del usuario autenticado
    if (mios || inscrito) {
      const payload = await obtenerUsuarioActual();
      if (!payload) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
      const where = mios
        ? { profesorId: payload.userId }
        : { inscripciones: { some: { estudianteId: payload.userId } } };

      const cursos = await prisma.curso.findMany({
        where,
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          activo: true,
          createdAt: true,
          profesor: { select: { id: true, nombre: true, foto: true, verificado: true } },
          _count: { select: { inscripciones: true, materiales: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ cursos });
    }

    // Catálogo público de cursos activos
    const cursos = await prisma.curso.findMany({
      where: { activo: true, profesor: { activo: true } },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        createdAt: true,
        profesor: { select: { id: true, nombre: true, foto: true, verificado: true } },
        _count: { select: { inscripciones: true, materiales: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ cursos });
  } catch (error) {
    console.error("Error listando cursos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo los profesores pueden crear cursos" }, { status: 403 });
    }

    const body = await request.json();
    const resultado = cursoSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const curso = await prisma.curso.create({
      data: { ...resultado.data, profesorId: payload.userId },
      select: { id: true, titulo: true },
    });

    return NextResponse.json({ mensaje: "Curso creado", curso }, { status: 201 });
  } catch (error) {
    console.error("Error creando curso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
