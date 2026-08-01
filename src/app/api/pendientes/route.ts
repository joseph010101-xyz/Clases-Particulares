// =============================================
// ClasesYa - API: lo que le queda por hacer al usuario
// GET /api/pendientes → una sola lista, ya priorizada, según el rol.
//
// Antes, saber qué tenías pendiente obligaba a entrar curso por curso y a
// recordar en cuáles estabas inscrito. Esta ruta responde esa pregunta de una
// vez: es la diferencia entre una web que consultas y un sistema que te avisa.
// =============================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import {
  urgenciaDeFecha,
  ordenarPendientes,
  contarUrgentes,
  type Pendiente,
} from "@/lib/dominio";

// Tope de elementos: el panel es un recordatorio, no un listado exhaustivo.
const MAX_PENDIENTES = 40;

export async function GET() {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const ahora = new Date();
    const pendientes: Pendiente[] =
      payload.rol === "PROFESOR"
        ? await pendientesDelProfesor(payload.userId, ahora)
        : await pendientesDelEstudiante(payload.userId, ahora);

    const ordenadas = ordenarPendientes(pendientes).slice(0, MAX_PENDIENTES);

    return NextResponse.json({
      pendientes: ordenadas,
      total: pendientes.length,
      urgentes: contarUrgentes(pendientes),
    });
  } catch (error) {
    console.error("Error obteniendo los pendientes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ---- Estudiante: lo que debe entregar y lo que debe pagar ----
async function pendientesDelEstudiante(userId: string, ahora: Date): Promise<Pendiente[]> {
  const inscripciones = await prisma.inscripcion.findMany({
    where: { estudianteId: userId },
    select: {
      estado: true,
      curso: {
        select: {
          id: true,
          titulo: true,
          activo: true,
          fechaFin: true,
          tareas: {
            select: {
              id: true,
              titulo: true,
              fechaLimite: true,
              // Solo la suya: saber si ya entregó
              entregas: { where: { estudianteId: userId }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  const lista: Pendiente[] = [];

  for (const ins of inscripciones) {
    // Un pago sin resolver bloquea el curso entero: va primero y las tareas de
    // ese curso ni se listan, porque todavía no puede entrar a hacerlas.
    if (ins.estado === "PENDIENTE_PAGO" || ins.estado === "RECHAZADA") {
      lista.push({
        tipo: "PAGO",
        titulo:
          ins.estado === "RECHAZADA"
            ? "Tu comprobante fue rechazado"
            : "Te falta pagar para entrar",
        contexto: ins.curso.titulo,
        enlace: `/cursos/${ins.curso.id}`,
        urgencia: ins.estado === "RECHAZADA" ? "vencida" : "hoy",
        fecha: null,
      });
      continue;
    }

    // Un curso ya cerrado no genera deberes nuevos
    if (!ins.curso.activo) continue;

    for (const tarea of ins.curso.tareas) {
      if (tarea.entregas.length > 0) continue; // ya entregada
      lista.push({
        tipo: "TAREA",
        titulo: tarea.titulo,
        contexto: ins.curso.titulo,
        enlace: `/tareas/${tarea.id}`,
        urgencia: urgenciaDeFecha(tarea.fechaLimite, ahora),
        fecha: tarea.fechaLimite ? tarea.fechaLimite.toISOString() : null,
      });
    }
  }

  // Clases confirmadas que todavía no ha pagado
  const reservas = await prisma.reserva.findMany({
    where: {
      estudianteId: userId,
      estado: "CONFIRMADA",
      OR: [{ pago: null }, { pago: { estado: "FALLIDO" } }],
    },
    select: {
      id: true,
      fecha: true,
      servicio: { select: { materia: true, precioHora: true } },
    },
  });

  for (const r of reservas) {
    if (Number(r.servicio.precioHora) <= 0) continue;
    lista.push({
      tipo: "PAGO",
      titulo: "Registra el pago de tu clase",
      contexto: r.servicio.materia,
      enlace: "/estudiantes/dashboard",
      urgencia: urgenciaDeFecha(r.fecha, ahora),
      fecha: r.fecha.toISOString(),
    });
  }

  return lista;
}

// ---- Profesor: lo que otros esperan de él ----
async function pendientesDelProfesor(userId: string, ahora: Date): Promise<Pendiente[]> {
  const lista: Pendiente[] = [];

  // Entregas sin calificar, de todos sus cursos a la vez
  const entregas = await prisma.entrega.findMany({
    where: {
      calificacion: null,
      tarea: { curso: { profesorId: userId } },
    },
    select: {
      createdAt: true,
      estudiante: { select: { nombre: true } },
      tarea: { select: { id: true, titulo: true, curso: { select: { titulo: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PENDIENTES,
  });

  for (const e of entregas) {
    lista.push({
      tipo: "CALIFICAR",
      titulo: `Calificar a ${e.estudiante.nombre}`,
      contexto: `${e.tarea.curso.titulo} · ${e.tarea.titulo}`,
      enlace: `/tareas/${e.tarea.id}`,
      // Lo que lleva más tiempo esperando pesa más: la fecha es la de entrega
      urgencia: urgenciaDeFecha(e.createdAt, ahora),
      fecha: e.createdAt.toISOString(),
    });
  }

  // Comprobantes de curso esperando su confirmación
  const inscripciones = await prisma.inscripcion.findMany({
    where: {
      estado: "PENDIENTE_PAGO",
      pago: { estado: "PENDIENTE" },
      curso: { profesorId: userId },
    },
    select: {
      estudiante: { select: { nombre: true } },
      curso: { select: { id: true, titulo: true } },
      pago: { select: { createdAt: true } },
    },
  });

  for (const i of inscripciones) {
    lista.push({
      tipo: "REVISAR_PAGO",
      titulo: `Confirmar el pago de ${i.estudiante.nombre}`,
      contexto: i.curso.titulo,
      enlace: `/cursos/${i.curso.id}`,
      urgencia: urgenciaDeFecha(i.pago?.createdAt, ahora),
      fecha: i.pago?.createdAt.toISOString() ?? null,
    });
  }

  // Comprobantes de clases particulares
  const pagosClase = await prisma.pago.findMany({
    where: {
      estado: "PENDIENTE",
      reserva: { servicio: { profesorId: userId } },
    },
    select: {
      createdAt: true,
      reserva: {
        select: {
          estudiante: { select: { nombre: true } },
          servicio: { select: { materia: true } },
        },
      },
    },
  });

  for (const p of pagosClase) {
    lista.push({
      tipo: "REVISAR_PAGO",
      titulo: `Confirmar el pago de ${p.reserva?.estudiante.nombre ?? "un estudiante"}`,
      contexto: p.reserva?.servicio.materia ?? "Clase particular",
      enlace: "/profesores/dashboard",
      urgencia: urgenciaDeFecha(p.createdAt, ahora),
      fecha: p.createdAt.toISOString(),
    });
  }

  // Solicitudes de clase sin responder: si no contesta, caducan solas
  const solicitudes = await prisma.reserva.findMany({
    where: { estado: "PENDIENTE", servicio: { profesorId: userId } },
    select: {
      fecha: true,
      horaInicio: true,
      estudiante: { select: { nombre: true } },
      servicio: { select: { materia: true } },
    },
  });

  for (const s of solicitudes) {
    lista.push({
      tipo: "CONFIRMAR_RESERVA",
      titulo: `${s.estudiante.nombre} pide clase`,
      contexto: `${s.servicio.materia} · ${s.horaInicio}`,
      enlace: "/profesores/dashboard",
      urgencia: urgenciaDeFecha(s.fecha, ahora),
      fecha: s.fecha.toISOString(),
    });
  }

  return lista;
}
