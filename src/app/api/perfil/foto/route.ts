// =============================================
// ClasesYa - API: Foto de perfil
// POST   /api/perfil/foto → subir o reemplazar la foto (multipart: archivo)
// DELETE /api/perfil/foto → quitar la foto actual
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { subirArchivo, eliminarArchivo, cloudinaryDisponible } from "@/lib/cloudinary";
import { MAX_BYTES_FOTO, esImagenPermitida } from "@/lib/dominio";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!cloudinaryDisponible()) {
      return NextResponse.json(
        { error: "El almacenamiento de imágenes no está configurado." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const archivo = formData.get("archivo");

    if (!(archivo instanceof File) || archivo.size === 0) {
      return NextResponse.json({ error: "Debes adjuntar una imagen" }, { status: 400 });
    }
    if (archivo.size > MAX_BYTES_FOTO) {
      return NextResponse.json({ error: "La imagen supera el límite de 5 MB" }, { status: 413 });
    }
    if (!esImagenPermitida(archivo.name)) {
      return NextResponse.json(
        { error: "Formato no admitido. Usa una imagen JPG, PNG, WEBP o GIF." },
        { status: 400 }
      );
    }

    // Foto anterior, para reemplazarla después de subir la nueva
    const actual = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { fotoPublicId: true },
    });

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const subida = await subirArchivo(buffer, "clasesya/perfiles", archivo.name);

    const usuario = await prisma.usuario.update({
      where: { id: payload.userId },
      data: { foto: subida.url, fotoPublicId: subida.publicId },
      select: { id: true, foto: true },
    });

    // Borrar la anterior una vez guardada la nueva (si falla, no rompe nada)
    if (actual?.fotoPublicId) {
      try {
        await eliminarArchivo(actual.fotoPublicId, "image");
      } catch (e) {
        console.error("No se pudo borrar la foto anterior:", e);
      }
    }

    return NextResponse.json({ mensaje: "Foto actualizada", foto: usuario.foto });
  } catch (error) {
    console.error("Error subiendo la foto de perfil:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const actual = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { fotoPublicId: true },
    });

    await prisma.usuario.update({
      where: { id: payload.userId },
      data: { foto: null, fotoPublicId: null },
    });

    if (actual?.fotoPublicId && cloudinaryDisponible()) {
      try {
        await eliminarArchivo(actual.fotoPublicId, "image");
      } catch (e) {
        console.error("No se pudo borrar la foto en el almacenamiento:", e);
      }
    }

    return NextResponse.json({ mensaje: "Foto eliminada" });
  } catch (error) {
    console.error("Error eliminando la foto de perfil:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
