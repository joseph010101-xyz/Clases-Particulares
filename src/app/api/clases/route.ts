// =============================================
// ClasesYa - API: Servicios (Clases)
// GET  /api/clases → listar servicios con filtros
// POST /api/clases → crear un servicio (solo profesores)
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { servicioSchema } from "@/lib/validations";
import { promedioCalificaciones } from "@/lib/dominio";

// Listar servicios con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const materia = searchParams.get("materia");
    const modalidad = searchParams.get("modalidad");
    const nivel = searchParams.get("nivel");
    const precioMin = searchParams.get("precioMin");
    const precioMax = searchParams.get("precioMax");
    const profesorId = searchParams.get("profesorId");
    const categoriaId = searchParams.get("categoriaId");
    const orden = searchParams.get("orden"); // recientes | precioAsc | precioDesc | calificacion
    const propios = searchParams.get("propios") === "true";
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1") || 1);
    const limite = Math.min(Math.max(1, parseInt(searchParams.get("limite") || "12") || 12), 50);

    // Si el profesor pide sus propios servicios, incluir inactivos
    let incluirInactivos = false;
    if (propios && profesorId) {
      const payload = await obtenerUsuarioActual();
      if (payload && payload.userId === profesorId) {
        incluirInactivos = true;
      }
    }

    // Filtro dinámico
    const where = {
      ...(incluirInactivos ? {} : { activo: true }),
      ...(incluirInactivos ? {} : { profesor: { activo: true } }),
      ...(profesorId && { profesorId }),
      ...(categoriaId && { categoriaId }),
      ...(materia && {
        materia: { contains: materia, mode: "insensitive" as const },
      }),
      ...(modalidad && {
        modalidad: modalidad as "PRESENCIAL" | "VIRTUAL" | "AMBOS",
      }),
      ...(nivel && {
        nivel: { contains: nivel, mode: "insensitive" as const },
      }),
      ...(precioMin || precioMax
        ? {
            precioHora: {
              ...(precioMin && { gte: parseFloat(precioMin) }),
              ...(precioMax && { lte: parseFloat(precioMax) }),
            },
          }
        : {}),
    };

    // La calificación media no es una columna: cuando se ordena por ella hay que
    // traer el conjunto filtrado (con un tope de seguridad) y ordenar en memoria.
    const ordenarPorCalificacion = orden === "calificacion";
    const TOPE_ORDEN_MEMORIA = 500;

    const ordenPrisma: Record<string, "asc" | "desc"> =
      orden === "precioAsc"
        ? { precioHora: "asc" }
        : orden === "precioDesc"
        ? { precioHora: "desc" }
        : { createdAt: "desc" };

    // Opciones de paginación/orden que se aplican a la consulta
    const paginado: { skip?: number; take: number; orderBy: Record<string, "asc" | "desc"> } =
      ordenarPorCalificacion
        ? { take: TOPE_ORDEN_MEMORIA, orderBy: { createdAt: "desc" } }
        : { skip: (pagina - 1) * limite, take: limite, orderBy: ordenPrisma };

    const [serviciosRaw, total] = await Promise.all([
      prisma.servicio.findMany({
        where,
        select: {
          id: true,
          materia: true,
          descripcion: true,
          precioHora: true,
          modalidad: true,
          nivel: true,
          duracionMin: true,
          categoriaId: true,
          categoria: { select: { id: true, nombre: true, icono: true } },
          profesor: {
            select: {
              id: true,
              nombre: true,
              foto: true,
              ubicacion: true,
              verificado: true,
            },
          },
          reservas: {
            where: { resena: { isNot: null } },
            select: { resena: { select: { calificacion: true } } },
          },
        },
        ...paginado,
      }),
      prisma.servicio.count({ where }),
    ]);

    // Compute rating stats and strip raw reservas
    let servicios = serviciosRaw.map(({ reservas, ...s }) => {
      const calificaciones = reservas
        .map((r) => r.resena?.calificacion)
        .filter((c): c is number => c != null);
      return {
        ...s,
        calificacionPromedio: promedioCalificaciones(calificaciones),
        totalResenas: calificaciones.length,
      };
    });

    // Orden por calificación: se ordena el conjunto ya calculado (los servicios
    // sin reseñas quedan al final) y se pagina en memoria.
    if (ordenarPorCalificacion) {
      servicios = servicios
        .sort((a, b) => (b.calificacionPromedio ?? -1) - (a.calificacionPromedio ?? -1))
        .slice((pagina - 1) * limite, pagina * limite);
    }

    return NextResponse.json({
      servicios,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error listando servicios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Crear un nuevo servicio (solo profesores autenticados)
export async function POST(request: NextRequest) {
  try {
    const payload = await obtenerUsuarioActual();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (payload.rol !== "PROFESOR") {
      return NextResponse.json(
        { error: "Solo los profesores pueden crear servicios" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const resultado = servicioSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const servicio = await prisma.servicio.create({
      data: {
        ...resultado.data,
        profesorId: payload.userId,
      },
    });

    return NextResponse.json(
      { mensaje: "Servicio creado exitosamente", servicio },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
