// =============================================
// ClasesYa - API: Pago de una inscripción a curso
// GET  /api/cursos/[id]/pago → datos para pagar + estado de mi inscripción
// POST /api/cursos/[id]/pago → enviar el comprobante (multipart)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { subirArchivo, eliminarArchivo, cloudinaryDisponible, type TipoRecurso } from "@/lib/cloudinary";
import {
  canalesDisponibles,
  puedeEnviarComprobante,
  esCursoGratuito,
  MAX_BYTES_ARCHIVO,
  esArchivoPermitido,
  type MetodoPago,
} from "@/lib/dominio";
import { notificar } from "@/lib/notificaciones";

export const runtime = "nodejs";

const METODOS: MetodoPago[] = ["EFECTIVO", "QR", "TRANSFERENCIA", "TIGO_MONEY"];

// Datos que el estudiante necesita para pagar
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
      select: {
        id: true,
        titulo: true,
        precio: true,
        profesorId: true,
        profesor: { select: { nombre: true, verificado: true } },
      },
    });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { cursoId_estudianteId: { cursoId: id, estudianteId: payload.userId } },
      select: {
        id: true,
        estado: true,
        pago: {
          select: {
            metodoPago: true,
            referencia: true,
            comprobanteUrl: true,
            estado: true,
            motivoRechazo: true,
            createdAt: true,
          },
        },
      },
    });
    if (!inscripcion) {
      return NextResponse.json({ error: "No estás inscrito en este curso" }, { status: 404 });
    }

    // La cuenta y el QR del profesor solo se revelan a quien realmente debe
    // pagar: en un curso gratuito o ya activo no hay motivo para exponerlos.
    const debePagar = puedeEnviarComprobante(inscripcion.estado);
    const datosCobro = debePagar
      ? await prisma.datosCobro.findUnique({
          where: { profesorId: curso.profesorId },
          select: {
            qrUrl: true,
            banco: true,
            titular: true,
            numeroCuenta: true,
            tigoMoney: true,
            instrucciones: true,
          },
        })
      : null;

    return NextResponse.json({
      curso: {
        id: curso.id,
        titulo: curso.titulo,
        precio: curso.precio,
        gratuito: esCursoGratuito(Number(curso.precio)),
      },
      // El aviso de confianza: el estudiante decide sabiendo si está verificado
      profesor: { nombre: curso.profesor.nombre, verificado: curso.profesor.verificado },
      inscripcion: { id: inscripcion.id, estado: inscripcion.estado },
      pago: inscripcion.pago,
      datosCobro,
      canales: canalesDisponibles(datosCobro),
    });
  } catch (error) {
    console.error("Error consultando el pago del curso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// El estudiante envía su comprobante
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
    const curso = await prisma.curso.findUnique({
      where: { id },
      select: { id: true, titulo: true, precio: true, profesorId: true },
    });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (esCursoGratuito(Number(curso.precio))) {
      return NextResponse.json({ error: "Este curso es gratuito, no requiere pago" }, { status: 400 });
    }

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { cursoId_estudianteId: { cursoId: id, estudianteId: payload.userId } },
      select: { id: true, estado: true, pago: { select: { id: true, comprobantePublicId: true, comprobanteTipo: true } } },
    });
    if (!inscripcion) {
      return NextResponse.json({ error: "Primero debes inscribirte en el curso" }, { status: 404 });
    }
    if (!puedeEnviarComprobante(inscripcion.estado)) {
      return NextResponse.json(
        { error: "Tu inscripción ya está activa: no hace falta enviar comprobante" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const metodo = String(formData.get("metodoPago") ?? "");
    const referencia = (formData.get("referencia") as string | null)?.trim() || null;
    const archivo = formData.get("comprobante");

    if (!METODOS.includes(metodo as MetodoPago)) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    const hayArchivo = archivo instanceof File && archivo.size > 0;
    if (!hayArchivo && !referencia) {
      return NextResponse.json(
        { error: "Adjunta el comprobante o indica el número de transacción" },
        { status: 400 }
      );
    }

    let datosArchivo: { url: string; publicId: string; tipoRecurso: TipoRecurso } | null = null;
    if (hayArchivo) {
      const file = archivo as File;
      if (file.size > MAX_BYTES_ARCHIVO) {
        return NextResponse.json({ error: "El comprobante supera el límite de 15 MB" }, { status: 413 });
      }
      if (!esArchivoPermitido(file.name)) {
        return NextResponse.json(
          { error: "Sube una imagen o PDF del comprobante" },
          { status: 400 }
        );
      }
      if (!cloudinaryDisponible()) {
        return NextResponse.json(
          { error: "El almacenamiento de archivos no está configurado." },
          { status: 503 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      datosArchivo = await subirArchivo(buffer, `clasesya/comprobantes/${id}`, file.name);
    }

    const anterior = inscripcion.pago;

    await prisma.pago.upsert({
      where: { inscripcionId: inscripcion.id },
      create: {
        inscripcionId: inscripcion.id,
        monto: curso.precio,
        metodoPago: metodo as MetodoPago,
        estado: "PENDIENTE",
        referencia,
        comprobanteUrl: datosArchivo?.url ?? null,
        comprobantePublicId: datosArchivo?.publicId ?? null,
        comprobanteTipo: datosArchivo?.tipoRecurso ?? null,
      },
      update: {
        metodoPago: metodo as MetodoPago,
        estado: "PENDIENTE",
        referencia,
        motivoRechazo: null,
        revisadoEn: null,
        ...(datosArchivo
          ? {
              comprobanteUrl: datosArchivo.url,
              comprobantePublicId: datosArchivo.publicId,
              comprobanteTipo: datosArchivo.tipoRecurso,
            }
          : {}),
      },
    });

    // Reenviar tras un rechazo vuelve a dejar la inscripción a la espera
    if (inscripcion.estado === "RECHAZADA") {
      await prisma.inscripcion.update({
        where: { id: inscripcion.id },
        data: { estado: "PENDIENTE_PAGO" },
      });
    }

    // Sustituir el comprobante anterior en el almacenamiento
    if (datosArchivo && anterior?.comprobantePublicId && cloudinaryDisponible()) {
      try {
        await eliminarArchivo(
          anterior.comprobantePublicId,
          (anterior.comprobanteTipo as TipoRecurso) ?? "image"
        );
      } catch (e) {
        console.error("No se pudo borrar el comprobante anterior:", e);
      }
    }

    await notificar({
      usuarioId: curso.profesorId,
      tipo: "PAGO_RECIBIDO",
      mensaje: `${payload.nombre} envió el comprobante de pago de "${curso.titulo}"`,
      enlace: `/cursos/${id}`,
    });

    return NextResponse.json({ mensaje: "Comprobante enviado. El profesor lo revisará." }, { status: 201 });
  } catch (error) {
    console.error("Error registrando el comprobante:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
