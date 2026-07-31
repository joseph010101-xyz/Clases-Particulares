// =============================================
// ClasesYa - API: Inscripciones de un curso (vista del profesor)
// GET /api/cursos/[id]/inscripciones → alumnos, estado y comprobantes
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;
    const curso = await prisma.curso.findUnique({
      where: { id },
      select: { profesorId: true },
    });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "Solo el profesor del curso puede verlas" }, { status: 403 });
    }

    const inscripciones = await prisma.inscripcion.findMany({
      where: { cursoId: id },
      select: {
        id: true,
        estado: true,
        createdAt: true,
        estudiante: { select: { id: true, nombre: true, email: true, foto: true } },
        pago: {
          select: {
            monto: true,
            metodoPago: true,
            estado: true,
            referencia: true,
            comprobanteUrl: true,
            motivoRechazo: true,
            createdAt: true,
          },
        },
      },
      // Primero lo que requiere acción del profesor
      orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ inscripciones });
  } catch (error) {
    console.error("Error listando inscripciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
