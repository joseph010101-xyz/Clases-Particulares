// =============================================
// ClasesYa - Componente: ClaseCard
// Tarjeta de servicio/clase para listados
// =============================================

import Link from "next/link";
import Card, { CardBody, CardFooter } from "@/components/ui/Card";
import BadgeVerificado from "@/components/ui/BadgeVerificado";

interface ClaseCardProps {
  id: string;
  materia: string;
  descripcion: string;
  precioHora: number | string;
  modalidad: string;
  nivel?: string | null;
  duracionMin: number;
  calificacionPromedio?: number | null;
  totalResenas?: number;
  profesor: {
    id: string;
    nombre: string;
    foto?: string | null;
    ubicacion?: string | null;
    verificado?: boolean;
  };
}

const badgeModalidad: Record<string, string> = {
  VIRTUAL: "bg-green-50 text-green-700",
  PRESENCIAL: "bg-orange-50 text-orange-700",
  AMBOS: "bg-purple-50 text-purple-700",
};

export default function ClaseCard({
  id,
  materia,
  descripcion,
  precioHora,
  modalidad,
  nivel,
  duracionMin,
  calificacionPromedio,
  totalResenas,
  profesor,
}: ClaseCardProps) {
  return (
    <Link href={`/clases/${id}`}>
      <Card hover className="h-full flex flex-col">
        <CardBody className="flex-1">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeModalidad[modalidad] || "bg-gray-50 text-gray-700"}`}>
              {modalidad === "AMBOS" ? "Virtual / Presencial" : modalidad.charAt(0) + modalidad.slice(1).toLowerCase()}
            </span>
            {nivel && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {nivel}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900">{materia}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{descripcion}</p>

          {/* Profesor */}
          <div className="flex items-center gap-2 mt-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {profesor.foto ? (
                <img src={profesor.foto} alt={profesor.nombre} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-blue-600">
                  {profesor.nombre.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                {profesor.nombre}
                {profesor.verificado && <BadgeVerificado soloIcono />}
              </p>
              {profesor.ubicacion && (
                <p className="text-xs text-gray-500">{profesor.ubicacion}</p>
              )}
            </div>
          </div>

          {/* Rating */}
          {calificacionPromedio != null && calificacionPromedio > 0 && (
            <div className="flex items-center gap-1 mt-3 text-sm">
              <span className="text-yellow-500">★</span>
              <span className="font-medium text-gray-700">{calificacionPromedio.toFixed(1)}</span>
              <span className="text-gray-400">({totalResenas})</span>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-blue-600">€{Number(precioHora)}</span>
            <span className="text-sm text-gray-500">/hora</span>
          </div>
          <span className="text-xs text-gray-500">{duracionMin} min</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
