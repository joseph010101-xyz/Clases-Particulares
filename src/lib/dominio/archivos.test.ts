import { describe, it, expect } from "vitest";
import {
  extensionDe,
  esArchivoPermitido,
  formatearTamano,
  MAX_BYTES_ARCHIVO,
} from "./archivos";

describe("extensionDe", () => {
  it("extrae la extensión en minúsculas", () => {
    expect(extensionDe("apuntes.PDF")).toBe("pdf");
    expect(extensionDe("tarea final.docx")).toBe("docx");
  });

  it("usa la última extensión en nombres compuestos", () => {
    expect(extensionDe("respaldo.tar.gz")).toBe("gz");
  });

  it("devuelve vacío cuando no hay extensión utilizable", () => {
    expect(extensionDe("archivo")).toBe("");
    expect(extensionDe(".oculto")).toBe("");
    expect(extensionDe("termina.")).toBe("");
  });
});

describe("esArchivoPermitido", () => {
  it("acepta los formatos habituales de clase", () => {
    expect(esArchivoPermitido("tema1.pdf")).toBe(true);
    expect(esArchivoPermitido("notas.xlsx")).toBe(true);
    expect(esArchivoPermitido("clase.mp4")).toBe(true);
    expect(esArchivoPermitido("diagrama.png")).toBe(true);
  });

  it("rechaza ejecutables y scripts", () => {
    expect(esArchivoPermitido("virus.exe")).toBe(false);
    expect(esArchivoPermitido("script.bat")).toBe(false);
    expect(esArchivoPermitido("payload.sh")).toBe(false);
    expect(esArchivoPermitido("app.msi")).toBe(false);
  });

  it("rechaza archivos sin extensión", () => {
    expect(esArchivoPermitido("sinextension")).toBe(false);
  });

  it("no se deja engañar por mayúsculas", () => {
    expect(esArchivoPermitido("MALO.EXE")).toBe(false);
    expect(esArchivoPermitido("BUENO.PDF")).toBe(true);
  });
});

describe("formatearTamano", () => {
  it("usa la unidad adecuada", () => {
    expect(formatearTamano(512)).toBe("512 B");
    expect(formatearTamano(2048)).toBe("2 KB");
    expect(formatearTamano(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("devuelve vacío para valores ausentes o inválidos", () => {
    expect(formatearTamano(null)).toBe("");
    expect(formatearTamano(0)).toBe("");
  });
});

describe("MAX_BYTES_ARCHIVO", () => {
  it("son 15 MB", () => {
    expect(MAX_BYTES_ARCHIVO).toBe(15 * 1024 * 1024);
  });
});
