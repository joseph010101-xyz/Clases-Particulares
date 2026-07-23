// =============================================
// ClasesYa - Componente: ProfesorCard
// Tarjeta de profesor para listados
// =============================================

import Link from "next/link";
import Card, { CardBody } from "@/components/ui/Card";

interface ProfesorCardProps {
  id: string;
  nombre: string;
  foto?: string | null;
  bio?: string | null;
  ubicacion?: string | null;
  calificacionPromedio?: number | null;
  totalResenas?: number;
  servicios: {
    materia: string;
    precioHora: number | string;
    modalidad: string;
  }[];
}

export default function ProfesorCard({ id, nombre, foto, bio, ubicacion, calificacionPromedio, totalResenas, servicios }: ProfesorCardProps) {
  // Precio más bajo de los servicios
  const precioMinimo = servicios.length > 0
    ? Math.min(...servicios.map((s) => Number(s.precioHora)))
    : null;

  return (
    <Link href={`/profesores/${id}`}>
      <Card hover className="h-full">
        <CardBody>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
              {foto ? (
                <img src={foto} alt={nombre} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-blue-600">
                  {nombre.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{nombre}</h3>

              {calificacionPromedio != null && calificacionPromedio > 0 && (
                <div className="flex items-center gap-1 mt-0.5 text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium text-gray-700">{calificacionPromedio.toFixed(1)}</span>
                  <span className="text-gray-400">({totalResenas})</span>
                </div>
              )}

              {ubicacion && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {ubicacion}
                </p>
              )}

              {bio && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{bio}</p>
              )}

              {/* Materias */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {servicios.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {s.materia}
                  </span>
                ))}
                {servicios.length > 3 && (
                  <span className="text-xs text-gray-500">+{servicios.length - 3} más</span>
                )}
              </div>

              {/* Precio */}
              {precioMinimo !== null && (
                <p className="text-sm font-medium text-gray-900 mt-2">
                  Desde <span className="text-blue-600">€{precioMinimo}/h</span>
                </p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
