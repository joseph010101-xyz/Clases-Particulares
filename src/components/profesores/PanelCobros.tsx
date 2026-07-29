// =============================================
// ClasesYa - Panel del profesor: cómo quiere cobrar
// La plataforma no procesa pagos: muestra estos datos al estudiante para que
// pague directamente y luego registre su comprobante.
// =============================================

"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Cargando from "@/components/ui/Cargando";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { ETIQUETA_CANAL, type CanalCobro } from "@/lib/dominio";

interface DatosCobro {
  qrUrl: string | null;
  banco: string | null;
  titular: string | null;
  numeroCuenta: string | null;
  tigoMoney: string | null;
  instrucciones: string | null;
}

const VACIO: DatosCobro = {
  qrUrl: null,
  banco: "",
  titular: "",
  numeroCuenta: "",
  tigoMoney: "",
  instrucciones: "",
};

export default function PanelCobros() {
  const confirmar = useConfirm();
  const entradaQr = useRef<HTMLInputElement>(null);

  const [datos, setDatos] = useState<DatosCobro>(VACIO);
  const [canales, setCanales] = useState<CanalCobro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoQr, setSubiendoQr] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/perfil/cobro", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setCanales(d.canales ?? []);
      if (d.datos) {
        setDatos({
          qrUrl: d.datos.qrUrl,
          banco: d.datos.banco ?? "",
          titular: d.datos.titular ?? "",
          numeroCuenta: d.datos.numeroCuenta ?? "",
          tigoMoney: d.datos.tigoMoney ?? "",
          instrucciones: d.datos.instrucciones ?? "",
        });
      }
    }
  }, []);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch("/api/perfil/cobro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banco: datos.banco,
          titular: datos.titular,
          numeroCuenta: datos.numeroCuenta,
          tigoMoney: datos.tigoMoney,
          instrucciones: datos.instrucciones,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudieron guardar los datos");
        return;
      }
      toast.success("Datos de cobro guardados");
      setCanales(d.canales ?? []);
    } finally {
      setGuardando(false);
    }
  };

  const subirQr = async (archivo: File) => {
    setSubiendoQr(true);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const res = await fetch("/api/perfil/cobro/qr", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo subir el QR");
        return;
      }
      toast.success("QR actualizado");
      setDatos((p) => ({ ...p, qrUrl: d.qrUrl }));
      await cargar();
    } finally {
      setSubiendoQr(false);
      if (entradaQr.current) entradaQr.current.value = "";
    }
  };

  const quitarQr = async () => {
    const ok = await confirmar({
      titulo: "Quitar QR",
      mensaje: "¿Seguro que quieres quitar tu código QR de cobro?",
      textoConfirmar: "Quitar",
      peligro: true,
    });
    if (!ok) return;
    const res = await fetch("/api/perfil/cobro/qr", { method: "DELETE" });
    if (res.ok) {
      toast.success("QR eliminado");
      setDatos((p) => ({ ...p, qrUrl: null }));
      await cargar();
    } else {
      toast.error("No se pudo quitar el QR");
    }
  };

  if (cargando) return <Cargando texto="Cargando datos de cobro…" />;

  const puedeCobrar = canales.length > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Estado general */}
      <div
        className={`rounded-xl px-4 py-3 text-sm border ${
          puedeCobrar
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}
      >
        {puedeCobrar ? (
          <>
            <strong>Puedes cobrar por tus cursos.</strong> Canales activos:{" "}
            {canales.map((c) => ETIQUETA_CANAL[c]).join(", ")}.
          </>
        ) : (
          <>
            <strong>Todavía no puedes publicar cursos de pago.</strong> Configura al menos un canal
            de cobro: sube tu QR, indica banco y número de cuenta, o tu número de Tigo Money.
          </>
        )}
      </div>

      {/* QR */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900">Código QR</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Sube la captura del QR de tu banca móvil. Es la forma más rápida de que te paguen.
        </p>
        <div className="flex items-start gap-4 flex-wrap">
          {datos.qrUrl ? (
            <img
              src={datos.qrUrl}
              alt="Código QR de cobro"
              className="w-40 h-40 object-contain rounded-lg border border-gray-200 bg-white"
            />
          ) : (
            <div className="w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm text-center px-3">
              Sin QR configurado
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={entradaQr}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) subirQr(f);
              }}
            />
            <Button
              type="button"
              variante="secondary"
              tamano="sm"
              cargando={subiendoQr}
              onClick={() => entradaQr.current?.click()}
            >
              {datos.qrUrl ? "Cambiar QR" : "Subir QR"}
            </Button>
            {datos.qrUrl && (
              <Button type="button" variante="ghost" tamano="sm" onClick={quitarQr}>
                Quitar
              </Button>
            )}
            <p className="text-xs text-gray-400 max-w-[12rem]">JPG, PNG o WEBP, hasta 5 MB.</p>
          </div>
        </div>
      </div>

      {/* Cuenta bancaria y billetera */}
      <form onSubmit={guardar} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">Transferencia bancaria</h3>
          <p className="text-sm text-gray-500 mt-1">
            Para que sirva, hacen falta al menos el banco y el número de cuenta.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Banco</label>
            <input
              value={datos.banco ?? ""}
              onChange={(e) => setDatos({ ...datos, banco: e.target.value })}
              placeholder="Ej: Banco Unión, BNB, BCP"
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Número de cuenta</label>
            <input
              value={datos.numeroCuenta ?? ""}
              onChange={(e) => setDatos({ ...datos, numeroCuenta: e.target.value })}
              placeholder="Ej: 10000123456"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Titular de la cuenta</label>
            <input
              value={datos.titular ?? ""}
              onChange={(e) => setDatos({ ...datos, titular: e.target.value })}
              placeholder="Nombre completo"
              maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tigo Money</label>
            <input
              value={datos.tigoMoney ?? ""}
              onChange={(e) => setDatos({ ...datos, tigoMoney: e.target.value })}
              placeholder="Ej: 71234567"
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Indicaciones para el estudiante (opcional)</label>
          <textarea
            value={datos.instrucciones ?? ""}
            onChange={(e) => setDatos({ ...datos, instrucciones: e.target.value })}
            rows={3}
            maxLength={1000}
            placeholder="Ej: Pon tu nombre completo en el detalle de la transferencia y envíame la captura."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <Button type="submit" cargando={guardando}>Guardar datos de cobro</Button>
      </form>

      <p className="text-xs text-gray-500">
        ClasesYa no retiene ni procesa el dinero: el estudiante te paga directamente por el canal que
        elijas y tú confirmas la inscripción cuando verifiques el pago en tu cuenta.
      </p>
    </div>
  );
}
