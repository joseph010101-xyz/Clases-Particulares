// =============================================
// ClasesYa - API: Exportar reservas a CSV
// GET /api/reservas/exportar → descarga las reservas del usuario autenticado
// (las suyas como estudiante, o las de sus servicios como profesor).
// =============================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { generarCSV } from "@/lib/dominio";

export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const esEstudiante = payload.rol === "ESTUDIANTE";
    const where = esEstudiante
      ? { estudianteId: payload.userId }
      : { servicio: { profesorId: payload.userId } };

    const reservas = await prisma.reserva.findMany({
      where,
      select: {
        fecha: true,
        horaInicio: true,
        horaFin: true,
        estado: true,
        notas: true,
        createdAt: true,
        servicio: {
          select: {
            materia: true,
            precioHora: true,
            modalidad: true,
            profesor: { select: { nombre: true } },
          },
        },
        estudiante: { select: { nombre: true, email: true } },
        resena: { select: { calificacion: true } },
      },
      orderBy: { fecha: "desc" },
    });

    const cabeceras = [
      "Fecha",
      "Hora inicio",
      "Hora fin",
      "Materia",
      "Modalidad",
      esEstudiante ? "Profesor" : "Estudiante",
      ...(esEstudiante ? [] : ["Email estudiante"]),
      "Estado",
      "Precio/hora",
      "Calificación",
      "Notas",
      "Solicitada el",
    ];

    const filas = reservas.map((r) => [
      r.fecha.toISOString().slice(0, 10),
      r.horaInicio,
      r.horaFin,
      r.servicio.materia,
      r.servicio.modalidad,
      esEstudiante ? r.servicio.profesor.nombre : r.estudiante.nombre,
      ...(esEstudiante ? [] : [r.estudiante.email]),
      r.estado,
      Number(r.servicio.precioHora),
      r.resena?.calificacion ?? "",
      r.notas ?? "",
      r.createdAt.toISOString().slice(0, 10),
    ]);

    const csv = generarCSV(cabeceras, filas);
    const nombreArchivo = `reservas-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    console.error("Error exportando reservas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
