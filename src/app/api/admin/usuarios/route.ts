// =============================================
// ClasesYa - API: Gestión de usuarios (solo ADMIN)
// GET /api/admin/usuarios → listar usuarios con filtro por rol/búsqueda
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeAdministrarUsuarios } from "@/lib/dominio/permisos";

export async function GET(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeAdministrarUsuarios(payload.rol)) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rol = searchParams.get("rol");
    const busqueda = searchParams.get("q");
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1") || 1);
    const porPagina = Math.min(
      Math.max(1, parseInt(searchParams.get("porPagina") || "20") || 20),
      100
    );

    const rolesValidos = ["ESTUDIANTE", "PROFESOR", "MODERADOR", "ADMIN"];

    const where = {
      ...(rol && rolesValidos.includes(rol) ? { rol: rol as "ESTUDIANTE" | "PROFESOR" | "MODERADOR" | "ADMIN" } : {}),
      ...(busqueda
        ? {
            OR: [
              { nombre: { contains: busqueda, mode: "insensitive" as const } },
              { email: { contains: busqueda, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
          verificado: true,
          ultimoAcceso: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.usuario.count({ where }),
    ]);

    return NextResponse.json({
      usuarios,
      paginacion: {
        pagina,
        porPagina,
        total,
        totalPaginas: Math.ceil(total / porPagina),
      },
    });
  } catch (error) {
    console.error("Error listando usuarios (admin):", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
