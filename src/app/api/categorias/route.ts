// =============================================
// ClasesYa - API: Categorías
// GET  /api/categorias → listar categorías activas
// POST /api/categorias → crear categoría (solo admin)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { categoriaSchema } from "@/lib/validations";

// Listar categorías activas (público)
export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        icono: true,
        _count: { select: { servicios: true } },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error("Error listando categorías:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Crear categoría (solo admin)
export async function POST(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores pueden crear categorías" }, { status: 403 });
    }

    const body = await request.json();
    const resultado = categoriaSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { nombre, descripcion, icono } = resultado.data;

    // Verificar nombre único
    const existente = await prisma.categoria.findUnique({ where: { nombre } });
    if (existente) {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }

    const categoria = await prisma.categoria.create({
      data: { nombre, descripcion, icono },
    });

    return NextResponse.json({ mensaje: "Categoría creada", categoria }, { status: 201 });
  } catch (error) {
    console.error("Error creando categoría:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
