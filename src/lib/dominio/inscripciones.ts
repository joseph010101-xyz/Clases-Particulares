// =============================================
// ClasesYa - Dominio: estado de las inscripciones y sus pagos
// Un curso gratuito da acceso al instante. Uno de pago espera a que el profesor
// confirme haber recibido el dinero: la plataforma solo guarda la evidencia.
// =============================================

import { esCursoGratuito } from "./vigencia";

export type EstadoInscripcion = "PENDIENTE_PAGO" | "ACTIVA" | "RECHAZADA";
export type MetodoPago = "EFECTIVO" | "QR" | "TRANSFERENCIA" | "TIGO_MONEY";

export const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: "Efectivo",
  QR: "Pago con QR",
  TRANSFERENCIA: "Transferencia bancaria",
  TIGO_MONEY: "Tigo Money",
};

export const ETIQUETA_ESTADO_INSCRIPCION: Record<EstadoInscripcion, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  ACTIVA: "Activa",
  RECHAZADA: "Rechazada",
};

/** Estado con el que nace una inscripción, según el precio del curso. */
export function estadoInicialInscripcion(precio: number | string | null | undefined): EstadoInscripcion {
  return esCursoGratuito(precio) ? "ACTIVA" : "PENDIENTE_PAGO";
}

/** Solo una inscripción activa da acceso al material y a las tareas. */
export function inscripcionDaAcceso(estado: EstadoInscripcion | null | undefined): boolean {
  return estado === "ACTIVA";
}

/** El estudiante solo puede enviar comprobante mientras el pago esté pendiente. */
export function puedeEnviarComprobante(estado: EstadoInscripcion | null | undefined): boolean {
  return estado === "PENDIENTE_PAGO" || estado === "RECHAZADA";
}

export type DecisionPago = "APROBAR" | "RECHAZAR";

/**
 * Valida que el profesor pueda decidir sobre una inscripción. Solo tiene
 * sentido revisar las que están esperando confirmación de pago.
 */
export function puedeRevisarPago(
  estado: EstadoInscripcion | null | undefined
): { permitido: true } | { permitido: false; mensaje: string } {
  if (estado === "PENDIENTE_PAGO") return { permitido: true };
  if (estado === "ACTIVA") {
    return { permitido: false, mensaje: "Esta inscripción ya está activa" };
  }
  if (estado === "RECHAZADA") {
    return { permitido: false, mensaje: "Esta inscripción ya fue rechazada" };
  }
  return { permitido: false, mensaje: "La inscripción no existe" };
}

/** Estado resultante tras la decisión del profesor. */
export function estadoTrasDecision(decision: DecisionPago): EstadoInscripcion {
  return decision === "APROBAR" ? "ACTIVA" : "RECHAZADA";
}
