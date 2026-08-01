// =============================================
// ClasesYa - Componente: lo que te queda por hacer
// El mismo panel para el estudiante y para el profesor: la API ya devuelve lo
// que le toca a cada uno. Es lo primero que se ve al entrar al panel, para no
// tener que recordar en qué cursos estabas.
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Cargando from "@/components/ui/Cargando";
import { etiquetaUrgencia, type Pendiente, type Urgencia } from "@/lib/dominio";

const COLOR_URGENCIA: Record<Urgencia, string> = {
  vencida: "bg-red-50 text-red-700",
  hoy: "bg-amber-50 text-amber-700",
  pronto: "bg-blue-50 text-blue-700",
  normal: "bg-gray-100 text-gray-500",
};

const ICONO: Record<Pendiente["tipo"], string> = {
  TAREA: "📝",
  PAGO: "💳",
  CALIFICAR: "✅",
  REVISAR_PAGO: "🧾",
  CONFIRMAR_RESERVA: "📅",
};

function fechaCorta(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-BO", { day: "numeric", month: "short" });
}

export default function PanelPendientes({ recargar = 0 }: { recargar?: number }) {
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [urgentes, setUrgentes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/pendientes", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setPendientes(d.pendientes ?? []);
      setUrgentes(d.urgentes ?? 0);
    }
  }, []);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar, recargar]);

  if (cargando) return <Cargando texto="Revisando lo que tienes pendiente…" />;

  // Sin nada pendiente el panel no debe ocupar espacio ni generar ansiedad
  if (pendientes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-6 flex items-center gap-3">
        <span className="text-xl">🎉</span>
        <p className="text-sm text-gray-600">
          No tienes nada pendiente. Todo al día.
        </p>
      </div>
    );
  }

  const visibles = expandido ? pendientes : pendientes.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h2 className="font-semibold text-gray-900">Te queda por hacer</h2>
        {urgentes > 0 && (
          <span className="text-xs font-medium bg-red-50 text-red-700 rounded-full px-2 py-0.5">
            {urgentes} urgente{urgentes !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <ul className="divide-y divide-gray-100">
        {visibles.map((p, i) => (
          <li key={`${p.tipo}-${p.enlace}-${i}`}>
            <Link
              href={p.enlace}
              className="flex items-center gap-3 py-3 group -mx-2 px-2 rounded-lg hover:bg-gray-50"
            >
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                {ICONO[p.tipo]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                  {p.titulo}
                </p>
                <p className="text-xs text-gray-500 truncate">{p.contexto}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                {p.urgencia !== "normal" && (
                  <span
                    className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${COLOR_URGENCIA[p.urgencia]}`}
                  >
                    {etiquetaUrgencia(p.urgencia)}
                  </span>
                )}
                {p.fecha && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{fechaCorta(p.fecha)}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {pendientes.length > 5 && (
        <button
          onClick={() => setExpandido((v) => !v)}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {expandido ? "Ver menos" : `Ver las ${pendientes.length - 5} restantes`}
        </button>
      )}
    </div>
  );
}
