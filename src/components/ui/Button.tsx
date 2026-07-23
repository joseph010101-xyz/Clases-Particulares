// =============================================
// ClasesYa - Componente: Button reutilizable
// =============================================

"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primary" | "secondary" | "danger" | "ghost";
  tamano?: "sm" | "md" | "lg";
  cargando?: boolean;
}

const estilosVariante = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
};

const estilosTamano = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  children,
  variante = "primary",
  tamano = "md",
  cargando = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-colors duration-200 focus:outline-none focus:ring-2
        focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
        disabled:cursor-not-allowed
        ${estilosVariante[variante]}
        ${estilosTamano[tamano]}
        ${className}
      `}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
