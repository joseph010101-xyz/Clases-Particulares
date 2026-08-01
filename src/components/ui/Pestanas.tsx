// =============================================
// ClasesYa - Componente: Pestañas
// En móvil la fila se desplaza en horizontal en vez de romperse en dos líneas,
// que es lo que hace ilegible una barra de pestañas en pantallas estrechas.
// =============================================

"use client";

export interface Pestana<T extends string> {
  clave: T;
  etiqueta: string;
  /** Número que acompaña a la etiqueta (materiales, tareas…). */
  contador?: number;
  /** Punto de aviso para lo que requiere acción, como pagos por revisar. */
  destacado?: boolean;
}

export default function Pestanas<T extends string>({
  pestanas,
  activa,
  onCambiar,
  ariaLabel = "Secciones",
}: {
  pestanas: Pestana<T>[];
  activa: T;
  onCambiar: (clave: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-1 overflow-x-auto border-b border-gray-200 mt-6 -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      {pestanas.map((p) => {
        const seleccionada = p.clave === activa;
        return (
          <button
            key={p.clave}
            role="tab"
            aria-selected={seleccionada}
            onClick={() => onCambiar(p.clave)}
            className={`whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              seleccionada
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {p.etiqueta}
            {typeof p.contador === "number" && (
              <span className={`ml-1.5 ${seleccionada ? "text-blue-500" : "text-gray-400"}`}>
                {p.contador}
              </span>
            )}
            {p.destacado && (
              <span
                aria-label="requiere tu atención"
                className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1.5 align-middle"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
