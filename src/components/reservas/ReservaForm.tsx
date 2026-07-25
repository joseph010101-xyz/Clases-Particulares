// =============================================
// ClasesYa - Componente: ReservaForm
// Formulario para crear una nueva reserva
// =============================================

"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import Button from "@/components/ui/Button";
import SelectorFecha from "@/components/ui/SelectorFecha";
import SelectorHora from "@/components/ui/SelectorHora";
import {
  bloqueAdmiteDuracion,
  claseCabeEnBloque,
  jsDayADiaSemana,
  minutosDesdeHHmm,
  DIAS_SEMANA,
} from "@/lib/dominio";

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

// Intervalo entre horas de inicio propuestas
const PASO_MINUTOS = 15;

function aHHmm(minutos: number): string {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ReservaForm({
  servicioId,
  duracionMin,
  profesorId,
  onSubmit,
  cargando,
}: ReservaFormProps) {
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [notas, setNotas] = useState("");
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [cargandoDisp, setCargandoDisp] = useState(false);

  // Disponibilidad del profesor
  useEffect(() => {
    if (!profesorId) return;
    setCargandoDisp(true);
    fetch(`/api/disponibilidad?profesorId=${profesorId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDisponibilidades(data.disponibilidad);
      })
      .catch(() => {})
      .finally(() => setCargandoDisp(false));
  }, [profesorId]);

  // Hora de fin calculada a partir de la duración del servicio
  const horaFin = useMemo(() => {
    if (!horaInicio) return "";
    return aHHmm(minutosDesdeHHmm(horaInicio) + duracionMin);
  }, [horaInicio, duracionMin]);

  // Fecha mínima: hoy
  const fechaMinima = useMemo(() => {
    const hoy = new Date();
    const m = String(hoy.getMonth() + 1).padStart(2, "0");
    const d = String(hoy.getDate()).padStart(2, "0");
    return `${hoy.getFullYear()}-${m}-${d}`;
  }, []);

  // Días de la semana en los que el profesor tiene algún bloque donde la clase cabe
  const diasHabilitados = useMemo(() => {
    if (disponibilidades.length === 0) return undefined; // sin horarios: no restringimos
    const dias = disponibilidades
      .filter((d) => bloqueAdmiteDuracion(d.horaInicio, d.horaFin, duracionMin))
      .map((d) => d.diaSemana);
    return Array.from(new Set(dias));
  }, [disponibilidades, duracionMin]);

  // Bloques del día elegido
  const slotsDia = useMemo(() => {
    if (!fecha) return [];
    const diaSemana = jsDayADiaSemana(new Date(fecha + "T12:00:00").getDay());
    return disponibilidades.filter((d) => d.diaSemana === diaSemana);
  }, [fecha, disponibilidades]);

  const nombreDia = fecha
    ? DIAS_SEMANA[jsDayADiaSemana(new Date(fecha + "T12:00:00").getDay())]
    : "";

  // Horas de inicio válidas: solo aquellas en las que la clase entra completa
  const horasValidas = useMemo(() => {
    if (!fecha) return [];
    if (slotsDia.length === 0) return [];
    const horas = new Set<string>();
    for (const slot of slotsDia) {
      const inicio = minutosDesdeHHmm(slot.horaInicio);
      const fin = minutosDesdeHHmm(slot.horaFin);
      for (let m = inicio; m + duracionMin <= fin; m += PASO_MINUTOS) {
        const candidata = aHHmm(m);
        if (claseCabeEnBloque(candidata, duracionMin, slot.horaInicio, slot.horaFin)) {
          horas.add(candidata);
        }
      }
    }
    return Array.from(horas).sort();
  }, [fecha, slotsDia, duracionMin]);

  // Si cambia el día, se limpia una hora que ya no sea válida
  useEffect(() => {
    if (horaInicio && horasValidas.length > 0 && !horasValidas.includes(horaInicio)) {
      setHoraInicio("");
    }
  }, [horasValidas, horaInicio]);

  const listo = Boolean(fecha && horaInicio && horaFin);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!listo) return;
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
      {/* Horarios del profesor */}
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
        <SelectorFecha
          valor={fecha}
          onChange={(v) => {
            setFecha(v);
            setHoraInicio("");
          }}
          min={fechaMinima}
          diasHabilitados={diasHabilitados}
        />
      </div>

      {fecha && slotsDia.length === 0 && disponibilidades.length > 0 && (
        <p className="text-xs text-amber-600">
          ⚠️ El profesor no tiene horarios configurados para {nombreDia}.
        </p>
      )}

      {fecha && slotsDia.length > 0 && horasValidas.length === 0 && (
        <p className="text-xs text-amber-600">
          ⚠️ Esta clase dura {duracionMin} min y no cabe en los bloques del {nombreDia}.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio *</label>
        <SelectorHora
          valor={horaInicio}
          onChange={setHoraInicio}
          opciones={disponibilidades.length > 0 ? horasValidas : undefined}
          disabled={!fecha}
          placeholder={fecha ? "Elige una hora" : "Primero elige la fecha"}
        />
        {horaFin && (
          <p className="text-xs text-gray-500 mt-1">
            Termina a las <strong>{horaFin}</strong> ({duracionMin} min)
          </p>
        )}
        {fecha && disponibilidades.length > 0 && horasValidas.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Solo se ofrecen horas en las que la clase entra completa en el horario del profesor.
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

      <Button type="submit" cargando={cargando} disabled={!listo} className="w-full">
        Reservar clase
      </Button>
    </form>
  );
}
