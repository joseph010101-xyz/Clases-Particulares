// =============================================
// ClasesYa - Revisión de inscripciones y pagos (vista del profesor)
// El profesor es quien ve el dinero en su cuenta, así que es quien confirma.
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Cargando from "@/components/ui/Cargando";
import Avatar from "@/components/ui/Avatar";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import {
  formatearPrecio,
  ETIQUETA_METODO_PAGO,
  ETIQUETA_ESTADO_INSCRIPCION,
  type MetodoPago,
  type EstadoInscripcion,
} from "@/lib/dominio";

interface InscripcionRevisable {
  id: string;
  estado: EstadoInscripcion;
  createdAt: string;
  estudiante: { id: string; nombre: string; email: string; foto: string | null };
  pago: {
    monto: number | string;
    metodoPago: MetodoPago;
    estado: string;
    referencia: string | null;
    comprobanteUrl: string | null;
    motivoRechazo: string | null;
    createdAt: string;
  } | null;
}

const COLOR_ESTADO: Record<EstadoInscripcion, string> = {
  PENDIENTE_PAGO: "bg-amber-50 text-amber-700",
  ACTIVA: "bg-green-50 text-green-700",
  RECHAZADA: "bg-red-50 text-red-700",
};

export default function RevisionPagos({ cursoId }: { cursoId: string }) {
  const confirmar = useConfirm();
  const [lista, setLista] = useState<InscripcionRevisable[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/cursos/${cursoId}/inscripciones`, { cache: "no-store" });
    if (res.ok) setLista((await res.json()).inscripciones ?? []);
  }, [cursoId]);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  const decidir = async (ins: InscripcionRevisable, decision: "APROBAR" | "RECHAZAR") => {
    let motivo: string | undefined;

    if (decision === "RECHAZAR") {
      const ok = await confirmar({
        titulo: "Rechazar el pago",
        mensaje: `¿Rechazar el comprobante de ${ins.estudiante.nombre}? Podrá corregirlo y volver a enviarlo.`,
        textoConfirmar: "Rechazar",
        peligro: true,
      });
      if (!ok) return;
      motivo = "No se pudo verificar el pago en la cuenta";
    } else {
      const ok = await confirmar({
        titulo: "Confirmar el pago",
        mensaje: `¿Confirmas que recibiste ${formatearPrecio(ins.pago?.monto ?? 0)} de ${ins.estudiante.nombre}? Se le dará acceso al curso.`,
        textoConfirmar: "Sí, recibí el pago",
      });
      if (!ok) return;
    }

    setProcesando(ins.id);
    try {
      const res = await fetch(`/api/inscripciones/${ins.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, motivo }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo registrar la decisión");
        return;
      }
      toast.success(decision === "APROBAR" ? "Inscripción activada" : "Pago rechazado");
      await cargar();
    } finally {
      setProcesando(null);
    }
  };

  if (cargando) return <Cargando texto="Cargando inscripciones…" />;

  const pendientes = lista.filter((i) => i.estado === "PENDIENTE_PAGO");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-semibold text-gray-900">Inscripciones ({lista.length})</h2>
        {pendientes.length > 0 && (
          <span className="text-xs font-medium bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
            {pendientes.length} por revisar
          </span>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay estudiantes inscritos.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {lista.map((ins) => (
            <li key={ins.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <Avatar nombre={ins.estudiante.nombre} foto={ins.estudiante.foto} tamano={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{ins.estudiante.nombre}</span>
                  <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${COLOR_ESTADO[ins.estado]}`}>
                    {ETIQUETA_ESTADO_INSCRIPCION[ins.estado]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{ins.estudiante.email}</p>
                {ins.pago && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatearPrecio(ins.pago.monto)} ·{" "}
                    {ETIQUETA_METODO_PAGO[ins.pago.metodoPago] ?? ins.pago.metodoPago}
                    {ins.pago.referencia ? ` · Nº ${ins.pago.referencia}` : ""}
                    {ins.pago.comprobanteUrl && (
                      <>
                        {" · "}
                        <a
                          href={ins.pago.comprobanteUrl}
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
                {ins.estado === "PENDIENTE_PAGO" && !ins.pago && (
                  <p className="text-xs text-amber-600 mt-1">Aún no ha enviado su comprobante.</p>
                )}
              </div>

              {ins.estado === "PENDIENTE_PAGO" && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    tamano="sm"
                    cargando={procesando === ins.id}
                    disabled={!ins.pago}
                    onClick={() => decidir(ins, "APROBAR")}
                  >
                    Confirmar pago
                  </Button>
                  <Button
                    variante="danger"
                    tamano="sm"
                    disabled={!ins.pago || procesando === ins.id}
                    onClick={() => decidir(ins, "RECHAZAR")}
                  >
                    Rechazar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Verifica el pago en tu cuenta bancaria antes de confirmarlo: ClasesYa no puede comprobar que
        el dinero haya llegado.
      </p>
    </div>
  );
}
