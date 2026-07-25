// =============================================
// ClasesYa - Piezas de visualización del panel de administración
// Paleta categórica de roles validada para superficie clara y oscura.
// Las cifras y etiquetas usan tokens de texto, nunca el color de la serie.
// =============================================

"use client";

import { useState } from "react";

// ---- Tarjeta de indicador (cifra destacada) ----
export function TarjetaMetrica({
  etiqueta,
  valor,
  detalle,
  acento,
}: {
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  acento?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2">
        {acento && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: acento }}
            aria-hidden="true"
          />
        )}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{etiqueta}</p>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-gray-500">{detalle}</p>}
    </div>
  );
}

// ---- Gráfica de barras de una sola serie ----
// Una sola serie: sin leyenda (el título la nombra). Valor exacto al pasar el
// cursor; sin números sobre cada barra.
export function GraficaBarras({
  titulo,
  datos,
}: {
  titulo: string;
  datos: { fecha: string; total: number }[];
}) {
  const [activa, setActiva] = useState<number | null>(null);
  const maximo = Math.max(1, ...datos.map((d) => d.total));
  const total = datos.reduce((a, d) => a + d.total, 0);

  const diaDe = (iso: string) => Number(iso.slice(8, 10));
  const fechaLegible = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
        <span className="text-xs text-gray-500">{total} en total</span>
      </div>

      <div className="relative">
        {/* Rejilla discreta */}
        <div className="absolute inset-x-0 top-0 border-t border-gray-100" aria-hidden="true" />
        <div className="absolute inset-x-0 top-1/2 border-t border-gray-100" aria-hidden="true" />

        <div className="relative flex items-end gap-[2px] h-32">
          {datos.map((d, i) => {
            const altura = d.total === 0 ? 0 : Math.max(4, (d.total / maximo) * 100);
            return (
              <div
                key={d.fecha}
                className="relative flex-1 h-full flex items-end"
                onMouseEnter={() => setActiva(i)}
                onMouseLeave={() => setActiva(null)}
              >
                {/* Zona de interacción más amplia que la marca */}
                <div className="absolute inset-0" aria-hidden="true" />
                <div
                  className="w-full rounded-t-[4px] bg-blue-500 transition-opacity"
                  style={{ height: `${altura}%`, opacity: activa === null || activa === i ? 1 : 0.45 }}
                  title={`${fechaLegible(d.fecha)}: ${d.total}`}
                />
                {activa === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[11px] text-gray-50 shadow-lg">
                    {fechaLegible(d.fecha)}: <strong>{d.total}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-gray-200 mt-0" aria-hidden="true" />
      </div>

      {/* Eje: se etiqueta uno de cada dos días para evitar colisiones */}
      <div className="flex gap-[2px] mt-1">
        {datos.map((d, i) => (
          <span key={d.fecha} className="flex-1 text-center text-[10px] text-gray-400 tabular-nums">
            {i % 2 === 0 ? diaDe(d.fecha) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Desglose con etiquetas directas ----
// La identidad nunca depende solo del color: cada fila lleva su etiqueta.
export function Desglose({
  titulo,
  filas,
}: {
  titulo: string;
  filas: { etiqueta: string; valor: number; color: string }[];
}) {
  const total = filas.reduce((a, f) => a + f.valor, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{titulo}</h3>
      {total === 0 ? (
        <p className="text-sm text-gray-500">Sin datos todavía.</p>
      ) : (
        <ul className="space-y-2.5">
          {filas.map((f) => {
            const pct = Math.round((f.valor / total) * 100);
            return (
              <li key={f.etiqueta}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: f.color }}
                      aria-hidden="true"
                    />
                    <span className="text-gray-700 truncate">{f.etiqueta}</span>
                  </span>
                  <span className="text-gray-900 font-medium tabular-nums flex-shrink-0">
                    {f.valor}
                    <span className="text-gray-400 font-normal ml-1">({pct}%)</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: f.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
