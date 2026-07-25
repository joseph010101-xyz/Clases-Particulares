// =============================================
// ClasesYa - Proveedor de tema
// Guarda la preferencia en localStorage y la aplica como data-tema en <html>.
// =============================================

"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ClaveTema = "sereno" | "vibrante" | "clasico" | "noche";

export interface DefinicionTema {
  clave: ClaveTema;
  nombre: string;
  descripcion: string;
  // Colores de muestra para la vista previa del selector
  muestras: [string, string, string];
}

export const TEMAS: DefinicionTema[] = [
  {
    clave: "sereno",
    nombre: "Sereno",
    descripcion: "Claro y equilibrado",
    muestras: ["#ffffff", "#2563eb", "#4f46e5"],
  },
  {
    clave: "vibrante",
    nombre: "Vibrante",
    descripcion: "Enérgico y juvenil",
    muestras: ["#faf7ff", "#7c3aed", "#d946ef"],
  },
  {
    clave: "clasico",
    nombre: "Clásico",
    descripcion: "Sobrio y profesional",
    muestras: ["#faf9f7", "#1e40af", "#57503f"],
  },
  {
    clave: "noche",
    nombre: "Noche",
    descripcion: "Oscuro, descansa la vista",
    muestras: ["#161b26", "#2563eb", "#60a5fa"],
  },
];

export const TEMA_POR_DEFECTO: ClaveTema = "sereno";
const CLAVE_ALMACENAMIENTO = "clasesya-tema";

interface ContextoTema {
  tema: ClaveTema;
  cambiarTema: (tema: ClaveTema) => void;
}

const TemaContext = createContext<ContextoTema | null>(null);

export function useTema(): ContextoTema {
  const ctx = useContext(TemaContext);
  return ctx ?? { tema: TEMA_POR_DEFECTO, cambiarTema: () => {} };
}

// Script que aplica el tema antes de pintar para evitar el parpadeo inicial.
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CLAVE_ALMACENAMIENTO}');if(t){document.documentElement.setAttribute('data-tema',t);}}catch(e){}})();`;

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<ClaveTema>(TEMA_POR_DEFECTO);

  // Sincronizar con lo que el script inicial ya aplicó
  useEffect(() => {
    const actual = document.documentElement.getAttribute("data-tema") as ClaveTema | null;
    if (actual && TEMAS.some((t) => t.clave === actual)) setTema(actual);
  }, []);

  const cambiarTema = useCallback((nuevo: ClaveTema) => {
    setTema(nuevo);
    const html = document.documentElement;
    // Animar la transición de colores solo durante el cambio
    html.classList.add("cambiando-tema");
    html.setAttribute("data-tema", nuevo);
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, nuevo);
    } catch {
      // Sin almacenamiento disponible: el tema durará lo que la sesión.
    }
    window.setTimeout(() => html.classList.remove("cambiando-tema"), 350);
  }, []);

  return <TemaContext.Provider value={{ tema, cambiarTema }}>{children}</TemaContext.Provider>;
}
