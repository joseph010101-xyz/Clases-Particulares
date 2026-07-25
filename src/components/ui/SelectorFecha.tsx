// =============================================
// ClasesYa - Componente: Selector de fecha (calendario)
// Sustituye al input[type=date] nativo. Permite deshabilitar días sin
// disponibilidad para que el usuario solo pueda elegir fechas válidas.
// =============================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsDayADiaSemana } from "@/lib/dominio/horarios";

const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const CABECERA_DIAS = ["L", "M", "X", "J", "V", "S", "D"];

// "YYYY-MM-DD" → Date local (evita el desfase de zona horaria de Date.parse)
function aFecha(iso: string): Date | null {
  if (!iso) return null;
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d);
}

function aISO(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

interface SelectorFechaProps {
  valor: string;
  onChange: (iso: string) => void;
  /** Fecha mínima seleccionable, formato "YYYY-MM-DD" */
  min?: string;
  /** Días de la semana permitidos (0=Lunes … 6=Domingo). Si se omite, todos. */
  diasHabilitados?: number[];
  placeholder?: string;
  className?: string;
}

export default function SelectorFecha({
  valor,
  onChange,
  min,
  diasHabilitados,
  placeholder = "Elige una fecha",
  className = "",
}: SelectorFechaProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const seleccionada = useMemo(() => aFecha(valor), [valor]);
  const fechaMinima = useMemo(() => aFecha(min ?? ""), [min]);

  // Mes visible en el calendario
  const [mesVisible, setMesVisible] = useState<Date>(() => {
    const base = aFecha(valor) ?? aFecha(min ?? "") ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    const alClicFuera = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    if (abierto) {
      document.addEventListener("mousedown", alClicFuera);
      document.addEventListener("keydown", alEscape);
    }
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierto]);

  // Al abrir, situarse en el mes de la fecha elegida
  useEffect(() => {
    if (abierto && seleccionada) {
      setMesVisible(new Date(seleccionada.getFullYear(), seleccionada.getMonth(), 1));
    }
  }, [abierto, seleccionada]);

  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();

  // Celdas del mes: huecos iniciales (semana empieza en lunes) + días
  const celdas = useMemo(() => {
    const primero = new Date(anio, mes, 1);
    const huecos = jsDayADiaSemana(primero.getDay());
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    const lista: (Date | null)[] = Array.from({ length: huecos }, () => null);
    for (let d = 1; d <= totalDias; d++) lista.push(new Date(anio, mes, d));
    return lista;
  }, [anio, mes]);

  const estaDeshabilitado = (dia: Date): boolean => {
    if (fechaMinima && dia < fechaMinima) return true;
    if (diasHabilitados && diasHabilitados.length > 0) {
      return !diasHabilitados.includes(jsDayADiaSemana(dia.getDay()));
    }
    return false;
  };

  const elegir = (dia: Date) => {
    if (estaDeshabilitado(dia)) return;
    onChange(aISO(dia));
    setAbierto(false);
  };

  const textoBoton = seleccionada
    ? seleccionada.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder;

  const hoy = new Date();

  return (
    <div className={`relative ${className}`} ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors bg-superficie ${
          abierto ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className={`truncate ${seleccionada ? "text-gray-900" : "text-gray-400"}`}>
          {textoBoton}
        </span>
        <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 z-50 mt-2 w-[19rem] max-w-[92vw] bg-superficie border border-gray-200 rounded-xl shadow-xl p-3"
          >
            {/* Navegación de mes */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setMesVisible(new Date(anio, mes - 1, 1))}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Mes anterior"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-900 capitalize">
                {NOMBRES_MES[mes]} {anio}
              </span>
              <button
                type="button"
                onClick={() => setMesVisible(new Date(anio, mes + 1, 1))}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Mes siguiente"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Cabecera de días */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {CABECERA_DIAS.map((d, i) => (
                <span key={i} className="text-[11px] font-medium text-gray-400 text-center py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* Rejilla de días */}
            <div className="grid grid-cols-7 gap-1">
              {celdas.map((dia, i) => {
                if (!dia) return <span key={`v-${i}`} />;
                const deshabilitado = estaDeshabilitado(dia);
                const elegido = seleccionada ? mismoDia(dia, seleccionada) : false;
                const esHoy = mismoDia(dia, hoy);
                return (
                  <button
                    key={dia.toISOString()}
                    type="button"
                    disabled={deshabilitado}
                    onClick={() => elegir(dia)}
                    className={`h-9 rounded-lg text-sm transition-colors ${
                      elegido
                        ? "bg-primario text-white font-semibold"
                        : deshabilitado
                        ? "text-gray-300 cursor-not-allowed"
                        : esHoy
                        ? "text-blue-700 font-semibold ring-1 ring-blue-300 hover:bg-blue-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {dia.getDate()}
                  </button>
                );
              })}
            </div>

            {diasHabilitados && diasHabilitados.length > 0 && (
              <p className="mt-2 text-[11px] text-gray-500">
                Solo se muestran activos los días con disponibilidad del profesor.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
