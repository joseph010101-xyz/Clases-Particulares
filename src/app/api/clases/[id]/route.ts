// =============================================
// ClasesYa - API: Servicio por ID
// GET    /api/clases/[id] → detalle del servicio
// PUT    /api/clases/[id] → editar servicio (solo el profesor dueño)
// DELETE /api/clases/[id] → desactivar servicio
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { servicioSchema } from "@/lib/validations";
import { promedioCalificaciones } from "@/lib/dominio";

// Obtener detalle de un servicio
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const servicio = await prisma.servicio.findFirst({
      where: { id, activo: true },
      select: {
        id: true,
        materia: true,
        descripcion: true,
        precioHora: true,
        modalidad: true,
        nivel: true,
        duracionMin: true,
        createdAt: true,
        profesor: {
          select: {
            id: true,
            nombre: true,
            foto: true,
            bio: true,
            ubicacion: true,
            disponibilidad: {
              select: {
                diaSemana: true,
                horaInicio: true,
                horaFin: true,
              },
              orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
            },
          },
        },
        reservas: {
          where: { estado: "COMPLETADA", resena: { isNot: null } },
          select: {
            resena: {
              select: {
                calificacion: true,
                comentario: true,
                createdAt: true,
              },
            },
            estudiante: {
              select: { nombre: true, foto: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!servicio) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    // Calcular calificación promedio
    const calificaciones = servicio.reservas
      .map((r) => r.resena?.calificacion)
      .filter((c): c is number => c != null);
    const calificacionPromedio = promedioCalificaciones(calificaciones);
    const resenas = servicio.reservas.map((r) => r.resena).filter(Boolean);

    return NextResponse.json({
      servicio: {
        ...servicio,
        calificacionPromedio,
        totalResenas: resenas.length,
      },
    });
  } catch (error) {
    console.error("Error obteniendo servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Editar un servicio (solo el profesor dueño)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;

    // Verificar que el servicio pertenece al profesor
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id },
      select: { profesorId: true },
    });

    if (!servicioExistente) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    if (servicioExistente.profesorId !== payload.userId) {
      return NextResponse.json(
        { error: "No tienes permiso para editar este servicio" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const resultado = servicioSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const servicio = await prisma.servicio.update({
      where: { id },
      data: resultado.data,
    });

    return NextResponse.json({ mensaje: "Servicio actualizado", servicio });
  } catch (error) {
    console.error("Error actualizando servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Desactivar servicio (soft delete)
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

    const servicioExistente = await prisma.servicio.findUnique({
      where: { id },
      select: { profesorId: true },
    });

    if (!servicioExistente) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    if (servicioExistente.profesorId !== payload.userId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este servicio" },
        { status: 403 }
      );
    }

    // Soft delete: solo desactivar
    await prisma.servicio.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ mensaje: "Servicio eliminado" });
  } catch (error) {
    console.error("Error eliminando servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
