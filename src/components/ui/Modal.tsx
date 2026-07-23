// =============================================
// ClasesYa - Componente: Modal reutilizable
// =============================================

"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: ReactNode;
}

export default function Modal({ abierto, onCerrar, titulo, children }: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    if (abierto) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [abierto, onCerrar]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCerrar}
      />
      {/* Contenido del modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {titulo && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
            <button
              onClick={onCerrar}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
