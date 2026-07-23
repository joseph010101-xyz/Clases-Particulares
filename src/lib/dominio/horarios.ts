// =============================================
// ClasesYa - Dominio: Horarios y solapamientos
// Lógica pura (sin Prisma ni HTTP) para razonar sobre franjas horarias.
// Las horas se representan como cadenas "HH:mm" en formato 24h con cero a la
// izquierda, por lo que su orden lexicográfico coincide con el cronológico.
// =============================================

// Nombres de los días según el esquema: 0=Lunes ... 6=Domingo
export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

/**
 * Convierte el día que devuelve `Date.getDay()` (0=Domingo ... 6=Sábado)
 * a la convención del dominio (0=Lunes ... 6=Domingo).
 */
export function jsDayADiaSemana(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/**
 * Determina si dos franjas horarias [inicioA, finA) y [inicioB, finB) se
 * solapan. Se asume que en cada franja el fin es posterior al inicio.
 * El fin es exclusivo: "10:00-11:00" y "11:00-12:00" NO se solapan.
 */
export function intervalosSeSolapan(
  inicioA: string,
  finA: string,
  inicioB: string,
  finB: string
): boolean {
  return inicioA < finB && finA > inicioB;
}

/**
 * Construye el filtro `AND` de Prisma que detecta reservas/bloques cuya franja
 * se solapa con [horaInicio, horaFin). Centraliza el patrón para que la regla
 * viva en un solo lugar y no se duplique en cada consulta.
 */
export function filtroSolapamientoPrisma(horaInicio: string, horaFin: string) {
  return {
    AND: [{ horaInicio: { lt: horaFin } }, { horaFin: { gt: horaInicio } }],
  };
}

/** Convierte una hora "HH:mm" en minutos desde medianoche. */
export function minutosDesdeHHmm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Indica si un bloque de disponibilidad [bloqueInicio, bloqueFin) es lo bastante
 * largo para alojar una clase de `duracionMin` minutos (empezando al inicio del
 * bloque). Sirve para no ofrecer bloques donde la clase no cabe.
 */
export function bloqueAdmiteDuracion(
  bloqueInicio: string,
  bloqueFin: string,
  duracionMin: number
): boolean {
  return minutosDesdeHHmm(bloqueFin) - minutosDesdeHHmm(bloqueInicio) >= duracionMin;
}

/**
 * Indica si una clase que empieza a `inicioClase` y dura `duracionMin` cabe por
 * completo dentro del bloque [bloqueInicio, bloqueFin) (sin desbordar el fin).
 */
export function claseCabeEnBloque(
  inicioClase: string,
  duracionMin: number,
  bloqueInicio: string,
  bloqueFin: string
): boolean {
  const inicio = minutosDesdeHHmm(inicioClase);
  return (
    inicio >= minutosDesdeHHmm(bloqueInicio) &&
    inicio + duracionMin <= minutosDesdeHHmm(bloqueFin)
  );
}
