// =============================================
// ClasesYa - API: Descarga de la entrega de una tarea
// GET /api/entregas/[id]/descargar → solo su autor y el profesor del curso.
// El trabajo de un estudiante no lo ven sus compañeros.
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { servirArchivo, nombreDeArchivo } from "@/lib/descargas";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const entrega = await prisma.entrega.findUnique({
      where: { id: params.id },
      select: {
        url: true,
        formato: true,
        estudianteId: true,
        estudiante: { select: { nombre: true } },
        tarea: {
          select: { titulo: true, curso: { select: { profesorId: true } } },
        },
      },
    });
    if (!entrega || !entrega.url) {
      return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 });
    }

    const esAutor = entrega.estudianteId === payload.userId;
    const esProfesor = entrega.tarea.curso.profesorId === payload.userId;
    if (!esAutor && !esProfesor) {
      return NextResponse.json(
        { error: "No tienes permiso para ver esta entrega" },
        { status: 403 }
      );
    }

    const nombre = `${entrega.tarea.titulo} - ${entrega.estudiante.nombre}`;
    return servirArchivo(entrega.url, nombreDeArchivo(nombre, entrega.formato));
  } catch (error) {
    console.error("Error descargando entrega:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
