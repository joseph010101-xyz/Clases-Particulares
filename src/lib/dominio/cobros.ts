// =============================================
// ClasesYa - Dominio: métodos de cobro del profesor
// La plataforma no procesa dinero: muestra al estudiante cómo pagarle al
// profesor y registra el comprobante. Estas reglas deciden si un profesor
// tiene forma de cobrar.
// =============================================

export interface DatosCobroBasicos {
  qrUrl?: string | null;
  banco?: string | null;
  titular?: string | null;
  numeroCuenta?: string | null;
  tigoMoney?: string | null;
}

export type CanalCobro = "QR" | "TRANSFERENCIA" | "TIGO_MONEY";

function limpio(v: string | null | undefined): string {
  return (v ?? "").trim();
}

/** Canales que el profesor tiene realmente utilizables. */
export function canalesDisponibles(datos: DatosCobroBasicos | null | undefined): CanalCobro[] {
  if (!datos) return [];
  const canales: CanalCobro[] = [];

  if (limpio(datos.qrUrl)) canales.push("QR");
  // Una transferencia solo sirve si se sabe a qué banco y a qué cuenta
  if (limpio(datos.banco) && limpio(datos.numeroCuenta)) canales.push("TRANSFERENCIA");
  if (limpio(datos.tigoMoney)) canales.push("TIGO_MONEY");

  return canales;
}

/**
 * ¿El profesor puede cobrar? Basta con un canal utilizable. Se usa para
 * impedir que publique un curso de pago sin forma de recibir el dinero.
 */
export function tieneMetodoDeCobro(datos: DatosCobroBasicos | null | undefined): boolean {
  return canalesDisponibles(datos).length > 0;
}

/** Nombre legible de cada canal, para la interfaz. */
export const ETIQUETA_CANAL: Record<CanalCobro, string> = {
  QR: "Pago con QR",
  TRANSFERENCIA: "Transferencia bancaria",
  TIGO_MONEY: "Tigo Money",
};
