// =============================================
// ClasesYa - API: Profesores
// GET  /api/profesores → listar profesores con sus servicios
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promedioCalificaciones } from "@/lib/dominio";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parámetros de búsqueda opcionales
    const materia = searchParams.get("materia");
    const modalidad = searchParams.get("modalidad");
    const ubicacion = searchParams.get("ubicacion");
    const pagina = parseInt(searchParams.get("pagina") || "1");
    const limite = Math.min(parseInt(searchParams.get("limite") || "12"), 50);

    // Construir filtro dinámico
    const where = {
      rol: "PROFESOR" as const,
      activo: true,
      // Si se filtra por materia, buscar profesores que tengan un servicio con esa materia
      ...(materia || modalidad
        ? {
            servicios: {
              some: {
                activo: true,
                ...(materia && {
                  materia: { contains: materia, mode: "insensitive" as const },
                }),
                ...(modalidad && {
                  modalidad: modalidad as "PRESENCIAL" | "VIRTUAL" | "AMBOS",
                }),
              },
            },
          }
        : {}),
      ...(ubicacion && {
        ubicacion: { contains: ubicacion, mode: "insensitive" as const },
      }),
    };

    // Obtener profesores con paginación
    const [profesoresRaw, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          foto: true,
          bio: true,
          ubicacion: true,
          verificado: true,
          servicios: {
            where: { activo: true },
            select: {
              id: true,
              materia: true,
              precioHora: true,
              modalidad: true,
              nivel: true,
              reservas: {
                where: { resena: { isNot: null } },
                select: { resena: { select: { calificacion: true } } },
              },
            },
          },
        },
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { createdAt: "desc" },
      }),
      prisma.usuario.count({ where }),
    ]);

    // Compute per-professor rating and strip raw reservas from services
    const profesores = profesoresRaw.map((p) => {
      const calificaciones = p.servicios
        .flatMap((s) => s.reservas.map((r) => r.resena?.calificacion))
        .filter((c): c is number => c != null);
      return {
        ...p,
        servicios: p.servicios.map((s) => ({
          id: s.id,
          materia: s.materia,
          precioHora: s.precioHora,
          modalidad: s.modalidad,
          nivel: s.nivel,
        })),
        calificacionPromedio: promedioCalificaciones(calificaciones),
        totalResenas: calificaciones.length,
      };
    });

    return NextResponse.json({
      profesores,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error listando profesores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
