// =============================================
// ClasesYa - Integración con Cloudinary (almacenamiento de archivos)
// El material del aula virtual se sube a Cloudinary. Requiere las variables:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// =============================================

import { v2 as cloudinary } from "cloudinary";

let configurado = false;

// Configura el SDK de forma perezosa a partir de las variables de entorno.
function configurar() {
  if (configurado) return;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary no está configurado. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET."
    );
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configurado = true;
}

export function cloudinaryDisponible(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export interface ArchivoSubido {
  url: string;
  publicId: string;
  formato?: string;
  bytes?: number;
}

// Sube un archivo (Buffer) a Cloudinary. resource_type "auto" acepta documentos,
// hojas de cálculo, imágenes y video.
export async function subirArchivo(
  buffer: Buffer,
  carpeta: string,
  nombreOriginal: string
): Promise<ArchivoSubido> {
  configurar();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: carpeta,
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
          filename_override: nombreOriginal,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Error subiendo a Cloudinary"));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            formato: result.format,
            bytes: result.bytes,
          });
        }
      )
      .end(buffer);
  });
}

// Elimina un archivo de Cloudinary por su public_id.
export async function eliminarArchivo(publicId: string): Promise<void> {
  configurar();
  await cloudinary.uploader.destroy(publicId, { resource_type: "auto", invalidate: true });
}
