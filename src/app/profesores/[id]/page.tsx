// =============================================
// ClasesYa - Página: Detalle de Profesor
// =============================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StarRating from "@/components/ui/StarRating";
import ClaseCard from "@/components/clases/ClaseCard";
import Button from "@/components/ui/Button";
import BadgeVerificado from "@/components/ui/BadgeVerificado";

interface Servicio {
  id: string;
  materia: string;
  descripcion: string | null;
  precioHora: number;
  modalidad: string;
  nivel: string;
  duracionMin: number;
  calificacionPromedio: number | null;
  totalResenas: number;
  resenas: {
    calificacion: number;
    comentario: string | null;
    createdAt: string;
  }[];
}

interface Disponibilidad {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface ProfesorDetalle {
  id: string;
  nombre: string;
  foto: string | null;
  bio: string | null;
  ubicacion: string | null;
  verificado?: boolean;
  servicios: Servicio[];
  disponibilidad: Disponibilidad[];
}

// 0=Lunes ... 6=Domingo (matches schema comment)
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function ProfesorDetallePage() {
  const params = useParams();
  const id = params.id as string;

  const [profesor, setProfesor] = useState<ProfesorDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfesor = async () => {
      try {
        const res = await fetch(`/api/profesores/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Profesor no encontrado");
          return;
        }

        setProfesor(data.profesor);
      } catch {
        setError("Error al cargar el perfil del profesor");
      } finally {
        setCargando(false);
      }
    };

    fetchProfesor();
  }, [id]);

  if (cargando) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="md:col-span-2 h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profesor) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profesor no encontrado</h1>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link href="/profesores">
          <Button>Volver a profesores</Button>
        </Link>
      </div>
    );
  }

  // Agrupar disponibilidad por día
  const disponibilidadPorDia = profesor.disponibilidad.reduce<Record<number, Disponibilidad[]>>((acc, d) => {
    if (!acc[d.diaSemana]) acc[d.diaSemana] = [];
    acc[d.diaSemana].push(d);
    return acc;
  }, {});

  // Calcular promedio global y recopilar reseñas de todos los servicios
  const todasResenas = profesor.servicios.flatMap((s) =>
    s.resenas.map((r) => ({ ...r, materia: s.materia }))
  );
  const totalResenas = todasResenas.length;
  const promedioCalificacion =
    totalResenas > 0
      ? Math.round(
          (todasResenas.reduce((sum, r) => sum + r.calificacion, 0) / totalResenas) * 10
        ) / 10
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Perfil del profesor */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            {profesor.foto ? (
              <img
                src={profesor.foto}
                alt={profesor.nombre}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                {profesor.nombre.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{profesor.nombre}</h1>
              {profesor.verificado && <BadgeVerificado />}
            </div>

            <div className="flex items-center gap-3 mt-2">
              {promedioCalificacion && (
                <div className="flex items-center gap-1">
                  <StarRating valor={promedioCalificacion} soloLectura tamano="sm" />
                  <span className="text-sm text-gray-600">
                    ({totalResenas} reseña{totalResenas !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
              {profesor.ubicacion && (
                <span className="text-sm text-gray-500">📍 {profesor.ubicacion}</span>
              )}
            </div>

            {profesor.bio && (
              <p className="mt-3 text-gray-600">{profesor.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Servicios */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Servicios ({profesor.servicios.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profesor.servicios.map((servicio) => (
                  <ClaseCard
                    key={servicio.id}
                    id={servicio.id}
                    materia={servicio.materia}
                    descripcion={servicio.descripcion || ""}
                    precioHora={servicio.precioHora}
                    modalidad={servicio.modalidad}
                    nivel={servicio.nivel}
                    duracionMin={servicio.duracionMin}
                    profesor={{ id: profesor.id, nombre: profesor.nombre, foto: profesor.foto }}
                  />
                ))}
            </div>
            {profesor.servicios.length === 0 && (
              <p className="text-gray-500">Este profesor aún no tiene servicios publicados.</p>
            )}
          </section>

          {/* Reseñas */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reseñas ({totalResenas})
            </h2>
            {todasResenas.length > 0 ? (
              <div className="space-y-4">
                {todasResenas.map((resena, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {resena.materia}
                      </span>
                      <StarRating valor={resena.calificacion} soloLectura tamano="sm" />
                    </div>
                    {resena.comentario && (
                      <p className="text-gray-600 text-sm">{resena.comentario}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(resena.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aún no hay reseñas para este profesor.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Disponibilidad */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Disponibilidad</h3>
            {Object.keys(disponibilidadPorDia).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(disponibilidadPorDia)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([dia, horarios]) => (
                    <div key={dia} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{DIAS_SEMANA[Number(dia)]}</span>
                      <div className="text-gray-600">
                        {horarios.map((h, i) => (
                          <span key={h.id}>
                            {i > 0 && ", "}
                            {h.horaInicio}-{h.horaFin}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin horario definido</p>
            )}
          </div>

          {/* Contactar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">¿Quieres reservar?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Elige uno de sus servicios y reserva tu clase particular, o escríbele
              si tienes dudas antes de reservar.
            </p>
            <div className="space-y-2">
              <Link href="/clases" className="block">
                <Button className="w-full">Ver clases disponibles</Button>
              </Link>
              <Link href={`/mensajes?conUsuarioId=${profesor.id}`} className="block">
                <Button variante="secondary" className="w-full">Enviar mensaje</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
