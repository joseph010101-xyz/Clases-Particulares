// =============================================
// ClasesYa - Dominio: lo que le queda por hacer a cada usuario
// Hasta ahora, saber "qué tengo pendiente" obligaba a entrar curso por curso.
// Aquí vive la clasificación por urgencia y el orden en que debe presentarse,
// sin saber nada de Prisma ni de HTTP.
// =============================================

export type Urgencia = "vencida" | "hoy" | "pronto" | "normal";

/** Días desde los que una fecha límite deja de considerarse lejana. */
export const DIAS_PROXIMOS = 3;

/**
 * Clasifica una fecha límite. Sin fecha, nada urge: hay tareas que el profesor
 * deja abiertas a propósito y marcarlas en rojo sería mentir.
 */
export function urgenciaDeFecha(
  fechaLimite: Date | string | null | undefined,
  ahora: Date = new Date()
): Urgencia {
  if (!fechaLimite) return "normal";
  const limite = fechaLimite instanceof Date ? fechaLimite : new Date(fechaLimite);
  if (isNaN(limite.getTime())) return "normal";

  if (limite.getTime() < ahora.getTime()) return "vencida";

  // "Hoy" es el día natural, no las próximas 24 horas: algo que vence esta
  // noche y algo que vence mañana a primera hora se viven muy distinto.
  const finDeHoy = new Date(ahora);
  finDeHoy.setHours(23, 59, 59, 999);
  if (limite.getTime() <= finDeHoy.getTime()) return "hoy";

  const limiteProximo = new Date(finDeHoy);
  limiteProximo.setDate(limiteProximo.getDate() + DIAS_PROXIMOS);
  return limite.getTime() <= limiteProximo.getTime() ? "pronto" : "normal";
}

/** Texto corto para acompañar la fecha ("Venció", "Vence hoy"…). */
export function etiquetaUrgencia(urgencia: Urgencia): string {
  switch (urgencia) {
    case "vencida":
      return "Venció";
    case "hoy":
      return "Vence hoy";
    case "pronto":
      return "Vence pronto";
    default:
      return "";
  }
}

// Cuanto más bajo, más arriba aparece.
const PESO_URGENCIA: Record<Urgencia, number> = {
  vencida: 0,
  hoy: 1,
  pronto: 2,
  normal: 3,
};

export type TipoPendiente =
  | "TAREA" // al estudiante le falta entregar
  | "PAGO" // al estudiante le falta pagar o le rechazaron el comprobante
  | "CALIFICAR" // al profesor le falta poner nota
  | "REVISAR_PAGO" // al profesor le falta confirmar un comprobante
  | "CONFIRMAR_RESERVA"; // al profesor le falta responder una solicitud

export interface Pendiente {
  tipo: TipoPendiente;
  titulo: string;
  /** De dónde viene: el curso, la materia… */
  contexto: string;
  enlace: string;
  urgencia: Urgencia;
  /** Fecha que gobierna la urgencia, en ISO. Null si no la tiene. */
  fecha: string | null;
}

// Cuando dos cosas tienen la misma urgencia, primero lo que bloquea a otra
// persona: un pago sin revisar deja a un estudiante fuera del curso, mientras
// que una tarea sin calificar solo le hace esperar.
const PESO_TIPO: Record<TipoPendiente, number> = {
  PAGO: 0,
  REVISAR_PAGO: 1,
  CONFIRMAR_RESERVA: 2,
  TAREA: 3,
  CALIFICAR: 4,
};

/**
 * Ordena lo pendiente: primero lo vencido, luego lo que vence antes, y a
 * igualdad de urgencia lo que bloquea a otra persona.
 */
export function ordenarPendientes(pendientes: Pendiente[]): Pendiente[] {
  return [...pendientes].sort((a, b) => {
    const porUrgencia = PESO_URGENCIA[a.urgencia] - PESO_URGENCIA[b.urgencia];
    if (porUrgencia !== 0) return porUrgencia;

    const porTipo = PESO_TIPO[a.tipo] - PESO_TIPO[b.tipo];
    if (porTipo !== 0) return porTipo;

    // Con la misma urgencia y tipo, antes lo que tiene fecha más cercana
    if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
    if (a.fecha) return -1;
    if (b.fecha) return 1;
    return 0;
  });
}

/** Cuántas de las pendientes reclaman atención inmediata. */
export function contarUrgentes(pendientes: Pendiente[]): number {
  return pendientes.filter((p) => p.urgencia === "vencida" || p.urgencia === "hoy").length;
}
