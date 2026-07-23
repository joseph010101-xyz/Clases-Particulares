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
