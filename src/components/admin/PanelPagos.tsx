// =============================================
// ClasesYa - Panel de pagos y arbitraje (ADMIN)
// La plataforma no mueve dinero, así que aquí no se cobra ni se reembolsa:
// se mira la evidencia para resolver cuando el estudiante dice que pagó y el
// profesor dice que no lo recibió. Toda resolución queda auditada.
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Cargando from "@/components/ui/Cargando";
import Modal from "@/components/ui/Modal";
import {
  formatearPrecio,
  ETIQUETA_METODO_PAGO,
  ETIQUETA_ESTADO_PAGO,
  type MetodoPago,
  type EstadoPago,
} from "@/lib/dominio";
import { tiempoRelativo } from "@/lib/auditoriaUI";

interface PagoAdmin {
  id: string;
  origen: "CURSO" | "CLASE";
  concepto: string;
  monto: number | string;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  referencia: string | null;
  comprobanteUrl: string | null;
  motivoRechazo: string | null;
  revisadoEn: string | null;
  createdAt: string;
  estudiante: { id: string; nombre: string; email: string } | null;
  profesor: { id: string; nombre: string } | null;
}

const COLOR_ESTADO: Record<EstadoPago, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700",
  COMPLETADO: "bg-green-50 text-green-700",
  FALLIDO: "bg-red-50 text-red-700",
  REEMBOLSADO: "bg-gray-100 text-gray-600",
};

const FILTROS: { valor: string; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todos" },
  { valor: "FALLIDO", etiqueta: "Rechazados" },
  { valor: "PENDIENTE", etiqueta: "Por revisar" },
  { valor: "COMPLETADO", etiqueta: "Confirmados" },
  { valor: "REEMBOLSADO", etiqueta: "Reembolsados" },
];

export default function PanelPagos() {
  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  const [resumen, setResumen] = useState<Record<string, number>>({});
  const [filtro, setFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enDisputa, setEnDisputa] = useState<PagoAdmin | null>(null);
  const [resolucion, setResolucion] = useState<EstadoPago>("COMPLETADO");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/admin/pagos?porPagina=50${filtro ? `&estado=${filtro}` : ""}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const d = await res.json();
      setPagos(d.pagos ?? []);
      setResumen(d.resumen ?? {});
    }
  }, [filtro]);

  useEffect(() => {
    setCargando(true);
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  const arbitrar = async () => {
    if (!enDisputa) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/admin/pagos/${enDisputa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: resolucion, motivo }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo arbitrar el pago");
        return;
      }
      toast.success("Resolución registrada");
      setEnDisputa(null);
      setMotivo("");
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.valor || "todos"}
            onClick={() => setFiltro(f.valor)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filtro === f.valor ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.etiqueta}
            {f.valor && resumen[f.valor] ? ` (${resumen[f.valor]})` : ""}
          </button>
        ))}
      </div>

      {cargando ? (
        <Cargando texto="Cargando pagos…" />
      ) : pagos.length === 0 ? (
        <p className="text-sm text-gray-500">No hay pagos que mostrar.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Concepto</th>
                <th className="text-left px-4 py-2 font-medium">Estudiante</th>
                <th className="text-left px-4 py-2 font-medium">Profesor</th>
                <th className="text-right px-4 py-2 font-medium">Importe</th>
                <th className="text-left px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{p.concepto}</p>
                    <p className="text-xs text-gray-500">
                      {p.origen === "CURSO" ? "Curso" : "Clase particular"} ·{" "}
                      {ETIQUETA_METODO_PAGO[p.metodoPago]} · {tiempoRelativo(p.createdAt)}
                      {p.referencia ? ` · Nº ${p.referencia}` : ""}
                    </p>
                    {p.motivoRechazo && (
                      <p className="text-xs text-red-600 mt-0.5">{p.motivoRechazo}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.estudiante?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{p.profesor?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatearPrecio(p.monto)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${COLOR_ESTADO[p.estado]}`}
                    >
                      {ETIQUETA_ESTADO_PAGO[p.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.comprobanteUrl && (
                      <a
                        href={p.comprobanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs mr-3"
                      >
                        Comprobante
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setEnDisputa(p);
                        setResolucion(p.estado === "COMPLETADO" ? "FALLIDO" : "COMPLETADO");
                        setMotivo("");
                      }}
                      className="text-xs font-medium text-purple-700 hover:underline"
                    >
                      Arbitrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        ClasesYa no retiene el dinero: el arbitraje corrige el registro y el acceso del estudiante,
        pero la devolución del importe la acuerdan las partes por su cuenta.
      </p>

      <Modal abierto={enDisputa !== null} onCerrar={() => setEnDisputa(null)} titulo="Arbitrar el pago">
        {enDisputa && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>
                <strong>{enDisputa.concepto}</strong> · {formatearPrecio(enDisputa.monto)}
              </p>
              <p className="text-xs mt-1">
                {enDisputa.estudiante?.nombre} → {enDisputa.profesor?.nombre} · ahora en{" "}
                {ETIQUETA_ESTADO_PAGO[enDisputa.estado].toLowerCase()}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(["COMPLETADO", "FALLIDO", "REEMBOLSADO"] as EstadoPago[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolucion(r)}
                  disabled={r === enDisputa.estado}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 ${
                    resolucion === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ETIQUETA_ESTADO_PAGO[r]}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Motivo de la resolución (queda en la auditoría y lo ven ambas partes)
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ej: el estudiante aportó el extracto bancario con el depósito"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <Button cargando={enviando} disabled={motivo.trim().length < 5} onClick={arbitrar}>
                Resolver
              </Button>
              <Button variante="secondary" onClick={() => setEnDisputa(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
