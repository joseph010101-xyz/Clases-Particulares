// =============================================
// ClasesYa - Dominio: vigencia y precio de los cursos
// Un curso puede tener fechas (cohorte) o no tenerlas (siempre abierto), y
// puede ser gratuito o de pago. Estas reglas deciden si admite inscripciones.
// =============================================

export interface VigenciaCurso {
  activo: boolean;
  fechaInicio?: Date | string | null;
  fechaFin?: Date | string | null;
}

function aFecha(valor: Date | string | null | undefined): Date | null {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/** Un curso sin precio (o con precio cero) es gratuito. */
export function esCursoGratuito(precio: number | string | null | undefined): boolean {
  const n = Number(precio);
  return !Number.isFinite(n) || n <= 0;
}

/** ¿El curso ya terminó? Sin fecha de fin nunca termina. */
export function cursoFinalizado(vigencia: VigenciaCurso, ahora: Date = new Date()): boolean {
  const fin = aFecha(vigencia.fechaFin);
  if (!fin) return false;
  // La fecha de fin es inclusiva: el curso sigue vigente todo ese día
  const finDelDia = new Date(fin);
  finDelDia.setHours(23, 59, 59, 999);
  return ahora.getTime() > finDelDia.getTime();
}

/** ¿El curso todavía no ha comenzado? Sin fecha de inicio ya está en marcha. */
export function cursoPorComenzar(vigencia: VigenciaCurso, ahora: Date = new Date()): boolean {
  const inicio = aFecha(vigencia.fechaInicio);
  if (!inicio) return false;
  const inicioDelDia = new Date(inicio);
  inicioDelDia.setHours(0, 0, 0, 0);
  return ahora.getTime() < inicioDelDia.getTime();
}

export type MotivoNoInscribible = "inactivo" | "finalizado";

/**
 * Decide si un curso admite nuevas inscripciones. Un curso que ya empezó pero
 * no ha terminado sigue admitiéndolas: incorporarse tarde es legítimo.
 */
export function puedeInscribirse(
  vigencia: VigenciaCurso,
  ahora: Date = new Date()
): { permitido: true } | { permitido: false; motivo: MotivoNoInscribible; mensaje: string } {
  if (!vigencia.activo) {
    return { permitido: false, motivo: "inactivo", mensaje: "Este curso ya no está disponible" };
  }
  if (cursoFinalizado(vigencia, ahora)) {
    return { permitido: false, motivo: "finalizado", mensaje: "Este curso ya finalizó" };
  }
  return { permitido: true };
}

/** Texto legible del periodo del curso, para la interfaz. */
export function describirVigencia(vigencia: VigenciaCurso): string {
  const inicio = aFecha(vigencia.fechaInicio);
  const fin = aFecha(vigencia.fechaFin);
  const f = (d: Date) => d.toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" });

  if (!inicio && !fin) return "Disponible en cualquier momento";
  if (inicio && fin) return `Del ${f(inicio)} al ${f(fin)}`;
  if (inicio) return `Comienza el ${f(inicio)}`;
  return `Hasta el ${f(fin as Date)}`;
}
