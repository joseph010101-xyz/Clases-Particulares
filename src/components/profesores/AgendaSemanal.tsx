// =============================================
// ClasesYa - Agenda semanal del profesor
// Muestra la disponibilidad como fondo y las reservas encima, para ver de un
// vistazo cómo queda la semana.
// =============================================

"use client";

import { useMemo, useState } from "react";
import { DIAS_SEMANA, jsDayADiaSemana, minutosDesdeHHmm } from "@/lib/dominio";

interface Disponibilidad {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface Reserva {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  servicio: { materia: string };
  estudiante: { nombre: string };
}

// Franja horaria representada en la rejilla
const HORA_INICIO = 7;
const HORA_FIN = 22;
const MIN_TOTAL = (HORA_FIN - HORA_INICIO) * 60;

const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: "#d97706",
  CONFIRMADA: "#059669",
  COMPLETADA: "#0284c7",
};

// Lunes de la semana que contiene la fecha dada
function lunesDe(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - jsDayADiaSemana(d.getDay()));
  return d;
}

function mismaFecha(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

// Posición vertical dentro de la rejilla, en porcentaje
function posicion(horaInicio: string, horaFin: string) {
  const inicio = minutosDesdeHHmm(horaInicio) - HORA_INICIO * 60;
  const fin = minutosDesdeHHmm(horaFin) - HORA_INICIO * 60;
  const top = Math.max(0, (inicio / MIN_TOTAL) * 100);
  const alto = Math.max(2, ((Math.min(fin, MIN_TOTAL) - Math.max(inicio, 0)) / MIN_TOTAL) * 100);
  return { top, alto };
}

export default function AgendaSemanal({
  disponibilidades,
  reservas,
}: {
  disponibilidades: Disponibilidad[];
  reservas: Reserva[];
}) {
  const [desplazamiento, setDesplazamiento] = useState(0); // semanas respecto de hoy

  const inicioSemana = useMemo(() => {
    const base = lunesDe(new Date());
    base.setDate(base.getDate() + desplazamiento * 7);
    return base;
  }, [desplazamiento]);

  const dias = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(inicioSemana);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [inicioSemana]
  );

  // Reservas vigentes agrupadas por día de la semana visible
  const reservasPorDia = useMemo(() => {
    const mapa = new Map<number, Reserva[]>();
    for (const r of reservas) {
      if (r.estado === "CANCELADA") continue;
      const fecha = new Date(r.fecha);
      const indice = dias.findIndex((d) => mismaFecha(d, fecha));
      if (indice === -1) continue;
      const lista = mapa.get(indice) ?? [];
      lista.push(r);
      mapa.set(indice, lista);
    }
    return mapa;
  }, [reservas, dias]);

  const horas = Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i);
  const hoy = new Date();

  const rotulo = `${inicioSemana.getDate()} ${inicioSemana.toLocaleDateString("es-ES", {
    month: "short",
  })} – ${dias[6].getDate()} ${dias[6].toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`;

  const totalSemana = Array.from(reservasPorDia.values()).reduce((a, l) => a + l.length, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Navegación */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900">Agenda semanal</h3>
          <p className="text-xs text-gray-500">
            {rotulo} · {totalSemana} clase{totalSemana !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDesplazamiento((d) => d - 1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Semana anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setDesplazamiento(0)}
            className="px-2 py-1 text-xs rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Hoy
          </button>
          <button
            onClick={() => setDesplazamiento((d) => d + 1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Semana siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Leyenda: la identidad no depende solo del color */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200" /> Disponible
        </span>
        {Object.entries({ PENDIENTE: "Pendiente", CONFIRMADA: "Confirmada", COMPLETADA: "Completada" }).map(
          ([clave, etiqueta]) => (
            <span key={clave} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLOR_ESTADO[clave] }}
              />
              {etiqueta}
            </span>
          )
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Cabecera de días */}
          <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-1 mb-1">
            <span />
            {dias.map((d, i) => {
              const esHoy = mismaFecha(d, hoy);
              return (
                <div key={i} className="text-center">
                  <p className={`text-xs font-medium ${esHoy ? "text-blue-600" : "text-gray-600"}`}>
                    {DIAS_SEMANA[i].slice(0, 3)}
                  </p>
                  <p className={`text-[11px] ${esHoy ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Rejilla */}
          <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-1">
            {/* Columna de horas */}
            <div className="relative h-[420px]">
              {horas.map((h) => (
                <span
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] text-gray-400 tabular-nums"
                  style={{ top: `${((h - HORA_INICIO) * 60 / MIN_TOTAL) * 100}%` }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>

            {/* Columnas de días */}
            {dias.map((dia, indice) => {
              const diaSemana = indice; // 0=Lunes … 6=Domingo
              const bloques = disponibilidades.filter((d) => d.diaSemana === diaSemana);
              const clases = reservasPorDia.get(indice) ?? [];
              return (
                <div
                  key={indice}
                  className="relative h-[420px] rounded-lg bg-gray-50 border border-gray-100 overflow-hidden"
                >
                  {/* Líneas de hora */}
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-gray-100"
                      style={{ top: `${((h - HORA_INICIO) * 60 / MIN_TOTAL) * 100}%` }}
                      aria-hidden="true"
                    />
                  ))}

                  {/* Disponibilidad como fondo */}
                  {bloques.map((b) => {
                    const { top, alto } = posicion(b.horaInicio, b.horaFin);
                    return (
                      <div
                        key={b.id}
                        className="absolute inset-x-0.5 rounded bg-gray-200/70"
                        style={{ top: `${top}%`, height: `${alto}%` }}
                        title={`Disponible ${b.horaInicio}-${b.horaFin}`}
                      />
                    );
                  })}

                  {/* Reservas encima */}
                  {clases.map((r) => {
                    const { top, alto } = posicion(r.horaInicio, r.horaFin);
                    return (
                      <div
                        key={r.id}
                        className="absolute inset-x-0.5 rounded px-1 py-0.5 text-white overflow-hidden shadow-sm"
                        style={{
                          top: `${top}%`,
                          height: `${alto}%`,
                          backgroundColor: COLOR_ESTADO[r.estado] ?? "#6b7280",
                        }}
                        title={`${r.horaInicio}-${r.horaFin} · ${r.servicio.materia} · ${r.estudiante.nombre} (${r.estado.toLowerCase()})`}
                      >
                        <p className="text-[10px] font-semibold leading-tight truncate">
                          {r.horaInicio} {r.servicio.materia}
                        </p>
                        <p className="text-[10px] leading-tight truncate opacity-90">
                          {r.estudiante.nombre}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {disponibilidades.length === 0 && (
        <p className="text-sm text-gray-500 mt-3">
          Todavía no has definido horarios. Ve a la pestaña &quot;Disponibilidad&quot; para que los
          estudiantes puedan reservarte.
        </p>
      )}
    </div>
  );
}
