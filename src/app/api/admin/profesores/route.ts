// =============================================
// ClasesYa - API: Administración de profesores
// GET /api/admin/profesores → listar profesores para moderación (solo ADMIN)
// Filtro opcional: ?estado=pendientes | verificados
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeModerar } from "@/lib/dominio/permisos";

export async function GET(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeModerar(payload.rol)) {
      return NextResponse.json({ error: "Sin permisos de moderación" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    const where = {
      rol: "PROFESOR" as const,
      ...(estado === "pendientes" ? { verificado: false } : {}),
      ...(estado === "verificados" ? { verificado: true } : {}),
    };

    const profesores = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        foto: true,
        ubicacion: true,
        bio: true,
        activo: true,
        verificado: true,
        verificadoAt: true,
        createdAt: true,
        _count: { select: { servicios: true } },
      },
      orderBy: [{ verificado: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ profesores });
  } catch (error) {
    console.error("Error listando profesores (admin):", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
