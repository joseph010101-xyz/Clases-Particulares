// =============================================
// ClasesYa - Componente: ReservaCard
// Tarjeta de reserva para listados
// =============================================

"use client";

import { useState } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PagoClase from "@/components/reservas/PagoClase";
import { formatearPrecioHora } from "@/lib/dominio/moneda";
import { ETIQUETA_ESTADO_PAGO, type EstadoPago } from "@/lib/dominio";

interface ReservaCardProps {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  notas?: string | null;
  materia: string;
  profesorNombre: string;
  estudianteNombre: string;
  precioHora: number | string;
  modalidad: string;
  tieneResena: boolean;
  estadoPago?: EstadoPago | null;
  rolUsuario: "PROFESOR" | "ESTUDIANTE";
  onCambiarEstado?: (id: string, estado: string) => Promise<void>;
  onResenar?: (id: string) => void;
  onPagoActualizado?: () => void;
}

const coloresEstado: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
  COMPLETADA: "bg-blue-100 text-blue-800",
};

const coloresPago: Record<EstadoPago, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  COMPLETADO: "bg-green-100 text-green-800",
  FALLIDO: "bg-red-100 text-red-800",
  REEMBOLSADO: "bg-gray-100 text-gray-700",
};

export default function ReservaCard({
  id,
  fecha,
  horaInicio,
  horaFin,
  estado,
  notas,
  materia,
  profesorNombre,
  estudianteNombre,
  precioHora,
  modalidad,
  tieneResena,
  estadoPago,
  rolUsuario,
  onCambiarEstado,
  onResenar,
  onPagoActualizado,
}: ReservaCardProps) {
  const [pagoAbierto, setPagoAbierto] = useState(false);

  const fechaFormateada = new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // El dinero solo entra en juego con la clase ya aceptada y con un precio.
  const cobrable =
    Number(precioHora) > 0 && (estado === "CONFIRMADA" || estado === "COMPLETADA");
  const pagoResuelto = estadoPago === "COMPLETADO" || estadoPago === "REEMBOLSADO";

  return (
    <Card className="overflow-hidden">
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{materia}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${coloresEstado[estado]}`}>
                {estado}
              </span>
              {cobrable && estadoPago && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${coloresPago[estadoPago]}`}>
                  Pago: {ETIQUETA_ESTADO_PAGO[estadoPago].toLowerCase()}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600">
              {rolUsuario === "ESTUDIANTE" ? `Profesor: ${profesorNombre}` : `Estudiante: ${estudianteNombre}`}
            </p>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {fechaFormateada}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {horaInicio} - {horaFin}
              </span>
              <span>{formatearPrecioHora(precioHora)} · {modalidad.charAt(0) + modalidad.slice(1).toLowerCase()}</span>
            </div>

            {notas && (
              <p className="text-sm text-gray-500 mt-2 italic">&quot;{notas}&quot;</p>
            )}
          </div>
        </div>

        {/* Acciones según estado y rol */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
          {/* Profesor: confirmar o completar */}
          {rolUsuario === "PROFESOR" && estado === "PENDIENTE" && onCambiarEstado && (
            <>
              <Button
                tamano="sm"
                onClick={() => onCambiarEstado(id, "CONFIRMADA")}
              >
                Confirmar
              </Button>
              <Button
                tamano="sm"
                variante="danger"
                onClick={() => onCambiarEstado(id, "CANCELADA")}
              >
                Rechazar
              </Button>
            </>
          )}
          {rolUsuario === "PROFESOR" && estado === "CONFIRMADA" && onCambiarEstado && (
            <Button
              tamano="sm"
              onClick={() => onCambiarEstado(id, "COMPLETADA")}
            >
              Marcar completada
            </Button>
          )}

          {/* Estudiante: cancelar o reseñar */}
          {rolUsuario === "ESTUDIANTE" && (estado === "PENDIENTE" || estado === "CONFIRMADA") && onCambiarEstado && (
            <Button
              tamano="sm"
              variante="danger"
              onClick={() => onCambiarEstado(id, "CANCELADA")}
            >
              Cancelar reserva
            </Button>
          )}
          {rolUsuario === "ESTUDIANTE" && estado === "COMPLETADA" && !tieneResena && onResenar && (
            <Button
              tamano="sm"
              variante="secondary"
              onClick={() => onResenar(id)}
            >
              Dejar reseña
            </Button>
          )}
          {estado === "COMPLETADA" && tieneResena && (
            <span className="text-sm text-green-600 font-medium">✓ Reseña enviada</span>
          )}

          {/* Pago de la clase: el estudiante lo registra, el profesor lo confirma */}
          {cobrable && !(rolUsuario === "PROFESOR" && !estadoPago) && (
            <Button
              tamano="sm"
              variante={pagoResuelto ? "secondary" : "primary"}
              onClick={() => setPagoAbierto(true)}
            >
              {rolUsuario === "ESTUDIANTE"
                ? pagoResuelto
                  ? "Ver el pago"
                  : estadoPago
                    ? "Ver o corregir el pago"
                    : "Pagar la clase"
                : estadoPago === "PENDIENTE"
                  ? "Revisar el pago"
                  : "Ver el pago"}
            </Button>
          )}
        </div>
      </CardBody>

      {pagoAbierto && (
        <PagoClase
          reservaId={id}
          rol={rolUsuario}
          abierto={pagoAbierto}
          onCerrar={() => setPagoAbierto(false)}
          onCambio={() => onPagoActualizado?.()}
        />
      )}
    </Card>
  );
}
