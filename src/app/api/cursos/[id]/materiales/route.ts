// =============================================
// ClasesYa - API: Material de un curso
// POST /api/cursos/[id]/materiales → subir un archivo (solo el profesor dueño)
// Recibe multipart/form-data: { titulo, archivo }
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { materialSchema } from "@/lib/validations";
import { subirArchivo, cloudinaryDisponible } from "@/lib/cloudinary";

export const runtime = "nodejs";

// Límite de tamaño por archivo (15 MB) para no agotar la memoria del servidor.
const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;
    const curso = await prisma.curso.findUnique({ where: { id }, select: { profesorId: true } });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "Solo el profesor del curso puede subir material" }, { status: 403 });
    }

    if (!cloudinaryDisponible()) {
      return NextResponse.json(
        { error: "El almacenamiento de archivos no está configurado (Cloudinary)." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const titulo = formData.get("titulo");
    const archivo = formData.get("archivo");

    const resultado = materialSchema.safeParse({ titulo });
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (!(archivo instanceof File) || archivo.size === 0) {
      return NextResponse.json({ error: "Debes adjuntar un archivo" }, { status: 400 });
    }
    if (archivo.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el límite de 15 MB" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const subido = await subirArchivo(buffer, `clasesya/cursos/${id}`, archivo.name);

    const material = await prisma.material.create({
      data: {
        cursoId: id,
        titulo: resultado.data.titulo,
        url: subido.url,
        publicId: subido.publicId,
        formato: subido.formato,
        bytes: subido.bytes,
      },
      select: { id: true, titulo: true, url: true, formato: true, bytes: true, createdAt: true },
    });

    return NextResponse.json({ mensaje: "Material subido", material }, { status: 201 });
  } catch (error) {
    console.error("Error subiendo material:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
