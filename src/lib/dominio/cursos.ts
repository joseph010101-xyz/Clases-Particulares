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
