// =============================================
// ClasesYa - Dominio: Calificaciones
// Lógica pura para agregar reseñas en una calificación promedio.
// =============================================

/**
 * Calcula el promedio de un conjunto de calificaciones, redondeado a un
 * decimal. Devuelve `null` cuando no hay calificaciones, para que la capa de
 * presentación distinga "sin reseñas" de "promedio 0".
 */
export function promedioCalificaciones(calificaciones: number[]): number | null {
  if (calificaciones.length === 0) return null;
  const suma = calificaciones.reduce((acc, c) => acc + c, 0);
  return Math.round((suma / calificaciones.length) * 10) / 10;
}
