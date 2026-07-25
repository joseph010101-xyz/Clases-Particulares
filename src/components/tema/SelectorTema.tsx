// =============================================
// ClasesYa - Selector de tema (paleta en el encabezado)
// =============================================

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TEMAS, useTema, type ClaveTema } from "@/components/tema/TemaProvider";

export default function SelectorTema({ compacto = false }: { compacto?: boolean }) {
  const { tema, cambiarTema } = useTema();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alClicFuera = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    if (abierto) document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  const elegir = (clave: ClaveTema) => {
    cambiarTema(clave);
    setAbierto(false);
  };

  // En móvil se muestra como lista simple, sin desplegable
  if (compacto) {
    return (
      <div className="flex flex-wrap gap-2">
        {TEMAS.map((t) => (
          <button
            key={t.clave}
            onClick={() => cambiarTema(t.clave)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              tema === t.clave
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Muestras colores={t.muestras} />
            {t.nombre}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={contenedor}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors p-1"
        aria-label="Cambiar tema"
        title="Personalizar apariencia"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828L11 19.172M7 17h.01"
          />
        </svg>
        <span className="hidden lg:inline text-sm">Tema</span>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50"
          >
            <p className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Apariencia
            </p>
            {TEMAS.map((t) => {
              const activo = tema === t.clave;
              return (
                <button
                  key={t.clave}
                  onClick={() => elegir(t.clave)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                    activo ? "bg-blue-50" : "hover:bg-gray-100"
                  }`}
                >
                  <Muestras colores={t.muestras} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm ${activo ? "font-semibold text-blue-700" : "text-gray-800"}`}>
                      {t.nombre}
                    </span>
                    <span className="block text-xs text-gray-500 truncate">{t.descripcion}</span>
                  </span>
                  {activo && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tres círculos con los colores representativos del tema
function Muestras({ colores }: { colores: [string, string, string] }) {
  return (
    <span className="flex -space-x-1.5 flex-shrink-0">
      {colores.map((c, i) => (
        <span
          key={i}
          className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}
