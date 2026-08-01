// =============================================
// ClasesYa - API: Tarea por ID
// GET    /api/tareas/[id] → detalle; el dueño ve todas las entregas, el
//                           estudiante inscrito solo la suya.
// DELETE /api/tareas/[id] → borrar la tarea (solo el profesor dueño)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { eliminarArchivo, cloudinaryDisponible, type TipoRecurso } from "@/lib/cloudinary";
import { rutaDescargaEntrega } from "@/lib/descargas";
import { puedeVerMaterial } from "@/lib/dominio/cursos";
import { inscripcionDaAcceso, esEntregaTardia } from "@/lib/dominio";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tarea = await prisma.tarea.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fechaLimite: true,
        createdAt: true,
        curso: { select: { id: true, titulo: true, profesorId: true } },
      },
    });
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    const esDueño = tarea.curso.profesorId === payload.userId;
    const estaInscrito = esDueño
      ? false
      : inscripcionDaAcceso(
          (
            await prisma.inscripcion.findUnique({
              where: { cursoId_estudianteId: { cursoId: tarea.curso.id, estudianteId: payload.userId } },
              select: { estado: true },
            })
          )?.estado
        );

    if (!puedeVerMaterial({ esDueño, estaInscrito })) {
      return NextResponse.json({ error: "Sin acceso a esta tarea" }, { status: 403 });
    }

    if (esDueño) {
      // El profesor ve todas las entregas
      const entregas = await prisma.entrega.findMany({
        where: { tareaId: id },
        select: {
          id: true,
          comentario: true,
          url: true,
          formato: true,
          bytes: true,
          calificacion: true,
          retroalimentacion: true,
          createdAt: true,
          updatedAt: true,
          estudiante: { select: { id: true, nombre: true, foto: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        tarea,
        esDueño: true,
        // La ruta propia, no la de Cloudinary: una entrega no es pública.
        // `tardia` se calcula al leer y no se guarda: si el profesor amplía el
        // plazo, la marca desaparece sola, que es lo que él espera.
        entregas: entregas.map((e) => ({
          ...e,
          url: e.url ? rutaDescargaEntrega(e.id) : null,
          tardia: esEntregaTardia(tarea.fechaLimite, e.updatedAt),
        })),
      });
    }

    // El estudiante solo ve su propia entrega
    const miEntrega = await prisma.entrega.findUnique({
      where: { tareaId_estudianteId: { tareaId: id, estudianteId: payload.userId } },
      select: {
        id: true,
        comentario: true,
        url: true,
        formato: true,
        bytes: true,
        calificacion: true,
        retroalimentacion: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      tarea,
      esDueño: false,
      miEntrega: miEntrega
        ? {
            ...miEntrega,
            url: miEntrega.url ? rutaDescargaEntrega(miEntrega.id) : null,
            tardia: esEntregaTardia(tarea.fechaLimite, miEntrega.updatedAt),
          }
        : null,
    });
  } catch (error) {
    console.error("Error obteniendo tarea:", error);
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
    const tarea = await prisma.tarea.findUnique({
      where: { id },
      select: {
        curso: { select: { profesorId: true } },
        // Los archivos de las entregas hay que borrarlos a mano: la cascada de
        // la base de datos se lleva las filas, pero no lo que hay en el
        // almacenamiento, que se quedaría ocupando cuota para siempre.
        entregas: { select: { publicId: true, tipoRecurso: true } },
      },
    });
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    if (tarea.curso.profesorId !== payload.userId) {
      return NextResponse.json({ error: "No tienes permiso sobre esta tarea" }, { status: 403 });
    }

    await prisma.tarea.delete({ where: { id } });

    // Después de borrar la fila: si el almacenamiento falla, el profesor no se
    // queda con una tarea que no se puede eliminar.
    if (cloudinaryDisponible()) {
      await Promise.all(
        tarea.entregas
          .filter((e) => e.publicId)
          .map((e) =>
            eliminarArchivo(e.publicId as string, (e.tipoRecurso as TipoRecurso) ?? "raw").catch(
              (err) => console.error("No se pudo borrar el archivo de una entrega:", err)
            )
          )
      );
    }

    return NextResponse.json({ mensaje: "Tarea eliminada" });
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
