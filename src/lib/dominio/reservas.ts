// =============================================
// ClasesYa - Dominio: Reservas
// Lógica pura de la máquina de estados y de las reglas temporales de una
// reserva. No conoce Prisma ni HTTP: recibe datos y devuelve decisiones.
// =============================================

export type EstadoReserva = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";

// Quién intenta la acción respecto de la reserva.
export interface ActorReserva {
  esProfesor: boolean;
  esEstudiante: boolean;
}

// Motivo por el que una transición se rechaza; la capa HTTP lo mapea a un
// código de estado (estado_invalido/estado_terminal → 400, sin_permiso → 403).
export type MotivoRechazo = "estado_invalido" | "sin_permiso" | "estado_terminal";

export type ResultadoTransicion =
  | { permitido: true }
  | { permitido: false; motivo: MotivoRechazo; mensaje: string };

// Estados a los que un usuario puede intentar mover una reserva.
const ESTADOS_DESTINO: EstadoReserva[] = ["CONFIRMADA", "CANCELADA", "COMPLETADA"];

// Estados finales: una vez alcanzados, la reserva ya no cambia.
const ESTADOS_TERMINALES: EstadoReserva[] = ["COMPLETADA", "CANCELADA"];

/**
 * Valida si un actor puede llevar una reserva de `estadoActual` a
 * `nuevoEstado`, aplicando las reglas de permisos por rol. No decide sobre
 * condiciones temporales (ver `reservaYaOcurrio`).
 */
export function validarTransicionReserva(
  estadoActual: EstadoReserva,
  nuevoEstado: string,
  actor: ActorReserva
): ResultadoTransicion {
  if (!ESTADOS_DESTINO.includes(nuevoEstado as EstadoReserva)) {
    return {
      permitido: false,
      motivo: "estado_invalido",
      mensaje: "Estado inválido. Valores permitidos: " + ESTADOS_DESTINO.join(", "),
    };
  }

  // Una reserva finalizada (completada o cancelada) es inmutable.
  if (ESTADOS_TERMINALES.includes(estadoActual)) {
    return {
      permitido: false,
      motivo: "estado_terminal",
      mensaje: "No se puede modificar una reserva " + estadoActual.toLowerCase(),
    };
  }

  if (nuevoEstado === "CONFIRMADA" && !actor.esProfesor) {
    return { permitido: false, motivo: "sin_permiso", mensaje: "Solo el profesor puede confirmar reservas" };
  }
  if (nuevoEstado === "COMPLETADA" && !actor.esProfesor) {
    return { permitido: false, motivo: "sin_permiso", mensaje: "Solo el profesor puede marcar como completada" };
  }
  if (nuevoEstado === "CANCELADA" && !actor.esProfesor && !actor.esEstudiante) {
    return { permitido: false, motivo: "sin_permiso", mensaje: "No tienes permiso para cancelar esta reserva" };
  }

  return { permitido: true };
}

/**
 * Indica si el día de `fecha` es anterior al día de `ahora` (comparación por
 * día calendario, ignorando la hora). Se usa para impedir reservas en el
 * pasado.
 */
export function esDiaPasado(fecha: Date, ahora: Date = new Date()): boolean {
  const inicioHoy = new Date(ahora);
  inicioHoy.setHours(0, 0, 0, 0);
  const inicioFecha = new Date(fecha);
  inicioFecha.setHours(0, 0, 0, 0);
  return inicioFecha < inicioHoy;
}

/**
 * Indica si la clase de una reserva (día `fecha` que termina a `horaFin`) ya
 * concluyó respecto de `ahora`. Impide marcar como COMPLETADA una clase que
 * todavía no ocurrió.
 */
export function reservaYaOcurrio(
  fecha: Date,
  horaFin: string,
  ahora: Date = new Date()
): boolean {
  const [horas, minutos] = horaFin.split(":").map(Number);
  const finClase = new Date(fecha);
  finClase.setHours(horas, minutos, 0, 0);
  return ahora.getTime() >= finClase.getTime();
}
