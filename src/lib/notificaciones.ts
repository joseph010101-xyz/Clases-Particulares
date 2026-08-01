// =============================================
// ClasesYa - Notificaciones
// Helper único para crear notificaciones: las persiste y las emite en tiempo
// real por el bus SSE (evento "notificacion:nueva") para la campana del navbar.
// =============================================

import type { TipoNotificacion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { busRealtime } from "@/lib/realtime/bus";

export async function notificar(params: {
  usuarioId: string;
  tipo: TipoNotificacion;
  mensaje: string;
  enlace?: string | null;
}) {
  const notificacion = await prisma.notificacion.create({
    data: {
      usuarioId: params.usuarioId,
      tipo: params.tipo,
      mensaje: params.mensaje,
      enlace: params.enlace ?? null,
    },
    select: { id: true, tipo: true, mensaje: true, enlace: true, leida: true, createdAt: true },
  });

  busRealtime.publicar(params.usuarioId, "notificacion:nueva", notificacion);
  return notificacion;
}

/**
 * Avisa a todos los estudiantes con acceso a un curso. El aula era la única
 * parte de la plataforma que no avisaba de nada: se publicaba una tarea y el
 * estudiante solo se enteraba si entraba a mirar por su cuenta.
 *
 * Solo se avisa a las inscripciones ACTIVAS: quien tiene el pago pendiente
 * todavía no puede abrir lo que se le anunciaría.
 */
export async function notificarAlCurso(params: {
  cursoId: string;
  tipo: TipoNotificacion;
  mensaje: string;
  enlace: string;
}): Promise<number> {
  try {
    const inscritos = await prisma.inscripcion.findMany({
      where: { cursoId: params.cursoId, estado: "ACTIVA" },
      select: { estudianteId: true },
    });
    await Promise.all(
      inscritos.map((i) =>
        notificar({
          usuarioId: i.estudianteId,
          tipo: params.tipo,
          mensaje: params.mensaje,
          enlace: params.enlace,
        })
      )
    );
    return inscritos.length;
  } catch (error) {
    console.error("No se pudo avisar al curso:", error);
    return 0;
  }
}
