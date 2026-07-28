// =============================================
// ClasesYa - Dominio: moneda
// La plataforma opera en Bolivia, así que los precios se expresan en
// bolivianos. Centralizar el formato evita que el símbolo se repita (y se
// desincronice) por toda la interfaz.
// =============================================

export const SIMBOLO_MONEDA = "Bs";
export const CODIGO_MONEDA = "BOB";
export const LOCALE_MONEDA = "es-BO";

/**
 * Formatea un importe en bolivianos. Los decimales solo se muestran cuando el
 * precio los tiene, para que "Bs 60" no se lea como "Bs 60,00" sin necesidad.
 */
export function formatearPrecio(valor: number | string | null | undefined): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return `${SIMBOLO_MONEDA} 0`;

  const tieneDecimales = Math.round(n * 100) % 100 !== 0;
  const texto = new Intl.NumberFormat(LOCALE_MONEDA, {
    minimumFractionDigits: tieneDecimales ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);

  return `${SIMBOLO_MONEDA} ${texto}`;
}

/** Precio por hora, con el sufijo de unidad. Ej.: "Bs 60/h". */
export function formatearPrecioHora(valor: number | string | null | undefined, sufijo = "/h"): string {
  return `${formatearPrecio(valor)}${sufijo}`;
}
