// =============================================
// ClasesYa - Textos e identidad visual de la auditoría
// Sin dependencias de servidor: se puede importar desde el cliente.
// =============================================

export type AccionAuditoriaUI =
  | "PROFESOR_VERIFICADO"
  | "PROFESOR_VERIFICACION_REVOCADA"
  | "USUARIO_ACTIVADO"
  | "USUARIO_DESACTIVADO"
  | "ROL_CAMBIADO"
  | "PAGO_ARBITRADO";

export const DESCRIPCION_ACCION: Record<AccionAuditoriaUI, string> = {
  PROFESOR_VERIFICADO: "Verificó a un profesor",
  PROFESOR_VERIFICACION_REVOCADA: "Revocó una verificación",
  USUARIO_ACTIVADO: "Activó una cuenta",
  USUARIO_DESACTIVADO: "Desactivó una cuenta",
  ROL_CAMBIADO: "Cambió el rol de un usuario",
  PAGO_ARBITRADO: "Arbitró un pago en disputa",
};

// Colores de estado reservados: verde para altas/aprobaciones, rojo para bajas,
// ámbar para cambios de permisos.
export const COLOR_ACCION: Record<AccionAuditoriaUI, string> = {
  PROFESOR_VERIFICADO: "#059669",
  PROFESOR_VERIFICACION_REVOCADA: "#d97706",
  USUARIO_ACTIVADO: "#059669",
  USUARIO_DESACTIVADO: "#dc2626",
  ROL_CAMBIADO: "#d97706",
  PAGO_ARBITRADO: "#7c3aed",
};

/** Texto relativo compacto ("hace 3 h", "hace 2 d"). */
export function tiempoRelativo(fecha: string | Date): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(fecha).toLocaleDateString("es-ES");
}
