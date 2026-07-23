// =============================================
// ClasesYa - Utilidades de autenticación (JWT con jose)
// =============================================

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Interfaz del payload que guardamos en el token
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  nombre: string;
  rol: "PROFESOR" | "ESTUDIANTE" | "ADMIN";
}

// Clave secreta codificada para jose
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está definido en las variables de entorno");
  return new TextEncoder().encode(secret);
}

// Crear un token JWT (válido por 7 días)
export async function crearToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

// Verificar y decodificar un token JWT
export async function verificarToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// Obtener el usuario actual desde la cookie de sesión
// También verifica que el usuario siga activo en la BD
export async function obtenerUsuarioActual(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verificarToken(token);
  if (!payload) return null;

  // Verificar que el usuario sigue activo
  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.userId },
    select: { activo: true },
  });
  if (!usuario?.activo) return null;

  return payload;
}

// Nombre de la cookie de sesión
export const COOKIE_NAME = "token";
