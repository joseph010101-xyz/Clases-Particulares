// =============================================
// ClasesYa - API: Borrar material de un curso
// DELETE /api/cursos/[id]/materiales/[materialId] → solo el profesor dueño
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { eliminarArchivo, cloudinaryDisponible } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id, materialId } = params;

    const material = await prisma.material.findFirst({
      where: { id: materialId, cursoId: id },
      select: { id: true, publicId: true, curso: { select: { profesorId: true } } },
    });
    if (!material) {
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
    }
    if (material.curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "No tienes permiso sobre este material" }, { status: 403 });
    }

    // Borrar primero en Cloudinary (si está configurado) y luego en la BD.
    if (cloudinaryDisponible()) {
      try {
        await eliminarArchivo(material.publicId);
      } catch (e) {
        console.error("No se pudo borrar el archivo en Cloudinary:", e);
      }
    }
    await prisma.material.delete({ where: { id: materialId } });

    return NextResponse.json({ mensaje: "Material eliminado" });
  } catch (error) {
    console.error("Error eliminando material:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
