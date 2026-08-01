// =============================================
// ClasesYa - API: Pago de una clase particular
// GET   /api/reservas/[id]/pago → cómo pagar y en qué estado está el pago
// POST  /api/reservas/[id]/pago → el estudiante registra su pago (multipart)
// PATCH /api/reservas/[id]/pago → el profesor confirma o rechaza
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { subirArchivo, eliminarArchivo, cloudinaryDisponible, type TipoRecurso } from "@/lib/cloudinary";
import {
  montoReserva,
  reservaRequierePago,
  puedePagarReserva,
  puedeRevisarPagoReserva,
  estadoPagoTrasDecision,
  canalesDisponibles,
  formatearPrecio,
  MAX_BYTES_ARCHIVO,
  esArchivoPermitido,
  type MetodoPago,
  type EstadoPago,
  type EstadoReserva,
} from "@/lib/dominio";
import { notificar } from "@/lib/notificaciones";

export const runtime = "nodejs";

const METODOS: MetodoPago[] = ["EFECTIVO", "QR", "TRANSFERENCIA", "TIGO_MONEY"];

// Datos comunes de la reserva y comprobación de que quien pregunta es parte
async function cargarReserva(id: string) {
  return prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      fecha: true,
      horaInicio: true,
      horaFin: true,
      estudianteId: true,
      servicio: {
        select: {
          materia: true,
          precioHora: true,
          profesorId: true,
          profesor: { select: { nombre: true, verificado: true } },
        },
      },
      pago: {
        select: {
          id: true,
          monto: true,
          metodoPago: true,
          estado: true,
          referencia: true,
          comprobanteUrl: true,
          comprobantePublicId: true,
          comprobanteTipo: true,
          motivoRechazo: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const reserva = await cargarReserva(params.id);
    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const esEstudiante = reserva.estudianteId === payload.userId;
    const esProfesor = reserva.servicio.profesorId === payload.userId;
    if (!esEstudiante && !esProfesor) {
      return NextResponse.json({ error: "No tienes permiso para ver este pago" }, { status: 403 });
    }

    const monto = montoReserva(Number(reserva.servicio.precioHora), reserva.horaInicio, reserva.horaFin);
    const estadoPago = (reserva.pago?.estado ?? null) as EstadoPago | null;

    // La cuenta del profesor solo se le muestra al estudiante que aún debe pagar
    const debePagar =
      esEstudiante &&
      reservaRequierePago(Number(reserva.servicio.precioHora)) &&
      puedePagarReserva(reserva.estado as EstadoReserva, estadoPago).permitido;

    const datosCobro = debePagar
      ? await prisma.datosCobro.findUnique({
          where: { profesorId: reserva.servicio.profesorId },
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
      reserva: {
        id: reserva.id,
        estado: reserva.estado,
        materia: reserva.servicio.materia,
        requierePago: reservaRequierePago(Number(reserva.servicio.precioHora)),
      },
      profesor: {
        nombre: reserva.servicio.profesor.nombre,
        verificado: reserva.servicio.profesor.verificado,
      },
      monto,
      pago: reserva.pago
        ? {
            monto: reserva.pago.monto,
            metodoPago: reserva.pago.metodoPago,
            estado: reserva.pago.estado,
            referencia: reserva.pago.referencia,
            comprobanteUrl: reserva.pago.comprobanteUrl,
            motivoRechazo: reserva.pago.motivoRechazo,
            createdAt: reserva.pago.createdAt,
          }
        : null,
      datosCobro,
      // En una clase presencial el efectivo siempre es una opción, aunque el
      // profesor no haya publicado ninguna cuenta.
      canales: canalesDisponibles(datosCobro),
      puedePagar: debePagar,
    });
  } catch (error) {
    console.error("Error consultando el pago de la reserva:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// El estudiante declara su pago
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const reserva = await cargarReserva(params.id);
    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }
    if (reserva.estudianteId !== payload.userId) {
      return NextResponse.json(
        { error: "Solo el estudiante de la clase puede registrar el pago" },
        { status: 403 }
      );
    }
    if (!reservaRequierePago(Number(reserva.servicio.precioHora))) {
      return NextResponse.json({ error: "Esta clase no tiene costo" }, { status: 400 });
    }

    const permiso = puedePagarReserva(
      reserva.estado as EstadoReserva,
      (reserva.pago?.estado ?? null) as EstadoPago | null
    );
    if (!permiso.permitido) {
      return NextResponse.json({ error: permiso.mensaje }, { status: 400 });
    }

    const formData = await request.formData();
    const metodo = String(formData.get("metodoPago") ?? "") as MetodoPago;
    const referencia = (formData.get("referencia") as string | null)?.trim() || null;
    const archivo = formData.get("comprobante");

    if (!METODOS.includes(metodo)) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    const hayArchivo = archivo instanceof File && archivo.size > 0;
    // El efectivo se entrega en mano: no hay comprobante que subir, basta con
    // que el profesor confirme haberlo recibido.
    if (metodo !== "EFECTIVO" && !hayArchivo && !referencia) {
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
        return NextResponse.json({ error: "Sube una imagen o PDF del comprobante" }, { status: 400 });
      }
      if (!cloudinaryDisponible()) {
        return NextResponse.json(
          { error: "El almacenamiento de archivos no está configurado." },
          { status: 503 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      datosArchivo = await subirArchivo(buffer, `clasesya/comprobantes/${reserva.id}`, file.name);
    }

    const anterior = reserva.pago;
    const monto = montoReserva(Number(reserva.servicio.precioHora), reserva.horaInicio, reserva.horaFin);

    await prisma.pago.upsert({
      where: { reservaId: reserva.id },
      create: {
        reservaId: reserva.id,
        monto,
        metodoPago: metodo,
        estado: "PENDIENTE",
        referencia,
        comprobanteUrl: datosArchivo?.url ?? null,
        comprobantePublicId: datosArchivo?.publicId ?? null,
        comprobanteTipo: datosArchivo?.tipoRecurso ?? null,
      },
      update: {
        // El importe se recalcula: el horario pudo cambiar desde el intento anterior
        monto,
        metodoPago: metodo,
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
      usuarioId: reserva.servicio.profesorId,
      tipo: "PAGO_RECIBIDO",
      mensaje: `Un estudiante registró el pago de ${formatearPrecio(monto)} por la clase de ${reserva.servicio.materia}. Revísalo.`,
      enlace: "/profesores/dashboard",
    });

    return NextResponse.json(
      { mensaje: "Pago registrado. El profesor lo confirmará.", monto },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registrando el pago de la reserva:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// El profesor confirma que el dinero llegó, o lo rechaza
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { decision, motivo } = await request.json();
    if (decision !== "APROBAR" && decision !== "RECHAZAR") {
      return NextResponse.json(
        { error: "Decisión inválida. Usa APROBAR o RECHAZAR." },
        { status: 400 }
      );
    }

    const reserva = await cargarReserva(params.id);
    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }
    // Solo el profesor decide: es quien ve el dinero en su cuenta
    if (reserva.servicio.profesorId !== payload.userId) {
      return NextResponse.json(
        { error: "Solo el profesor de la clase puede revisar el pago" },
        { status: 403 }
      );
    }

    const revisable = puedeRevisarPagoReserva((reserva.pago?.estado ?? null) as EstadoPago | null);
    if (!revisable.permitido) {
      return NextResponse.json({ error: revisable.mensaje }, { status: 400 });
    }

    const nuevoEstado = estadoPagoTrasDecision(decision);
    const motivoLimpio =
      typeof motivo === "string" && motivo.trim() ? motivo.trim().slice(0, 500) : null;

    await prisma.pago.update({
      where: { reservaId: reserva.id },
      data: {
        estado: nuevoEstado,
        revisadoEn: new Date(),
        motivoRechazo: decision === "RECHAZAR" ? motivoLimpio : null,
      },
    });

    await notificar({
      usuarioId: reserva.estudianteId,
      tipo: decision === "APROBAR" ? "PAGO_RECIBIDO" : "PAGO_RECHAZADO",
      mensaje:
        decision === "APROBAR"
          ? `El profesor confirmó tu pago de la clase de ${reserva.servicio.materia}.`
          : `El profesor no pudo verificar tu pago de ${reserva.servicio.materia}${motivoLimpio ? `: ${motivoLimpio}` : ""}`,
      enlace: "/estudiantes/dashboard",
    });

    return NextResponse.json({
      mensaje: decision === "APROBAR" ? "Pago confirmado" : "Pago rechazado",
      estado: nuevoEstado,
    });
  } catch (error) {
    console.error("Error revisando el pago de la reserva:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
