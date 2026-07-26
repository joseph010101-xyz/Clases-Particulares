// =============================================
// ClasesYa - API: Categoría por ID (solo ADMIN)
// PATCH  /api/categorias/[id] → editar nombre/descripcion/icono o activar
// DELETE /api/categorias/[id] → desactivar (los servicios conservan su enlace)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { categoriaSchema } from "@/lib/validations";
import { puedeAdministrarUsuarios } from "@/lib/dominio/permisos";

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
    const body = await request.json();

    // El estado activo se puede cambiar por separado de los datos
    const { activo, ...datos } = body;

    const existente = await prisma.categoria.findUnique({ where: { id }, select: { id: true } });
    if (!existente) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    let datosValidados = {};
    if (Object.keys(datos).length > 0) {
      const resultado = categoriaSchema.safeParse(datos);
      if (!resultado.success) {
        return NextResponse.json(
          { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      datosValidados = resultado.data;
    }

    try {
      const categoria = await prisma.categoria.update({
        where: { id },
        data: {
          ...datosValidados,
          ...(typeof activo === "boolean" ? { activo } : {}),
        },
      });
      return NextResponse.json({ mensaje: "Categoría actualizada", categoria });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error actualizando categoría:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
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
    const categoria = await prisma.categoria.findUnique({ where: { id }, select: { id: true } });
    if (!categoria) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    // Baja lógica: los servicios ya clasificados mantienen su referencia
    await prisma.categoria.update({ where: { id }, data: { activo: false } });

    return NextResponse.json({ mensaje: "Categoría desactivada" });
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
