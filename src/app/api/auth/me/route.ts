// =============================================
// ClasesYa - API: Obtener usuario actual / Logout
// GET  /api/auth/me → devuelve datos del usuario autenticado
// POST /api/auth/me → logout (elimina cookie)
// =============================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual, COOKIE_NAME } from "@/lib/auth";

// Obtener perfil del usuario autenticado
export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        foto: true,
        telefono: true,
        bio: true,
        ubicacion: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Logout: eliminar cookie de sesión
export async function POST() {
  const response = NextResponse.json({ mensaje: "Sesión cerrada" });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
