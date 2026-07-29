// =============================================
// ClasesYa - API: Datos de cobro del profesor
// GET /api/perfil/cobro → consultar los propios
// PUT /api/perfil/cobro → guardar banco, titular, cuenta, Tigo Money e indicaciones
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { datosCobroSchema } from "@/lib/validations";
import { canalesDisponibles, tieneMetodoDeCobro } from "@/lib/dominio";

export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo los profesores tienen datos de cobro" }, { status: 403 });
    }

    const datos = await prisma.datosCobro.findUnique({
      where: { profesorId: payload.userId },
    });

    return NextResponse.json({
      datos,
      canales: canalesDisponibles(datos),
      puedeCobrar: tieneMetodoDeCobro(datos),
    });
  } catch (error) {
    console.error("Error consultando datos de cobro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (payload.rol !== "PROFESOR") {
      return NextResponse.json({ error: "Solo los profesores tienen datos de cobro" }, { status: 403 });
    }

    const body = await request.json();
    const resultado = datosCobroSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Los campos vacíos se guardan como nulos para que las reglas de dominio
    // no los confundan con datos utilizables.
    const limpio = (v: string | null | undefined) => {
      const t = (v ?? "").trim();
      return t === "" ? null : t;
    };
    const datosLimpios = {
      banco: limpio(resultado.data.banco),
      titular: limpio(resultado.data.titular),
      numeroCuenta: limpio(resultado.data.numeroCuenta),
      tigoMoney: limpio(resultado.data.tigoMoney),
      instrucciones: limpio(resultado.data.instrucciones),
    };

    const datos = await prisma.datosCobro.upsert({
      where: { profesorId: payload.userId },
      create: { profesorId: payload.userId, ...datosLimpios },
      update: datosLimpios,
    });

    return NextResponse.json({
      mensaje: "Datos de cobro guardados",
      datos,
      canales: canalesDisponibles(datos),
      puedeCobrar: tieneMetodoDeCobro(datos),
    });
  } catch (error) {
    console.error("Error guardando datos de cobro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
