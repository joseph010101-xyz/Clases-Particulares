// =============================================
// ClasesYa - Componente: ReservaForm
// Formulario para crear una nueva reserva
// =============================================

"use client";

import { useState, useEffect, FormEvent } from "react";
import Button from "@/components/ui/Button";
import { bloqueAdmiteDuracion, claseCabeEnBloque } from "@/lib/dominio";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface Disponibilidad {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface ReservaFormProps {
  servicioId: string;
  duracionMin: number;
  profesorId?: string;
  onSubmit: (datos: {
    servicioId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }) => Promise<void>;
  cargando?: boolean;
}

export default function ReservaForm({ servicioId, duracionMin, profesorId, onSubmit, cargando }: ReservaFormProps) {
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [notas, setNotas] = useState("");
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [cargandoDisp, setCargandoDisp] = useState(false);

  // Fetch professor availability
  useEffect(() => {
    if (!profesorId) return;
    setCargandoDisp(true);
    fetch(`/api/disponibilidad?profesorId=${profesorId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setDisponibilidades(data.disponibilidad); })
      .catch(() => {})
      .finally(() => setCargandoDisp(false));
  }, [profesorId]);

  // Calcular hora fin automáticamente
  const calcularHoraFin = (inicio: string): string => {
    if (!inicio) return "";
    const [h, m] = inicio.split(":").map(Number);
    const totalMin = h * 60 + m + duracionMin;
    const finH = Math.floor(totalMin / 60) % 24;
    const finM = totalMin % 60;
    return `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
  };

  const horaFin = calcularHoraFin(horaInicio);

  // Fecha mínima: mañana
  const fechaMinima = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // Map JS getDay() (0=Sun) to our diaSemana (0=Lunes...6=Domingo)
  const jsDayToDisp = (jsDay: number) => (jsDay + 6) % 7;

  // Get availability for the selected date's day of week
  const slotsDiaSeleccionado = fecha
    ? disponibilidades.filter(
        (d) => d.diaSemana === jsDayToDisp(new Date(fecha + "T12:00:00").getDay())
      )
    : [];

  const diaSeleccionadoNombre = fecha
    ? DIAS_SEMANA[jsDayToDisp(new Date(fecha + "T12:00:00").getDay())]
    : "";

  // ¿La hora elegida entra completa en algún bloque de disponibilidad del día?
  // Solo se valida cuando el profesor tiene horarios configurados para ese día;
  // si no tiene ninguno, el aviso correspondiente ya se muestra más abajo.
  const horaInicioCabe =
    !horaInicio ||
    slotsDiaSeleccionado.length === 0 ||
    slotsDiaSeleccionado.some((slot) =>
      claseCabeEnBloque(horaInicio, duracionMin, slot.horaInicio, slot.horaFin)
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!horaInicioCabe) return;
    await onSubmit({
      servicioId,
      fecha,
      horaInicio,
      horaFin,
      notas: notas || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Horarios disponibles del profesor */}
      {profesorId && disponibilidades.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 mb-2">🗓️ Horarios disponibles del profesor</p>
          <div className="space-y-1">
            {DIAS_SEMANA.map((dia, i) => {
              const slots = disponibilidades.filter((d) => d.diaSemana === i);
              if (slots.length === 0) return null;
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-blue-700">
                  <span className="font-medium w-24">{dia}:</span>
                  <span>{slots.map((s) => `${s.horaInicio} - ${s.horaFin}`).join(", ")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {profesorId && !cargandoDisp && disponibilidades.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          El profesor no ha configurado horarios específicos. Puedes proponer cualquier hora.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => { setFecha(e.target.value); setHoraInicio(""); }}
          min={fechaMinima}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Available slots for selected day */}
      {fecha && slotsDiaSeleccionado.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-medium text-green-800 mb-2">
            Horarios disponibles el {diaSeleccionadoNombre}:
          </p>
          <div className="flex flex-wrap gap-2">
            {slotsDiaSeleccionado.map((slot) => {
              // Un bloque más corto que la duración de la clase no es reservable.
              const cabe = bloqueAdmiteDuracion(slot.horaInicio, slot.horaFin, duracionMin);
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!cabe}
                  title={cabe ? undefined : `La clase dura ${duracionMin} min y no cabe en este bloque`}
                  onClick={() => setHoraInicio(slot.horaInicio)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    !cabe
                      ? "bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed"
                      : horaInicio === slot.horaInicio
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-green-700 border-green-300 hover:bg-green-100"
                  }`}
                >
                  {slot.horaInicio} - {slot.horaFin}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-green-700/70 mt-2">
            Esta clase dura {duracionMin} min. Los bloques donde no cabe aparecen tachados.
          </p>
        </div>
      )}

      {fecha && disponibilidades.length > 0 && slotsDiaSeleccionado.length === 0 && (
        <p className="text-xs text-amber-600">
          ⚠️ El profesor no tiene horarios configurados para {diaSeleccionadoNombre}.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio *</label>
        <input
          type="time"
          value={horaInicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        {horaFin && (
          <p className="text-xs text-gray-500 mt-1">
            Hora de fin estimada: <strong>{horaFin}</strong> ({duracionMin} min)
          </p>
        )}
        {!horaInicioCabe && (
          <p className="text-xs text-red-600 mt-1">
            ⚠️ Con este inicio la clase terminaría a las {horaFin}, fuera del horario
            disponible del profesor. Elige un horario donde la clase de {duracionMin} min entre completa.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="¿Qué temas te gustaría repasar?"
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <Button type="submit" cargando={cargando} disabled={!horaInicioCabe} className="w-full">
        Reservar clase
      </Button>
    </form>
  );
}
