// =============================================
// ClasesYa - API: Registro de auditoría (ADMIN o MODERADOR)
// GET /api/admin/auditoria?pagina=&porPagina= → historial de acciones
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
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1") || 1);
    const porPagina = Math.min(
      Math.max(1, parseInt(searchParams.get("porPagina") || "20") || 20),
      100
    );

    const [registros, total] = await Promise.all([
      prisma.registroAuditoria.findMany({
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.registroAuditoria.count(),
    ]);

    return NextResponse.json({
      registros,
      paginacion: {
        pagina,
        porPagina,
        total,
        totalPaginas: Math.ceil(total / porPagina),
      },
    });
  } catch (error) {
    console.error("Error listando auditoría:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
