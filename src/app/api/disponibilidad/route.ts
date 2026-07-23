// =============================================
// ClasesYa - API: Disponibilidad
// GET    /api/disponibilidad → listar disponibilidad del profesor autenticado
// POST   /api/disponibilidad → crear bloque de disponibilidad
// DELETE /api/disponibilidad → eliminar bloque por ID (query param)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { disponibilidadSchema } from "@/lib/validations";

// Listar disponibilidad del profesor autenticado (o de un profesor por query param)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profesorId = searchParams.get("profesorId");

    // Si se pide por profesorId (público, para que estudiantes vean horarios)
    if (profesorId) {
      const disponibilidad = await prisma.disponibilidad.findMany({
        where: { profesorId },
        orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      });
      return NextResponse.json({ disponibilidad });
    }

    // Si no, requiere autenticación como profesor
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo profesores pueden gestionar disponibilidad" }, { status: 403 });
    }

    const disponibilidad = await prisma.disponibilidad.findMany({
      where: { profesorId: payload.userId },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    });

    return NextResponse.json({ disponibilidad });
  } catch (error) {
    console.error("Error listando disponibilidad:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Crear un bloque de disponibilidad
export async function POST(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo profesores pueden crear disponibilidad" }, { status: 403 });
    }

    const body = await request.json();
    const resultado = disponibilidadSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { diaSemana, horaInicio, horaFin } = resultado.data;

    // Verificar que no se solape con otra disponibilidad del mismo día
    const existente = await prisma.disponibilidad.findFirst({
      where: {
        profesorId: payload.userId,
        diaSemana,
        AND: [
          { horaInicio: { lt: horaFin } },
          { horaFin: { gt: horaInicio } },
        ],
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya tienes un bloque de disponibilidad que se solapa en ese horario" },
        { status: 409 }
      );
    }

    const disponibilidad = await prisma.disponibilidad.create({
      data: {
        profesorId: payload.userId,
        diaSemana,
        horaInicio,
        horaFin,
      },
    });

    return NextResponse.json(
      { mensaje: "Disponibilidad creada", disponibilidad },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando disponibilidad:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Eliminar un bloque de disponibilidad
export async function DELETE(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo profesores pueden eliminar disponibilidad" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Verificar que pertenece al profesor
    const disponibilidad = await prisma.disponibilidad.findFirst({
      where: { id, profesorId: payload.userId },
    });

    if (!disponibilidad) {
      return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });
    }

    await prisma.disponibilidad.delete({ where: { id } });

    return NextResponse.json({ mensaje: "Disponibilidad eliminada" });
  } catch (error) {
    console.error("Error eliminando disponibilidad:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
