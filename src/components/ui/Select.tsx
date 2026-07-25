// =============================================
// ClasesYa - Componente: Select personalizado
// Sustituye al <select> nativo con un desplegable animado que sigue el tema.
// =============================================

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface OpcionSelect {
  valor: string;
  etiqueta: string;
  descripcion?: string;
}

interface SelectProps {
  valor: string;
  opciones: OpcionSelect[];
  onChange: (valor: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function Select({
  valor,
  opciones,
  onChange,
  placeholder = "Selecciona…",
  disabled = false,
  className = "",
  ariaLabel,
}: SelectProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const seleccionada = opciones.find((o) => o.valor === valor);

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

  const elegir = (v: string) => {
    onChange(v);
    setAbierto(false);
  };

  return (
    <div className={`relative ${className}`} ref={contenedor}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
          disabled
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : abierto
            ? "bg-superficie border-blue-500 ring-2 ring-blue-500/30"
            : "bg-superficie border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className={`truncate ${seleccionada ? "text-gray-900" : "text-gray-400"}`}>
          {seleccionada?.etiqueta ?? placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${abierto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-superficie border border-gray-200 rounded-lg shadow-xl z-50 py-1"
          >
            {opciones.map((o) => {
              const activa = o.valor === valor;
              return (
                <li key={o.valor} role="option" aria-selected={activa}>
                  <button
                    type="button"
                    onClick={() => elegir(o.valor)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      activa ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="block truncate">{o.etiqueta}</span>
                    {o.descripcion && (
                      <span className="block text-xs text-gray-500 truncate">{o.descripcion}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
