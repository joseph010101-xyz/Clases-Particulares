// =============================================
// ClasesYa - API: Curso por ID (aula virtual)
// GET    /api/cursos/[id] → detalle; el material solo se incluye para el dueño
//                           o estudiantes inscritos.
// DELETE /api/cursos/[id] → desactivar el curso (solo el profesor dueño)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeVerMaterial } from "@/lib/dominio/cursos";
import { inscripcionDaAcceso } from "@/lib/dominio";
import { cloudinaryDisponible } from "@/lib/cloudinary";
import { rutaDescargaMaterial } from "@/lib/descargas";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const payload = await obtenerUsuarioActual();

    const curso = await prisma.curso.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        fechaInicio: true,
        fechaFin: true,
        activo: true,
        createdAt: true,
        profesorId: true,
        profesor: { select: { id: true, nombre: true, foto: true, verificado: true } },
        _count: { select: { inscripciones: true, materiales: true } },
      },
    });

    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const esDueño = payload?.userId === curso.profesorId;

    // Solo una inscripción ACTIVA abre el material: si el pago está pendiente o
    // fue rechazado, el estudiante ve el curso pero no su contenido.
    let estaInscrito = false;
    let estadoInscripcion: string | null = null;
    if (payload && !esDueño) {
      const inscripcion = await prisma.inscripcion.findUnique({
        where: { cursoId_estudianteId: { cursoId: id, estudianteId: payload.userId } },
        select: { estado: true },
      });
      estadoInscripcion = inscripcion?.estado ?? null;
      estaInscrito = inscripcionDaAcceso(inscripcion?.estado);
    }

    // El material solo se entrega a quien tiene acceso.
    let materiales: unknown[] = [];
    if (puedeVerMaterial({ esDueño, estaInscrito })) {
      const filas = await prisma.material.findMany({
        where: { cursoId: id },
        select: { id: true, titulo: true, url: true, formato: true, bytes: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      // Se devuelve la ruta de nuestra API, nunca la de Cloudinary: esa es
      // pública y saltaría la comprobación de inscripción.
      materiales = filas.map((m) => ({
        ...m,
        url: m.url ? rutaDescargaMaterial(m.id) : null,
      }));
    }

    // Quitamos profesorId del objeto expuesto (ya viene en profesor.id)
    const { profesorId: _omit, ...cursoPublico } = curso;
    void _omit;

    return NextResponse.json({
      curso: cursoPublico,
      esDueño,
      estaInscrito,
      // Estado real, para que la interfaz sepa si mostrar el panel de pago
      estadoInscripcion,
      puedeVerMaterial: puedeVerMaterial({ esDueño, estaInscrito }),
      materiales,
      // Permite avisar en la interfaz antes de intentar una subida
      almacenamientoConfigurado: cloudinaryDisponible(),
    });
  } catch (error) {
    console.error("Error obteniendo curso:", error);
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

    const { id } = params;
    const curso = await prisma.curso.findUnique({ where: { id }, select: { profesorId: true } });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "No tienes permiso sobre este curso" }, { status: 403 });
    }

    await prisma.curso.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ mensaje: "Curso desactivado" });
  } catch (error) {
    console.error("Error eliminando curso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
