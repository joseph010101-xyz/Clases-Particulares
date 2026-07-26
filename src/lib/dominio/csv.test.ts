import { describe, it, expect } from "vitest";
import { escaparCampoCSV, generarCSV } from "./csv";

describe("escaparCampoCSV", () => {
  it("deja pasar los valores simples", () => {
    expect(escaparCampoCSV("Matemáticas")).toBe("Matemáticas");
    expect(escaparCampoCSV(25)).toBe("25");
  });

  it("convierte nulos y indefinidos en cadena vacía", () => {
    expect(escaparCampoCSV(null)).toBe("");
    expect(escaparCampoCSV(undefined)).toBe("");
  });

  it("entrecomilla cuando hay separador o salto de línea", () => {
    expect(escaparCampoCSV("García, María")).toBe('"García, María"');
    expect(escaparCampoCSV("linea1\nlinea2")).toBe('"linea1\nlinea2"');
    expect(escaparCampoCSV("a;b")).toBe('"a;b"');
  });

  it("duplica las comillas internas", () => {
    expect(escaparCampoCSV('Dijo "hola"')).toBe('"Dijo ""hola"""');
  });
});

describe("generarCSV", () => {
  it("genera cabeceras y filas separadas por CRLF", () => {
    const csv = generarCSV(["Nombre", "Precio"], [["Ana", 20], ["Luis", 30]]);
    const lineas = csv.replace(/^﻿/, "").split("\r\n");
    expect(lineas).toEqual(["Nombre,Precio", "Ana,20", "Luis,30"]);
  });

  it("incluye el BOM de UTF-8 para que Excel respete los acentos", () => {
    expect(generarCSV(["Materia"], [["Cálculo"]]).startsWith("﻿")).toBe(true);
  });

  it("escapa los valores conflictivos dentro de las filas", () => {
    const csv = generarCSV(["Nombre"], [['Pérez, "Juan"']]);
    expect(csv).toContain('"Pérez, ""Juan"""');
  });
});
