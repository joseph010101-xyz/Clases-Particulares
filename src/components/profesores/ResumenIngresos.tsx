// =============================================
// ClasesYa - Componente: lo que ha cobrado el profesor
// No es un saldo: el dinero nunca pasa por la plataforma. Es el registro de lo
// que él mismo dio por recibido, que hasta ahora no podía consultar en ningún
// sitio pese a tener que confirmarlo pago a pago.
// =============================================

"use client";

import { useEffect, useState } from "react";
import Cargando from "@/components/ui/Cargando";
import { formatearPrecio, ETIQUETA_METODO_PAGO, type MetodoPago } from "@/lib/dominio";

interface Ingresos {
  total: number;
  totalCobros: number;
  esteMes: number;
  cobrosEsteMes: number;
  porConfirmar: number;
  cobrosPorConfirmar: number;
  ultimos: {
    id: string;
    monto: number;
    metodoPago: MetodoPago;
    fecha: string | null;
    estudiante: string;
    concepto: string;
    origen: "CURSO" | "CLASE";
  }[];
}

export default function ResumenIngresos() {
  const [datos, setDatos] = useState<Ingresos | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/perfil/ingresos", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setDatos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando texto="Calculando tus cobros…" />;
  if (!datos) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 className="font-semibold text-gray-900 mb-4">Lo que has cobrado</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500">Este mes</p>
          <p className="text-2xl font-bold text-gray-900">{formatearPrecio(datos.esteMes)}</p>
          <p className="text-xs text-gray-400">
            {datos.cobrosEsteMes} cobro{datos.cobrosEsteMes !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total confirmado</p>
          <p className="text-2xl font-bold text-gray-900">{formatearPrecio(datos.total)}</p>
          <p className="text-xs text-gray-400">
            {datos.totalCobros} cobro{datos.totalCobros !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Esperando que lo confirmes</p>
          <p
            className={`text-2xl font-bold ${
              datos.cobrosPorConfirmar > 0 ? "text-amber-600" : "text-gray-400"
            }`}
          >
            {formatearPrecio(datos.porConfirmar)}
          </p>
          <p className="text-xs text-gray-400">
            {datos.cobrosPorConfirmar} comprobante{datos.cobrosPorConfirmar !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {datos.ultimos.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Últimos cobros</p>
          <ul className="divide-y divide-gray-100">
            {datos.ultimos.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{p.concepto}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {p.estudiante} · {p.origen === "CURSO" ? "Curso" : "Clase"} ·{" "}
                    {ETIQUETA_METODO_PAGO[p.metodoPago]}
                    {p.fecha ? ` · ${new Date(p.fecha).toLocaleDateString("es-BO")}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                  {formatearPrecio(p.monto)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        ClasesYa no retiene ni transfiere dinero. Esto es lo que has confirmado haber recibido en
        tus propias cuentas.
      </p>
    </div>
  );
}
