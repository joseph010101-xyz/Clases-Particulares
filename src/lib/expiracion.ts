// =============================================
// ClasesYa - Caducidad de reservas pendientes
// Barrido perezoso: no hace falta un proceso programado. Se ejecuta al listar o
// crear reservas, que es justo cuando importa que el horario esté liberado.
// =============================================

import { prisma } from "@/lib/prisma";
import { reservaPendienteCaducada, PLAZO_RESPUESTA_HORAS } from "@/lib/dominio";
import { notificar } from "@/lib/notificaciones";

// Tope por barrido para no encadenar demasiadas notificaciones de una vez
const MAX_POR_BARRIDO = 50;

/**
 * Cancela las reservas PENDIENTE que ya caducaron y avisa a cada estudiante.
 * Devuelve cuántas se cancelaron. Nunca lanza: si algo falla, la operación
 * principal (listar o crear una reserva) debe continuar igualmente.
 */
export async function expirarReservasPendientes(): Promise<number> {
  try {
    const ahora = new Date();
    const limiteSolicitud = new Date(ahora.getTime() - PLAZO_RESPUESTA_HORAS * 60 * 60 * 1000);
    const finDeHoy = new Date(ahora);
    finDeHoy.setHours(23, 59, 59, 999);

    // Prefiltro en base de datos: o la clase es de un día ya pasado / hoy (hay
    // que comprobar la hora), o la solicitud superó el plazo de respuesta.
    const candidatas = await prisma.reserva.findMany({
      where: {
        estado: "PENDIENTE",
        OR: [{ fecha: { lte: finDeHoy } }, { createdAt: { lte: limiteSolicitud } }],
      },
      select: {
        id: true,
        fecha: true,
        horaInicio: true,
        createdAt: true,
        estudianteId: true,
        servicio: { select: { materia: true } },
      },
      take: MAX_POR_BARRIDO,
    });

    // La decisión final la toma la regla de dominio (comprueba también la hora)
    const caducadas = candidatas.filter((r) =>
      reservaPendienteCaducada(r.fecha, r.horaInicio, r.createdAt, ahora)
    );
    if (caducadas.length === 0) return 0;

    await prisma.reserva.updateMany({
      where: { id: { in: caducadas.map((r) => r.id) }, estado: "PENDIENTE" },
      data: { estado: "CANCELADA" },
    });

    // Avisar a cada estudiante de que su solicitud caducó
    await Promise.all(
      caducadas.map((r) =>
        notificar({
          usuarioId: r.estudianteId,
          tipo: "RESERVA_CANCELADA",
          mensaje: `Tu solicitud de ${r.servicio.materia} caducó porque el profesor no respondió a tiempo`,
          enlace: "/estudiantes/dashboard",
        })
      )
    );

    return caducadas.length;
  } catch (error) {
    console.error("Error caducando reservas pendientes:", error);
    return 0;
  }
}
