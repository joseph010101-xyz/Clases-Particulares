// =============================================
// ClasesYa - Dominio: pago de una clase particular
// Igual que en los cursos, la plataforma no mueve dinero: registra lo que el
// estudiante declara haber pagado y la decisión del profesor al comprobarlo.
// La diferencia es el momento: una clase se paga cuando el profesor ya aceptó
// el horario, y puede pagarse en efectivo el mismo día.
// =============================================

import { minutosDesdeHHmm } from "./horarios";
import type { EstadoReserva } from "./reservas";

export type EstadoPago = "PENDIENTE" | "COMPLETADO" | "FALLIDO" | "REEMBOLSADO";

export const ETIQUETA_ESTADO_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: "Por confirmar",
  COMPLETADO: "Confirmado",
  FALLIDO: "Rechazado",
  REEMBOLSADO: "Reembolsado",
};

/**
 * Importe de una clase: el precio por hora prorrateado a su duración real, para
 * que una clase de 90 minutos no cueste lo mismo que una de 60. Se redondea a
 * dos decimales porque es dinero.
 */
export function montoReserva(
  precioHora: number | string | null | undefined,
  horaInicio: string,
  horaFin: string
): number {
  const porHora = Number(precioHora);
  if (!Number.isFinite(porHora) || porHora <= 0) return 0;

  const minutos = minutosDesdeHHmm(horaFin) - minutosDesdeHHmm(horaInicio);
  if (!Number.isFinite(minutos) || minutos <= 0) return 0;

  return Math.round(((porHora * minutos) / 60) * 100) / 100;
}

/** Una clase sin precio no pasa por el registro de pago. */
export function reservaRequierePago(precioHora: number | string | null | undefined): boolean {
  const porHora = Number(precioHora);
  return Number.isFinite(porHora) && porHora > 0;
}

export type ResultadoPago =
  | { permitido: true }
  | { permitido: false; mensaje: string };

/**
 * Cuándo puede el estudiante registrar su pago. Solo con el horario ya aceptado
 * por el profesor: pagar una solicitud que quizá nunca se confirme es
 * exactamente el riesgo que se busca evitar. Se admite también después de la
 * clase, porque en efectivo el dinero cambia de manos el mismo día.
 */
export function puedePagarReserva(
  estadoReserva: EstadoReserva,
  estadoPago: EstadoPago | null | undefined
): ResultadoPago {
  if (estadoReserva === "PENDIENTE") {
    return {
      permitido: false,
      mensaje: "Espera a que el profesor confirme el horario antes de pagar",
    };
  }
  if (estadoReserva === "CANCELADA") {
    return { permitido: false, mensaje: "Esta clase fue cancelada" };
  }
  if (estadoPago === "COMPLETADO") {
    return { permitido: false, mensaje: "El profesor ya confirmó este pago" };
  }
  return { permitido: true };
}

/** El profesor decide mientras el pago siga esperando su revisión. */
export function puedeRevisarPagoReserva(
  estadoPago: EstadoPago | null | undefined
): ResultadoPago {
  if (estadoPago === "PENDIENTE") return { permitido: true };
  if (estadoPago === "COMPLETADO") {
    return { permitido: false, mensaje: "Este pago ya fue confirmado" };
  }
  if (estadoPago === "FALLIDO") {
    return { permitido: false, mensaje: "Este pago ya fue rechazado" };
  }
  if (estadoPago === "REEMBOLSADO") {
    return { permitido: false, mensaje: "Este pago fue reembolsado" };
  }
  return { permitido: false, mensaje: "El estudiante todavía no ha registrado su pago" };
}

/** Estado del pago tras la decisión de quien lo revisa. */
export function estadoPagoTrasDecision(decision: "APROBAR" | "RECHAZAR"): EstadoPago {
  return decision === "APROBAR" ? "COMPLETADO" : "FALLIDO";
}
