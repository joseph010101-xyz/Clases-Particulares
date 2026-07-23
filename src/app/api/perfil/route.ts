// =============================================
// ClasesYa - API: Perfil de usuario
// GET /api/perfil → obtener perfil completo
// PUT /api/perfil → actualizar perfil
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual, crearToken, COOKIE_NAME } from "@/lib/auth";
import { perfilSchema } from "@/lib/validations";

// Obtener perfil completo del usuario autenticado
export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
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
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Actualizar perfil del usuario autenticado
export async function PUT(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const resultado = perfilSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.update({
      where: { id: payload.userId },
      data: resultado.data,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        foto: true,
        telefono: true,
        bio: true,
        ubicacion: true,
        updatedAt: true,
      },
    });

    // Si el nombre cambió, refrescar el JWT con el nuevo nombre
    const response = NextResponse.json({ mensaje: "Perfil actualizado", usuario });
    if (resultado.data.nombre && resultado.data.nombre !== payload.nombre) {
      const nuevoToken = await crearToken({
        userId: payload.userId,
        email: payload.email,
        nombre: usuario.nombre,
        rol: payload.rol,
      });
      response.cookies.set(COOKIE_NAME, nuevoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
