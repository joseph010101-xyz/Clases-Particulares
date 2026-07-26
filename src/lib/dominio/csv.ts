// =============================================
// ClasesYa - Dominio: generación de CSV
// Lógica pura para exportar tablas sin depender de librerías externas.
// =============================================

/**
 * Escapa un valor para CSV: entrecomilla cuando contiene separador, comillas o
 * saltos de línea, y duplica las comillas internas.
 */
export function escaparCampoCSV(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",\n\r;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Construye un CSV a partir de las cabeceras y las filas.
 * Antepone el BOM de UTF-8 para que Excel muestre bien los acentos.
 */
export function generarCSV(cabeceras: string[], filas: unknown[][]): string {
  const lineas = [
    cabeceras.map(escaparCampoCSV).join(","),
    ...filas.map((fila) => fila.map(escaparCampoCSV).join(",")),
  ];
  return "﻿" + lineas.join("\r\n");
}
