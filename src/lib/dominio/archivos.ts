// =============================================
// ClasesYa - Dominio: archivos del aula virtual
// Reglas puras sobre qué se puede subir y cómo se presenta su tamaño.
// =============================================

/** Tamaño máximo por archivo (15 MB). */
export const MAX_BYTES_ARCHIVO = 15 * 1024 * 1024;

/**
 * Extensiones admitidas, agrupadas por familia. Es una lista blanca a
 * propósito: evita que se suban ejecutables o scripts a la plataforma.
 */
export const EXTENSIONES_PERMITIDAS: Record<string, string[]> = {
  Documentos: ["pdf", "doc", "docx", "odt", "txt", "rtf", "md"],
  "Hojas de cálculo": ["xls", "xlsx", "ods", "csv"],
  Presentaciones: ["ppt", "pptx", "odp"],
  Imágenes: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
  Audio: ["mp3", "wav", "ogg", "m4a"],
  Video: ["mp4", "webm", "mov", "avi", "mkv"],
  Comprimidos: ["zip", "rar", "7z"],
};

const LISTA_PLANA = Object.values(EXTENSIONES_PERMITIDAS).flat();

/** Extensión en minúsculas, sin punto. Cadena vacía si no tiene. */
export function extensionDe(nombreArchivo: string): string {
  const limpio = nombreArchivo.trim();
  const punto = limpio.lastIndexOf(".");
  if (punto <= 0 || punto === limpio.length - 1) return "";
  return limpio.slice(punto + 1).toLowerCase();
}

/** ¿El archivo tiene una extensión admitida? */
export function esArchivoPermitido(nombreArchivo: string): boolean {
  const ext = extensionDe(nombreArchivo);
  return ext !== "" && LISTA_PLANA.includes(ext);
}

/** Texto de ayuda con los formatos admitidos, para la interfaz. */
export function descripcionFormatosPermitidos(): string {
  return Object.keys(EXTENSIONES_PERMITIDAS).join(", ");
}

/** Tamaño máximo para una foto de perfil (5 MB). */
export const MAX_BYTES_FOTO = 5 * 1024 * 1024;

const EXTENSIONES_IMAGEN = ["jpg", "jpeg", "png", "webp", "gif"];

/** ¿Sirve como foto de perfil? Solo imágenes de mapa de bits (SVG queda fuera
 *  a propósito: puede contener scripts). */
export function esImagenPermitida(nombreArchivo: string): boolean {
  return EXTENSIONES_IMAGEN.includes(extensionDe(nombreArchivo));
}

/** Presenta un tamaño en bytes de forma legible. */
export function formatearTamano(bytes: number | null | undefined): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
