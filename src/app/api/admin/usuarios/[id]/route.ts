// =============================================
// ClasesYa - API: Modificar un usuario (solo ADMIN)
// PATCH /api/admin/usuarios/[id] → cambiar rol o activar/desactivar
// Body: { rol?: Rol, activo?: boolean }
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeAdministrarUsuarios, esRolAsignable, type Rol } from "@/lib/dominio/permisos";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeAdministrarUsuarios(payload.rol)) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { id } = params;
    const { rol, activo } = await request.json();

    if (rol !== undefined && !esRolAsignable(rol)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    if (rol === undefined && typeof activo !== "boolean") {
      return NextResponse.json(
        { error: "Nada que actualizar. Envía 'rol' o 'activo'." },
        { status: 400 }
      );
    }

    // Salvaguarda: un administrador no puede cambiar su propio rol ni
    // desactivarse a sí mismo (evita quedar bloqueado fuera del sistema).
    if (id === payload.userId) {
      if (rol !== undefined && rol !== "ADMIN") {
        return NextResponse.json(
          { error: "No puedes quitarte a ti mismo el rol de administrador" },
          { status: 400 }
        );
      }
      if (activo === false) {
        return NextResponse.json(
          { error: "No puedes desactivar tu propia cuenta" },
          { status: 400 }
        );
      }
    }

    const usuario = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data: {
        ...(rol !== undefined ? { rol: rol as Rol } : {}),
        ...(typeof activo === "boolean" ? { activo } : {}),
      },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });

    return NextResponse.json({ mensaje: "Usuario actualizado", usuario: actualizado });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
