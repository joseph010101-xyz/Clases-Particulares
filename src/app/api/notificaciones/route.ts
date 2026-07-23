// =============================================
// ClasesYa - API: Notificaciones
// GET   /api/notificaciones → listar notificaciones del usuario
// PATCH /api/notificaciones → marcar como leídas
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";

// Listar notificaciones del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const soloNoLeidas = searchParams.get("noLeidas") === "true";

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        usuarioId: payload.userId,
        ...(soloNoLeidas && { leida: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalNoLeidas = await prisma.notificacion.count({
      where: { usuarioId: payload.userId, leida: false },
    });

    return NextResponse.json({ notificaciones, totalNoLeidas });
  } catch (error) {
    console.error("Error listando notificaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Marcar notificaciones como leídas
export async function PATCH(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    // Si se pasan IDs específicas, marcar solo esas; si no, marcar todas
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.notificacion.updateMany({
        where: {
          id: { in: ids },
          usuarioId: payload.userId,
        },
        data: { leida: true },
      });
    } else {
      await prisma.notificacion.updateMany({
        where: { usuarioId: payload.userId, leida: false },
        data: { leida: true },
      });
    }

    return NextResponse.json({ mensaje: "Notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error actualizando notificaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
