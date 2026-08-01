// =============================================
// ClasesYa - Dominio: Aula virtual (acceso a cursos y material)
// Lógica pura de autorización sobre cursos.
// =============================================

// Contexto del usuario respecto de un curso.
export interface AccesoCurso {
  esDueño: boolean; // es el profesor que creó el curso
  estaInscrito: boolean; // es un estudiante inscrito
}

/**
 * ¿Puede el usuario ver/descargar el material de un curso?
 * Solo el profesor dueño y los estudiantes inscritos.
 */
export function puedeVerMaterial(acceso: AccesoCurso): boolean {
  return acceso.esDueño || acceso.estaInscrito;
}

/** Solo el profesor dueño puede gestionar el curso (subir/borrar material). */
export function puedeGestionarCurso(acceso: AccesoCurso): boolean {
  return acceso.esDueño;
}

/**
 * Tope de tareas que se pueden plantear de una vez al crear un curso. No es una
 * regla pedagógica: es un límite para que una petición mal formada no cree
 * cientos de filas de golpe. Después se pueden seguir añadiendo sin tope.
 */
export const MAX_TAREAS_POR_CURSO = 30;

/**
 * ¿La entrega es tardía respecto de la fecha límite? Si no hay fecha límite,
 * nunca es tardía. Se compara el instante de entrega con el límite.
 */
export function esEntregaTardia(
  fechaLimite: Date | null | undefined,
  fechaEntrega: Date = new Date()
): boolean {
  if (!fechaLimite) return false;
  return fechaEntrega.getTime() > fechaLimite.getTime();
}
