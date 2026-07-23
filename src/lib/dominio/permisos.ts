// =============================================
// ClasesYa - Dominio: Permisos por rol
// Centraliza las reglas de autorización de la administración, aplicando el
// principio de mínimo privilegio. Lógica pura y testeable.
// =============================================

export type Rol = "ESTUDIANTE" | "PROFESOR" | "MODERADOR" | "ADMIN";

// Roles que un administrador puede asignar desde la gestión de usuarios.
export const ROLES_ASIGNABLES: Rol[] = ["ESTUDIANTE", "PROFESOR", "MODERADOR", "ADMIN"];

/**
 * ¿Puede el rol moderar profesores (verificar / activar / desactivar)?
 * Lo pueden hacer administradores y moderadores.
 */
export function puedeModerar(rol: string): boolean {
  return rol === "ADMIN" || rol === "MODERADOR";
}

/**
 * ¿Puede el rol gestionar usuarios y cambiar roles? Solo administradores, para
 * que un moderador no pueda escalar privilegios ni crear otros administradores.
 */
export function puedeAdministrarUsuarios(rol: string): boolean {
  return rol === "ADMIN";
}

/** ¿Es un rol válido y asignable? */
export function esRolAsignable(rol: string): rol is Rol {
  return (ROLES_ASIGNABLES as string[]).includes(rol);
}
