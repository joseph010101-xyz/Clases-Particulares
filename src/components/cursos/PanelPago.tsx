// =============================================
// ClasesYa - Panel de pago de un curso (vista del estudiante)
// Muestra cómo pagarle al profesor y recoge el comprobante. El dinero va
// directo al profesor: la plataforma solo deja constancia.
// =============================================

"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Cargando from "@/components/ui/Cargando";
import BadgeVerificado from "@/components/ui/BadgeVerificado";
import {
  formatearPrecio,
  ETIQUETA_METODO_PAGO,
  type CanalCobro,
  type MetodoPago,
} from "@/lib/dominio";

interface DatosPago {
  curso: { titulo: string; precio: number | string; gratuito: boolean };
  profesor: { nombre: string; verificado: boolean };
  inscripcion: { id: string; estado: string };
  pago: {
    metodoPago: string;
    referencia: string | null;
    comprobanteUrl: string | null;
    estado: string;
    motivoRechazo: string | null;
    createdAt: string;
  } | null;
  datosCobro: {
    qrUrl: string | null;
    banco: string | null;
    titular: string | null;
    numeroCuenta: string | null;
    tigoMoney: string | null;
    instrucciones: string | null;
  } | null;
  canales: CanalCobro[];
}

// Canal configurado por el profesor → método que declara el estudiante
const METODO_DE_CANAL: Record<CanalCobro, MetodoPago> = {
  QR: "QR",
  TRANSFERENCIA: "TRANSFERENCIA",
  TIGO_MONEY: "TIGO_MONEY",
};

export default function PanelPago({
  cursoId,
  onPagoEnviado,
}: {
  cursoId: string;
  onPagoEnviado: () => void;
}) {
  const [datos, setDatos] = useState<DatosPago | null>(null);
  const [cargando, setCargando] = useState(true);
  const [metodo, setMetodo] = useState<string>("");
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/cursos/${cursoId}/pago`, { cache: "no-store" });
    if (res.ok) {
      const d: DatosPago = await res.json();
      setDatos(d);
      if (!metodo && d.canales.length > 0) setMetodo(METODO_DE_CANAL[d.canales[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo && !referencia.trim()) {
      toast.error("Adjunta el comprobante o indica el número de transacción");
      return;
    }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append("metodoPago", metodo);
      if (referencia.trim()) fd.append("referencia", referencia.trim());
      if (archivo) fd.append("comprobante", archivo);
      const res = await fetch(`/api/cursos/${cursoId}/pago`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo enviar el comprobante");
        return;
      }
      toast.success("Comprobante enviado. El profesor lo revisará.");
      setArchivo(null);
      if (entrada.current) entrada.current.value = "";
      await cargar();
      onPagoEnviado();
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <Cargando texto="Cargando datos de pago…" />;
  if (!datos) return null;

  const { curso, profesor, inscripcion, pago, datosCobro, canales } = datos;
  const rechazado = inscripcion.estado === "RECHAZADA";
  const esperandoRevision = pago && pago.estado === "PENDIENTE" && !rechazado;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h2 className="font-semibold text-gray-900">Completa tu pago</h2>
        <span className="text-lg font-bold text-blue-600">{formatearPrecio(curso.precio)}</span>
      </div>

      {/* Confianza: el estudiante decide sabiendo con quién trata */}
      {profesor.verificado ? (
        <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-4">
          Pagarás directamente a <strong>{profesor.nombre}</strong>
          <BadgeVerificado />
        </p>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm mb-4">
          <strong>Este profesor todavía no está verificado por ClasesYa.</strong> El pago es directo
          a su cuenta y la plataforma no lo retiene ni lo reembolsa. Revisa sus reseñas antes de
          pagar y conserva tu comprobante.
        </div>
      )}

      {/* Estado del envío anterior */}
      {esperandoRevision && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm mb-4">
          Ya enviaste tu comprobante el {new Date(pago.createdAt).toLocaleDateString("es-BO")}. El
          profesor lo revisará y activará tu acceso. Puedes volver a enviarlo si te equivocaste.
        </div>
      )}
      {rechazado && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          <strong>El profesor rechazó tu comprobante.</strong>
          {pago?.motivoRechazo ? ` Motivo: ${pago.motivoRechazo}` : ""} Puedes corregirlo y volver a
          enviarlo.
        </div>
      )}

      {/* Cómo pagar */}
      {canales.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          El profesor todavía no ha publicado sus datos de cobro. Escríbele por mensajería antes de
          pagar.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {datosCobro?.qrUrl && (
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500 mb-2">Escanea el QR</p>
                <img
                  src={datosCobro.qrUrl}
                  alt="Código QR para pagar"
                  className="w-44 h-44 object-contain mx-auto rounded-lg border border-gray-200 bg-white"
                />
              </div>
            )}
            <div className="space-y-2 text-sm">
              {datosCobro?.banco && datosCobro?.numeroCuenta && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Transferencia bancaria</p>
                  <p className="text-gray-800">{datosCobro.banco}</p>
                  <p className="text-gray-800 font-mono">{datosCobro.numeroCuenta}</p>
                  {datosCobro.titular && <p className="text-gray-500">{datosCobro.titular}</p>}
                </div>
              )}
              {datosCobro?.tigoMoney && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Tigo Money</p>
                  <p className="text-gray-800 font-mono">{datosCobro.tigoMoney}</p>
                </div>
              )}
              {datosCobro?.instrucciones && (
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                  {datosCobro.instrucciones}
                </p>
              )}
            </div>
          </div>

          {/* Envío del comprobante */}
          <form onSubmit={enviar} className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700">Envía tu comprobante</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">¿Cómo pagaste?</label>
                <Select
                  valor={metodo}
                  onChange={setMetodo}
                  ariaLabel="Método de pago"
                  opciones={canales.map((c) => ({
                    valor: METODO_DE_CANAL[c],
                    etiqueta: ETIQUETA_METODO_PAGO[METODO_DE_CANAL[c]],
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nº de transacción (opcional)</label>
                <input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej: 000123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Captura del comprobante</label>
              <input
                ref={entrada}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {pago?.comprobanteUrl && !archivo && (
                <a
                  href={pago.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs text-blue-600 hover:underline"
                >
                  Ver el comprobante que ya enviaste
                </a>
              )}
            </div>
            <Button type="submit" cargando={enviando}>
              {pago ? "Reenviar comprobante" : "Enviar comprobante"}
            </Button>
          </form>
        </>
      )}

      <p className="text-xs text-gray-400 mt-4">
        ClasesYa no retiene ni procesa el dinero: registra tu comprobante para que el profesor
        confirme el pago y active tu acceso.
      </p>
    </div>
  );
}
