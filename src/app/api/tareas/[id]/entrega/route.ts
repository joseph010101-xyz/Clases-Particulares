// =============================================
// ClasesYa - API: Entrega de una tarea (estudiante)
// POST /api/tareas/[id]/entrega → subir/actualizar la entrega (multipart)
// Campos: { comentario?, archivo? } — al menos uno es obligatorio.
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { subirArchivo, eliminarArchivo, cloudinaryDisponible, type TipoRecurso } from "@/lib/cloudinary";
import {
  MAX_BYTES_ARCHIVO,
  esArchivoPermitido,
  descripcionFormatosPermitidos,
  inscripcionDaAcceso,
} from "@/lib/dominio";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "ESTUDIANTE") {
      return NextResponse.json({ error: "Solo los estudiantes entregan tareas" }, { status: 403 });
    }

    const { id } = params;
    const tarea = await prisma.tarea.findUnique({
      where: { id },
      select: { id: true, curso: { select: { id: true } } },
    });
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Solo con la inscripción activa: con el pago pendiente no se puede entregar
    const inscrito = await prisma.inscripcion.findUnique({
      where: { cursoId_estudianteId: { cursoId: tarea.curso.id, estudianteId: payload.userId } },
      select: { estado: true },
    });
    if (!inscripcionDaAcceso(inscrito?.estado)) {
      return NextResponse.json(
        { error: "Necesitas una inscripción activa en el curso para entregar" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const comentario = (formData.get("comentario") as string | null)?.trim() || null;
    const archivo = formData.get("archivo");

    const hayArchivo = archivo instanceof File && archivo.size > 0;
    if (!comentario && !hayArchivo) {
      return NextResponse.json({ error: "Adjunta un archivo o escribe un comentario" }, { status: 400 });
    }

    // Subir archivo nuevo (si lo hay)
    let datosArchivo: {
      url: string;
      publicId: string;
      tipoRecurso: TipoRecurso;
      formato?: string;
      bytes?: number;
    } | null = null;
    if (hayArchivo) {
      const file = archivo as File;
      if (file.size > MAX_BYTES_ARCHIVO) {
        return NextResponse.json({ error: "El archivo supera el límite de 15 MB" }, { status: 413 });
      }
      if (!esArchivoPermitido(file.name)) {
        return NextResponse.json(
          { error: `Formato no permitido. Se admiten: ${descripcionFormatosPermitidos()}.` },
          { status: 400 }
        );
      }
      if (!cloudinaryDisponible()) {
        return NextResponse.json(
          { error: "El almacenamiento de archivos no está configurado (Cloudinary)." },
          { status: 503 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const subido = await subirArchivo(buffer, `clasesya/entregas/${id}`, file.name);
      datosArchivo = subido;
    }

    // Entrega previa (para reemplazar el archivo si corresponde)
    const previa = await prisma.entrega.findUnique({
      where: { tareaId_estudianteId: { tareaId: id, estudianteId: payload.userId } },
      select: { id: true, publicId: true, tipoRecurso: true },
    });

    // Al reenviar, la calificación previa se limpia (vuelve a estado por revisar).
    const entrega = await prisma.entrega.upsert({
      where: { tareaId_estudianteId: { tareaId: id, estudianteId: payload.userId } },
      create: {
        tareaId: id,
        estudianteId: payload.userId,
        comentario,
        url: datosArchivo?.url ?? null,
        publicId: datosArchivo?.publicId ?? null,
        tipoRecurso: datosArchivo?.tipoRecurso ?? null,
        formato: datosArchivo?.formato ?? null,
        bytes: datosArchivo?.bytes ?? null,
      },
      update: {
        comentario,
        ...(datosArchivo
          ? {
              url: datosArchivo.url,
              publicId: datosArchivo.publicId,
              tipoRecurso: datosArchivo.tipoRecurso,
              formato: datosArchivo.formato,
              bytes: datosArchivo.bytes,
            }
          : {}),
        calificacion: null,
        retroalimentacion: null,
      },
      select: { id: true, url: true, comentario: true, createdAt: true },
    });

    // Borrar el archivo anterior en Cloudinary si fue reemplazado
    if (datosArchivo && previa?.publicId && cloudinaryDisponible()) {
      try {
        await eliminarArchivo(previa.publicId, (previa.tipoRecurso as TipoRecurso) ?? "raw");
      } catch (e) {
        console.error("No se pudo borrar el archivo anterior:", e);
      }
    }

    return NextResponse.json({ mensaje: "Entrega registrada", entrega }, { status: 201 });
  } catch (error) {
    console.error("Error registrando entrega:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
