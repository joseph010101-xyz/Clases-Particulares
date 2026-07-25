// =============================================
// ClasesYa - Panel de administración: historial de auditoría
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Cargando from "@/components/ui/Cargando";
import {
  DESCRIPCION_ACCION,
  COLOR_ACCION,
  tiempoRelativo,
  type AccionAuditoriaUI,
} from "@/lib/auditoriaUI";

interface Registro {
  id: string;
  actorNombre: string;
  accion: AccionAuditoriaUI;
  objetivoNombre: string | null;
  detalle: string | null;
  createdAt: string;
}

export default function PanelAuditoria() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async (p: number) => {
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/auditoria?pagina=${p}&porPagina=20`, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setRegistros(d.registros ?? []);
        setTotalPaginas(d.paginacion?.totalPaginas || 1);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(pagina);
  }, [cargar, pagina]);

  if (cargando) return <Cargando texto="Cargando historial…" />;

  if (registros.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-500">Todavía no hay acciones registradas.</p>
        <p className="text-sm text-gray-400 mt-1">
          Aquí quedará constancia de cada verificación, cambio de rol o baja de cuenta.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {registros.map((r) => (
          <div key={r.id} className="flex items-start gap-3 p-4">
            <span
              className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: COLOR_ACCION[r.accion] ?? "#6b7280" }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800">
                <span className="font-medium text-gray-900">{r.actorNombre}</span>{" "}
                {(DESCRIPCION_ACCION[r.accion] ?? r.accion).toLowerCase()}
                {r.objetivoNombre && (
                  <>
                    {": "}
                    <span className="font-medium text-gray-900">{r.objetivoNombre}</span>
                  </>
                )}
              </p>
              {r.detalle && <p className="text-xs text-gray-500 mt-0.5">{r.detalle}</p>}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0" title={new Date(r.createdAt).toLocaleString("es-ES")}>
              {tiempoRelativo(r.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            variante="ghost"
            tamano="sm"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            {pagina} de {totalPaginas}
          </span>
          <Button
            variante="ghost"
            tamano="sm"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
