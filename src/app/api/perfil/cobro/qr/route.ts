// =============================================
// ClasesYa - API: Imagen del QR de cobro
// POST   /api/perfil/cobro/qr → subir o reemplazar el QR (multipart: archivo)
// DELETE /api/perfil/cobro/qr → quitar el QR
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
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo los profesores pueden configurar cobros" }, { status: 403 });
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
      return NextResponse.json({ error: "Debes adjuntar la imagen de tu QR" }, { status: 400 });
    }
    if (archivo.size > MAX_BYTES_FOTO) {
      return NextResponse.json({ error: "La imagen supera el límite de 5 MB" }, { status: 413 });
    }
    if (!esImagenPermitida(archivo.name)) {
      return NextResponse.json(
        { error: "Formato no admitido. Sube una captura JPG, PNG o WEBP de tu QR." },
        { status: 400 }
      );
    }

    const previo = await prisma.datosCobro.findUnique({
      where: { profesorId: payload.userId },
      select: { qrPublicId: true },
    });

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const subida = await subirArchivo(buffer, "clasesya/cobros", archivo.name);

    const datos = await prisma.datosCobro.upsert({
      where: { profesorId: payload.userId },
      create: { profesorId: payload.userId, qrUrl: subida.url, qrPublicId: subida.publicId },
      update: { qrUrl: subida.url, qrPublicId: subida.publicId },
    });

    // Sustituir el QR anterior una vez guardado el nuevo
    if (previo?.qrPublicId) {
      try {
        await eliminarArchivo(previo.qrPublicId, "image");
      } catch (e) {
        console.error("No se pudo borrar el QR anterior:", e);
      }
    }

    return NextResponse.json({ mensaje: "QR actualizado", qrUrl: datos.qrUrl });
  } catch (error) {
    console.error("Error subiendo el QR de cobro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const previo = await prisma.datosCobro.findUnique({
      where: { profesorId: payload.userId },
      select: { qrPublicId: true },
    });
    if (!previo) {
      return NextResponse.json({ mensaje: "No había QR configurado" });
    }

    await prisma.datosCobro.update({
      where: { profesorId: payload.userId },
      data: { qrUrl: null, qrPublicId: null },
    });

    if (previo.qrPublicId && cloudinaryDisponible()) {
      try {
        await eliminarArchivo(previo.qrPublicId, "image");
      } catch (e) {
        console.error("No se pudo borrar el QR en el almacenamiento:", e);
      }
    }

    return NextResponse.json({ mensaje: "QR eliminado" });
  } catch (error) {
    console.error("Error eliminando el QR de cobro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
