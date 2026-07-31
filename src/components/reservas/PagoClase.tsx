// =============================================
// ClasesYa - Componente: pago de una clase particular
// Un mismo modal para los dos lados: el estudiante ve cómo pagar y registra su
// comprobante; el profesor comprueba el dinero en su cuenta y decide.
// =============================================

"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Cargando from "@/components/ui/Cargando";
import BadgeVerificado from "@/components/ui/BadgeVerificado";
import {
  formatearPrecio,
  ETIQUETA_METODO_PAGO,
  ETIQUETA_ESTADO_PAGO,
  type CanalCobro,
  type MetodoPago,
  type EstadoPago,
} from "@/lib/dominio";

interface DatosPagoClase {
  reserva: { id: string; estado: string; materia: string; requierePago: boolean };
  profesor: { nombre: string; verificado: boolean };
  monto: number;
  pago: {
    monto: number | string;
    metodoPago: MetodoPago;
    estado: EstadoPago;
    referencia: string | null;
    comprobanteUrl: string | null;
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
  puedePagar: boolean;
}

const METODO_DE_CANAL: Record<CanalCobro, MetodoPago> = {
  QR: "QR",
  TRANSFERENCIA: "TRANSFERENCIA",
  TIGO_MONEY: "TIGO_MONEY",
};

export default function PagoClase({
  reservaId,
  rol,
  abierto,
  onCerrar,
  onCambio,
}: {
  reservaId: string;
  rol: "PROFESOR" | "ESTUDIANTE";
  abierto: boolean;
  onCerrar: () => void;
  onCambio: () => void;
}) {
  const [datos, setDatos] = useState<DatosPagoClase | null>(null);
  const [cargando, setCargando] = useState(true);
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/reservas/${reservaId}/pago`, { cache: "no-store" });
    if (res.ok) setDatos(await res.json());
  }, [reservaId]);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    cargar().finally(() => setCargando(false));
  }, [abierto, cargar]);

  const registrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append("metodoPago", metodo);
      if (referencia.trim()) fd.append("referencia", referencia.trim());
      if (archivo) fd.append("comprobante", archivo);
      const res = await fetch(`/api/reservas/${reservaId}/pago`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo registrar el pago");
        return;
      }
      toast.success("Pago registrado. El profesor lo confirmará.");
      setArchivo(null);
      if (entrada.current) entrada.current.value = "";
      await cargar();
      onCambio();
    } finally {
      setEnviando(false);
    }
  };

  const decidir = async (decision: "APROBAR" | "RECHAZAR") => {
    setEnviando(true);
    try {
      const res = await fetch(`/api/reservas/${reservaId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, motivo: motivo.trim() || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo registrar la decisión");
        return;
      }
      toast.success(decision === "APROBAR" ? "Pago confirmado" : "Pago rechazado");
      await cargar();
      onCambio();
      onCerrar();
    } finally {
      setEnviando(false);
    }
  };

  const metodosDisponibles: MetodoPago[] = [
    // En una clase presencial el efectivo siempre es opción, aunque el profesor
    // no haya publicado ninguna cuenta.
    "EFECTIVO",
    ...(datos?.canales ?? []).map((c) => METODO_DE_CANAL[c]),
  ];

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Pago de la clase">
      {cargando || !datos ? (
        <Cargando texto="Cargando el pago…" />
      ) : !datos.reserva.requierePago ? (
        <p className="text-sm text-gray-600">Esta clase no tiene costo.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <span className="text-sm text-gray-600">{datos.reserva.materia}</span>
            <span className="text-lg font-bold text-blue-600">{formatearPrecio(datos.monto)}</span>
          </div>

          {datos.pago && (
            <p className="text-sm text-gray-600">
              {ETIQUETA_METODO_PAGO[datos.pago.metodoPago]} ·{" "}
              <strong>{ETIQUETA_ESTADO_PAGO[datos.pago.estado]}</strong>
              {datos.pago.referencia ? ` · Nº ${datos.pago.referencia}` : ""}
              {datos.pago.comprobanteUrl && (
                <>
                  {" · "}
                  <a
                    href={datos.pago.comprobanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver comprobante
                  </a>
                </>
              )}
            </p>
          )}
          {datos.pago?.motivoRechazo && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {datos.pago.motivoRechazo}
            </div>
          )}

          {/* ---- Vista del estudiante ---- */}
          {rol === "ESTUDIANTE" && datos.puedePagar && (
            <>
              {!datos.profesor.verificado && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
                  <strong>{datos.profesor.nombre} todavía no está verificado.</strong> El pago va
                  directo a su cuenta: ClasesYa no lo retiene ni lo reembolsa.
                </div>
              )}
              {datos.profesor.verificado && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  Pagarás directamente a <strong>{datos.profesor.nombre}</strong>
                  <BadgeVerificado />
                </p>
              )}

              {(datos.datosCobro?.qrUrl ||
                datos.datosCobro?.numeroCuenta ||
                datos.datosCobro?.tigoMoney) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  {datos.datosCobro?.qrUrl && (
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-500 mb-2">Escanea el QR</p>
                      <img
                        src={datos.datosCobro.qrUrl}
                        alt="Código QR para pagar"
                        className="w-40 h-40 object-contain mx-auto rounded-lg border border-gray-200 bg-white"
                      />
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    {datos.datosCobro?.banco && datos.datosCobro?.numeroCuenta && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Transferencia bancaria</p>
                        <p className="text-gray-800">{datos.datosCobro.banco}</p>
                        <p className="text-gray-800 font-mono">{datos.datosCobro.numeroCuenta}</p>
                        {datos.datosCobro.titular && (
                          <p className="text-gray-500">{datos.datosCobro.titular}</p>
                        )}
                      </div>
                    )}
                    {datos.datosCobro?.tigoMoney && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Tigo Money</p>
                        <p className="text-gray-800 font-mono">{datos.datosCobro.tigoMoney}</p>
                      </div>
                    )}
                    {datos.datosCobro?.instrucciones && (
                      <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                        {datos.datosCobro.instrucciones}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={registrarPago} className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">¿Cómo pagaste?</label>
                  <Select
                    valor={metodo}
                    onChange={(v) => setMetodo(v as MetodoPago)}
                    ariaLabel="Método de pago"
                    opciones={metodosDisponibles.map((m) => ({
                      valor: m,
                      etiqueta: ETIQUETA_METODO_PAGO[m],
                    }))}
                  />
                </div>

                {/* En efectivo no hay nada que adjuntar: basta la confirmación */}
                {metodo !== "EFECTIVO" && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Nº de transacción (opcional si adjuntas comprobante)
                      </label>
                      <input
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        placeholder="Ej: 000123456789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
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
                    </div>
                  </>
                )}
                {metodo === "EFECTIVO" && (
                  <p className="text-xs text-gray-500">
                    Registra el pago en efectivo que entregaste en mano. El profesor lo confirmará.
                  </p>
                )}

                <Button type="submit" cargando={enviando}>
                  {datos.pago ? "Volver a registrar el pago" : "Registrar mi pago"}
                </Button>
              </form>
            </>
          )}

          {rol === "ESTUDIANTE" && !datos.puedePagar && (
            <p className="text-sm text-gray-500">
              {datos.pago?.estado === "COMPLETADO"
                ? "El profesor ya confirmó este pago."
                : "Espera a que el profesor confirme el horario para poder pagar."}
            </p>
          )}

          {/* ---- Vista del profesor ---- */}
          {rol === "PROFESOR" && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {datos.pago?.estado === "PENDIENTE" ? (
                <>
                  <p className="text-sm text-gray-600">
                    Comprueba en tu cuenta que el dinero llegó antes de confirmar: ClasesYa no puede
                    verificarlo por ti.
                  </p>
                  <input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo, si vas a rechazarlo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <Button cargando={enviando} onClick={() => decidir("APROBAR")}>
                      Sí, recibí el pago
                    </Button>
                    <Button variante="danger" disabled={enviando} onClick={() => decidir("RECHAZAR")}>
                      Rechazar
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {datos.pago
                    ? "Este pago ya fue revisado."
                    : "El estudiante todavía no ha registrado su pago."}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
