// =============================================
// ClasesYa - Componente: Selector de hora
// Sustituye al input[type=time] nativo por una rejilla de horas. Puede recibir
// una lista cerrada de horas válidas (p. ej. las que caben en la
// disponibilidad del profesor).
// =============================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SelectorHoraProps {
  valor: string;
  onChange: (hora: string) => void;
  /** Lista cerrada de horas "HH:mm". Si se omite, se genera con `paso`. */
  opciones?: string[];
  /** Minutos entre opciones generadas (por defecto 30) */
  paso?: number;
  horaMin?: string;
  horaMax?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function generarHoras(paso: number, horaMin: string, horaMax: string): string[] {
  const aMin = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  };
  const inicio = aMin(horaMin);
  const fin = aMin(horaMax);
  const lista: string[] = [];
  for (let m = inicio; m <= fin; m += paso) {
    lista.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return lista;
}

export default function SelectorHora({
  valor,
  onChange,
  opciones,
  paso = 30,
  horaMin = "06:00",
  horaMax = "22:00",
  placeholder = "Elige una hora",
  disabled = false,
  className = "",
}: SelectorHoraProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const horas = useMemo(
    () => (opciones && opciones.length > 0 ? opciones : generarHoras(paso, horaMin, horaMax)),
    [opciones, paso, horaMin, horaMax]
  );

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

  const elegir = (h: string) => {
    onChange(h);
    setAbierto(false);
  };

  const sinOpciones = horas.length === 0;

  return (
    <div className={`relative ${className}`} ref={contenedor}>
      <button
        type="button"
        disabled={disabled || sinOpciones}
        onClick={() => setAbierto((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors ${
          disabled || sinOpciones
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : abierto
            ? "bg-superficie border-blue-500 ring-2 ring-blue-500/30"
            : "bg-superficie border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className={valor ? "text-gray-900" : "text-gray-400"}>
          {valor || (sinOpciones ? "Sin horas disponibles" : placeholder)}
        </span>
        <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {abierto && !sinOpciones && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-2 max-h-56 overflow-y-auto bg-superficie border border-gray-200 rounded-xl shadow-xl p-2"
          >
            <div className="grid grid-cols-3 gap-1.5">
              {horas.map((h) => {
                const activa = h === valor;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => elegir(h)}
                    className={`py-1.5 rounded-lg text-sm transition-colors ${
                      activa
                        ? "bg-primario text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
