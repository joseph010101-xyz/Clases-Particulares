// =============================================
// ClasesYa - API: Arbitraje de un pago (ADMIN)
// PATCH /api/admin/pagos/[id] → resolver una disputa
// Body: { estado: "COMPLETADO" | "FALLIDO" | "REEMBOLSADO", motivo: string }
//
// Es la última instancia cuando el estudiante afirma haber pagado y el profesor
// lo niega. Revertir la decisión de otro usuario siempre queda auditado y exige
// un motivo escrito.
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeArbitrarPagos } from "@/lib/dominio/permisos";
import { formatearPrecio } from "@/lib/dominio";
import { auditar } from "@/lib/auditoria";
import { notificar } from "@/lib/notificaciones";

const RESOLUCIONES = ["COMPLETADO", "FALLIDO", "REEMBOLSADO"] as const;
type Resolucion = (typeof RESOLUCIONES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeArbitrarPagos(payload.rol)) {
      return NextResponse.json(
        { error: "Solo un administrador puede arbitrar pagos" },
        { status: 403 }
      );
    }

    const { estado, motivo } = await request.json();
    if (!(RESOLUCIONES as readonly string[]).includes(estado)) {
      return NextResponse.json(
        { error: `Resolución inválida. Usa: ${RESOLUCIONES.join(", ")}.` },
        { status: 400 }
      );
    }
    // El motivo no es opcional: es lo que justifica pasar por encima del profesor
    const motivoLimpio = typeof motivo === "string" ? motivo.trim().slice(0, 500) : "";
    if (motivoLimpio.length < 5) {
      return NextResponse.json(
        { error: "Explica el motivo de la resolución (mínimo 5 caracteres)" },
        { status: 400 }
      );
    }

    const pago = await prisma.pago.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        estado: true,
        monto: true,
        inscripcion: {
          select: {
            id: true,
            estudianteId: true,
            curso: { select: { id: true, titulo: true, profesorId: true } },
          },
        },
        reserva: {
          select: {
            id: true,
            estudianteId: true,
            servicio: { select: { materia: true, profesorId: true } },
          },
        },
      },
    });
    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    if (pago.estado === estado) {
      return NextResponse.json({ error: "El pago ya está en ese estado" }, { status: 400 });
    }

    const nuevo = estado as Resolucion;
    const concepto = pago.inscripcion?.curso.titulo ?? pago.reserva?.servicio.materia ?? "—";

    // Si el pago es de un curso, el acceso del estudiante debe seguir a la
    // resolución: de nada sirve dar por bueno el pago y dejarlo fuera del aula.
    const operaciones: Prisma.PrismaPromise<unknown>[] = [
      prisma.pago.update({
        where: { id: pago.id },
        data: {
          estado: nuevo,
          revisadoEn: new Date(),
          motivoRechazo: nuevo === "COMPLETADO" ? null : `Resolución del administrador: ${motivoLimpio}`,
        },
      }),
    ];
    if (pago.inscripcion) {
      operaciones.push(
        prisma.inscripcion.update({
          where: { id: pago.inscripcion.id },
          data: { estado: nuevo === "COMPLETADO" ? "ACTIVA" : "RECHAZADA" },
        })
      );
    }
    await prisma.$transaction(operaciones);

    await auditar({
      actor: payload,
      accion: "PAGO_ARBITRADO",
      objetivoId: pago.id,
      objetivoNombre: concepto,
      detalle: `${pago.estado} → ${nuevo} (${formatearPrecio(Number(pago.monto))}). Motivo: ${motivoLimpio}`,
    });

    // Ambas partes se enteran: la transparencia es lo que sostiene el arbitraje
    const estudianteId = pago.inscripcion?.estudianteId ?? pago.reserva?.estudianteId;
    const profesorId = pago.inscripcion?.curso.profesorId ?? pago.reserva?.servicio.profesorId;
    const resumen =
      nuevo === "COMPLETADO"
        ? `se dio por pagado`
        : nuevo === "REEMBOLSADO"
          ? `se marcó como reembolsado`
          : `se dio por no pagado`;
    const aviso = `Un administrador revisó el pago de "${concepto}" y ${resumen}: ${motivoLimpio}`;

    await Promise.all(
      [estudianteId, profesorId].filter(Boolean).map((usuarioId) =>
        notificar({
          usuarioId: usuarioId as string,
          tipo: "PAGO_RECIBIDO",
          mensaje: aviso,
          enlace: pago.inscripcion ? `/cursos/${pago.inscripcion.curso.id}` : "/estudiantes/dashboard",
        })
      )
    );

    return NextResponse.json({ mensaje: "Pago arbitrado", estado: nuevo });
  } catch (error) {
    console.error("Error arbitrando el pago:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
