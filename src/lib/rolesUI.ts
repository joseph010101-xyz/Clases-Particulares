// =============================================
// ClasesYa - Identidad visual de los roles
// Color, etiqueta y accesos rápidos de cada rol. Se usa en el encabezado y el
// pie para que el usuario reconozca al instante con qué rol está navegando.
// Los colores son sólidos con texto blanco: legibles en cualquier tema.
// =============================================

export type RolUsuario = "ESTUDIANTE" | "PROFESOR" | "MODERADOR" | "ADMIN";

export interface EnlaceRol {
  href: string;
  etiqueta: string;
}

export interface IdentidadRol {
  etiqueta: string;
  color: string; // color sólido de la insignia
  panel: string; // ruta del panel principal del rol
  enlaces: EnlaceRol[]; // accesos rápidos para el pie de página
}

export const IDENTIDAD_ROL: Record<RolUsuario, IdentidadRol> = {
  ESTUDIANTE: {
    etiqueta: "Estudiante",
    color: "#0284c7",
    panel: "/estudiantes/dashboard",
    enlaces: [
      { href: "/estudiantes/dashboard", etiqueta: "Mis reservas" },
      { href: "/clases", etiqueta: "Buscar clases" },
      { href: "/cursos", etiqueta: "Mis cursos" },
      { href: "/mensajes", etiqueta: "Mensajes" },
    ],
  },
  PROFESOR: {
    etiqueta: "Profesor",
    color: "#059669",
    panel: "/profesores/dashboard",
    enlaces: [
      { href: "/profesores/dashboard", etiqueta: "Mi panel" },
      { href: "/profesores/dashboard", etiqueta: "Mis servicios" },
      { href: "/cursos", etiqueta: "Mis cursos" },
      { href: "/mensajes", etiqueta: "Mensajes" },
    ],
  },
  MODERADOR: {
    etiqueta: "Moderador",
    color: "#7c3aed",
    panel: "/admin",
    enlaces: [
      { href: "/admin", etiqueta: "Moderación" },
      { href: "/profesores", etiqueta: "Profesores" },
      { href: "/mensajes", etiqueta: "Mensajes" },
    ],
  },
  ADMIN: {
    etiqueta: "Administrador",
    color: "#e11d48",
    panel: "/admin",
    enlaces: [
      { href: "/admin", etiqueta: "Administración" },
      { href: "/admin", etiqueta: "Usuarios y roles" },
      { href: "/profesores", etiqueta: "Profesores" },
      { href: "/mensajes", etiqueta: "Mensajes" },
    ],
  },
};

// Enlaces para visitantes sin sesión iniciada
export const ENLACES_PUBLICOS: EnlaceRol[] = [
  { href: "/clases", etiqueta: "Buscar clases" },
  { href: "/profesores", etiqueta: "Profesores" },
  { href: "/cursos", etiqueta: "Cursos" },
  { href: "/registro", etiqueta: "Registrarse" },
];

export function identidadDe(rol: string | null | undefined): IdentidadRol | null {
  if (!rol) return null;
  return IDENTIDAD_ROL[rol as RolUsuario] ?? null;
}
