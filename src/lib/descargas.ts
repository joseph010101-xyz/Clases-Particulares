// =============================================
// ClasesYa - Entrega de archivos por la propia API
// Las URLs de Cloudinary son públicas para quien las tenga, así que nunca se
// le dan al navegador: el servidor trae el archivo y lo reenvía solo después
// de comprobar quién lo pide. Es la única forma de que "material solo para
// inscritos" signifique algo.
// =============================================

import { NextResponse } from "next/server";

// Nombre de archivo seguro para la cabecera: sin comillas, saltos ni rutas.
function nombreSeguro(nombre: string): string {
  return nombre.replace(/[^\w .\-()]/g, "_").slice(0, 120) || "archivo";
}

/**
 * Trae el archivo del almacenamiento y lo reenvía al cliente. `disposicion`
 * decide si el navegador lo muestra (inline) o lo descarga (attachment).
 */
export async function servirArchivo(
  url: string,
  nombre: string,
  disposicion: "inline" | "attachment" = "inline"
): Promise<NextResponse> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url);
  } catch (error) {
    console.error("No se pudo recuperar el archivo del almacenamiento:", error);
    return NextResponse.json({ error: "No se pudo recuperar el archivo" }, { status: 502 });
  }

  if (!respuesta.ok || !respuesta.body) {
    console.error("El almacenamiento respondió", respuesta.status, "para", url);
    return NextResponse.json({ error: "El archivo ya no está disponible" }, { status: 404 });
  }

  const cabeceras = new Headers();
  cabeceras.set(
    "Content-Type",
    respuesta.headers.get("content-type") ?? "application/octet-stream"
  );
  // No se copian Content-Length ni Content-Encoding a propósito. Si el
  // almacenamiento responde comprimido, `fetch` ya nos entrega el cuerpo
  // descomprimido: reenviar la longitud del comprimido trunca el archivo en el
  // cliente sin dar ningún error. Sin cabecera, la respuesta va por trozos.
  cabeceras.set(
    "Content-Disposition",
    `${disposicion}; filename="${nombreSeguro(nombre)}"`
  );
  // Privado: la respuesta depende de quién la pide, así que ninguna caché
  // compartida debe guardarla y servírsela a otro usuario.
  cabeceras.set("Cache-Control", "private, no-store");

  return new NextResponse(respuesta.body, { status: 200, headers: cabeceras });
}

// Rutas que sí se le pueden dar al navegador. Las respuestas de la API
// mantienen el campo `url`, pero apuntando aquí en vez de a Cloudinary.
export const rutaDescargaMaterial = (id: string) => `/api/materiales/${id}/descargar`;
export const rutaDescargaEntrega = (id: string) => `/api/entregas/${id}/descargar`;

/** Extensión a partir del formato guardado, para dar un nombre con sentido. */
export function nombreDeArchivo(titulo: string, formato: string | null): string {
  const base = titulo.trim() || "archivo";
  return formato ? `${base}.${formato}` : base;
}
