// =============================================
// ClasesYa - API: Exportar usuarios a CSV (solo ADMIN)
// GET /api/admin/usuarios/exportar
// =============================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeAdministrarUsuarios } from "@/lib/dominio/permisos";
import { generarCSV } from "@/lib/dominio";

export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!puedeAdministrarUsuarios(payload.rol)) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        verificado: true,
        ubicacion: true,
        ultimoAcceso: true,
        createdAt: true,
        _count: { select: { servicios: true, reservas: true, cursos: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const cabeceras = [
      "Nombre",
      "Email",
      "Rol",
      "Activo",
      "Verificado",
      "Ubicación",
      "Servicios",
      "Reservas",
      "Cursos",
      "Última conexión",
      "Registrado el",
    ];

    const filas = usuarios.map((u) => [
      u.nombre,
      u.email,
      u.rol,
      u.activo ? "Sí" : "No",
      u.verificado ? "Sí" : "No",
      u.ubicacion ?? "",
      u._count.servicios,
      u._count.reservas,
      u._count.cursos,
      u.ultimoAcceso ? u.ultimoAcceso.toISOString().slice(0, 16).replace("T", " ") : "",
      u.createdAt.toISOString().slice(0, 10),
    ]);

    const csv = generarCSV(cabeceras, filas);
    const nombreArchivo = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    console.error("Error exportando usuarios:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
