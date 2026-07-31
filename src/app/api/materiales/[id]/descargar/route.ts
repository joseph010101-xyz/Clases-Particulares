// =============================================
// ClasesYa - API: Descarga de un material del aula
// GET /api/materiales/[id]/descargar → entrega el archivo si quien lo pide
// tiene derecho a verlo. La URL del almacenamiento nunca sale de aquí.
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { inscripcionDaAcceso } from "@/lib/dominio";
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

    const material = await prisma.material.findUnique({
      where: { id: params.id },
      select: {
        titulo: true,
        url: true,
        formato: true,
        curso: { select: { id: true, profesorId: true } },
      },
    });
    if (!material || !material.url) {
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
    }

    // El profesor entra siempre a su propio material; el estudiante, solo con
    // la inscripción activa (con el pago pendiente todavía no).
    if (material.curso.profesorId !== payload.userId) {
      const inscripcion = await prisma.inscripcion.findUnique({
        where: {
          cursoId_estudianteId: {
            cursoId: material.curso.id,
            estudianteId: payload.userId,
          },
        },
        select: { estado: true },
      });
      if (!inscripcionDaAcceso(inscripcion?.estado)) {
        return NextResponse.json(
          { error: "Necesitas una inscripción activa para abrir este material" },
          { status: 403 }
        );
      }
    }

    return servirArchivo(material.url, nombreDeArchivo(material.titulo, material.formato));
  } catch (error) {
    console.error("Error descargando material:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
