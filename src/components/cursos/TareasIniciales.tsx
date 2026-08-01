// =============================================
// ClasesYa - Componente: temario inicial de un curso
// Permite dejar planteadas varias tareas mientras se crea el curso, en vez de
// crearlo y volver a entrar a añadirlas una a una. Es un campo controlado:
// no habla con la API, solo mantiene la lista que enviará el formulario.
// =============================================

"use client";

import Button from "@/components/ui/Button";
import SelectorFecha from "@/components/ui/SelectorFecha";
import SelectorHora from "@/components/ui/SelectorHora";
import { MAX_TAREAS_POR_CURSO } from "@/lib/dominio";

export interface TareaInicial {
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
}

export const tareaVacia = (): TareaInicial => ({
  titulo: "",
  descripcion: "",
  fecha: "",
  hora: "23:59",
});

/** Pasa la lista del formulario al formato que espera la API. */
export function aTareasDeApi(tareas: TareaInicial[]) {
  return tareas
    .filter((t) => t.titulo.trim() && t.descripcion.trim())
    .map((t) => ({
      titulo: t.titulo.trim(),
      descripcion: t.descripcion.trim(),
      fechaLimite: t.fecha ? `${t.fecha}T${t.hora || "23:59"}` : null,
    }));
}

export default function TareasIniciales({
  tareas,
  onCambiar,
}: {
  tareas: TareaInicial[];
  onCambiar: (tareas: TareaInicial[]) => void;
}) {
  const actualizar = (i: number, campo: keyof TareaInicial, valor: string) => {
    onCambiar(tareas.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)));
  };

  const anadir = () => onCambiar([...tareas, tareaVacia()]);
  const quitar = (i: number) => onCambiar(tareas.filter((_, j) => j !== i));

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Tareas del curso (opcional)
        </label>
        <span className="text-xs text-gray-400">
          {tareas.length}/{MAX_TAREAS_POR_CURSO}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Deja planteado el temario ahora si lo tienes claro. Podrás añadir, editar o
        borrar tareas en cualquier momento desde el curso.
      </p>

      {tareas.length > 0 && (
        <ul className="space-y-3 mb-3">
          {tareas.map((t, i) => (
            <li key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 flex-shrink-0">{i + 1}.</span>
                <input
                  value={t.titulo}
                  onChange={(e) => actualizar(i, "titulo", e.target.value)}
                  placeholder="Título de la tarea"
                  maxLength={150}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  aria-label={`Quitar la tarea ${i + 1}`}
                  className="flex-shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={t.descripcion}
                onChange={(e) => actualizar(i, "descripcion", e.target.value)}
                rows={2}
                placeholder="Instrucciones para el estudiante"
                maxLength={3000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SelectorFecha
                  valor={t.fecha}
                  onChange={(v) => actualizar(i, "fecha", v)}
                  placeholder="Sin fecha límite"
                />
                <SelectorHora
                  valor={t.hora}
                  onChange={(v) => actualizar(i, "hora", v)}
                  paso={30}
                  horaMax="23:30"
                  disabled={!t.fecha}
                  placeholder={t.fecha ? "Hora límite" : "Elige la fecha"}
                />
              </div>
              {(!t.titulo.trim() || !t.descripcion.trim()) && (
                <p className="text-xs text-amber-600">
                  Sin título e instrucciones, esta tarea no se creará.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {tareas.length < MAX_TAREAS_POR_CURSO && (
        <Button type="button" variante="secondary" tamano="sm" onClick={anadir}>
          + Añadir tarea
        </Button>
      )}
    </div>
  );
}
