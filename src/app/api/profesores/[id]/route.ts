// =============================================
// ClasesYa - API: Profesor por ID
// GET /api/profesores/[id] → perfil completo del profesor
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promedioCalificaciones } from "@/lib/dominio";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const profesor = await prisma.usuario.findFirst({
      where: {
        id,
        rol: "PROFESOR",
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        foto: true,
        bio: true,
        ubicacion: true,
        createdAt: true,
        servicios: {
          where: { activo: true },
          select: {
            id: true,
            materia: true,
            descripcion: true,
            precioHora: true,
            modalidad: true,
            nivel: true,
            duracionMin: true,
            // Incluir calificación promedio a partir de reseñas
            reservas: {
              where: { estado: "COMPLETADA" },
              select: {
                resena: {
                  select: {
                    calificacion: true,
                    comentario: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
        disponibilidad: {
          select: {
            id: true,
            diaSemana: true,
            horaInicio: true,
            horaFin: true,
          },
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
        },
      },
    });

    if (!profesor) {
      return NextResponse.json(
        { error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    // Calcular calificación promedio por servicio
    const serviciosConCalificacion = profesor.servicios.map((servicio) => {
      const resenas = servicio.reservas
        .map((r) => r.resena)
        .filter(Boolean);
      const calificaciones = resenas
        .map((r) => r?.calificacion)
        .filter((c): c is number => c != null);
      // Remover reservas del response (ya extrajimos las reseñas)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reservas: _, ...servicioSinReservas } = servicio;
      return {
        ...servicioSinReservas,
        calificacionPromedio: promedioCalificaciones(calificaciones),
        totalResenas: resenas.length,
        resenas: resenas.slice(0, 5), // Últimas 5 reseñas
      };
    });

    return NextResponse.json({
      profesor: {
        ...profesor,
        servicios: serviciosConCalificacion,
      },
    });
  } catch (error) {
    console.error("Error obteniendo profesor:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
