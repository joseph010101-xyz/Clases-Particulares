// =============================================
// ClasesYa - API: lo que ha cobrado el profesor
// GET /api/perfil/ingresos → totales y últimos cobros confirmados
//
// Le pedimos al profesor que confirme cada pago uno a uno y hasta ahora no le
// devolvíamos ningún total. El dinero nunca pasa por la plataforma: esto es lo
// que él mismo ha dado por recibido, no un saldo.
// =============================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";

export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo para profesores" }, { status: 403 });
    }

    const suyos = {
      OR: [
        { inscripcion: { curso: { profesorId: payload.userId } } },
        { reserva: { servicio: { profesorId: payload.userId } } },
      ],
    };

    const inicioDeMes = new Date();
    inicioDeMes.setDate(1);
    inicioDeMes.setHours(0, 0, 0, 0);

    const [confirmados, esteMes, pendientes, ultimos] = await Promise.all([
      prisma.pago.aggregate({
        where: { ...suyos, estado: "COMPLETADO" },
        _sum: { monto: true },
        _count: { _all: true },
      }),
      prisma.pago.aggregate({
        where: { ...suyos, estado: "COMPLETADO", revisadoEn: { gte: inicioDeMes } },
        _sum: { monto: true },
        _count: { _all: true },
      }),
      prisma.pago.aggregate({
        where: { ...suyos, estado: "PENDIENTE" },
        _sum: { monto: true },
        _count: { _all: true },
      }),
      prisma.pago.findMany({
        where: { ...suyos, estado: "COMPLETADO" },
        select: {
          id: true,
          monto: true,
          metodoPago: true,
          revisadoEn: true,
          inscripcion: {
            select: {
              estudiante: { select: { nombre: true } },
              curso: { select: { titulo: true } },
            },
          },
          reserva: {
            select: {
              estudiante: { select: { nombre: true } },
              servicio: { select: { materia: true } },
            },
          },
        },
        orderBy: { revisadoEn: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      // Prisma devuelve Decimal; se normaliza a número en la frontera
      total: Number(confirmados._sum.monto ?? 0),
      totalCobros: confirmados._count._all,
      esteMes: Number(esteMes._sum.monto ?? 0),
      cobrosEsteMes: esteMes._count._all,
      porConfirmar: Number(pendientes._sum.monto ?? 0),
      cobrosPorConfirmar: pendientes._count._all,
      ultimos: ultimos.map((p) => ({
        id: p.id,
        monto: Number(p.monto),
        metodoPago: p.metodoPago,
        fecha: p.revisadoEn,
        estudiante:
          p.inscripcion?.estudiante.nombre ?? p.reserva?.estudiante.nombre ?? "—",
        concepto: p.inscripcion?.curso.titulo ?? p.reserva?.servicio.materia ?? "—",
        origen: p.inscripcion ? ("CURSO" as const) : ("CLASE" as const),
      })),
    });
  } catch (error) {
    console.error("Error calculando los ingresos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
