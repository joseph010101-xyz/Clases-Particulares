import { describe, it, expect } from "vitest";
import { formatearPrecio, formatearPrecioHora, SIMBOLO_MONEDA } from "./moneda";

describe("formatearPrecio", () => {
  it("usa el símbolo del boliviano", () => {
    expect(SIMBOLO_MONEDA).toBe("Bs");
    expect(formatearPrecio(60)).toContain("Bs");
  });

  it("omite los decimales cuando el precio es entero", () => {
    expect(formatearPrecio(60)).toBe("Bs 60");
    expect(formatearPrecio("80")).toBe("Bs 80");
  });

  it("muestra dos decimales cuando los hay", () => {
    expect(formatearPrecio(60.5)).toBe("Bs 60,50");
    expect(formatearPrecio(19.99)).toBe("Bs 19,99");
  });

  it("separa los miles", () => {
    expect(formatearPrecio(1200)).toBe("Bs 1.200");
  });

  it("tolera valores inválidos sin romper la interfaz", () => {
    expect(formatearPrecio(null)).toBe("Bs 0");
    expect(formatearPrecio(undefined)).toBe("Bs 0");
    expect(formatearPrecio("no es un número")).toBe("Bs 0");
  });
});

describe("formatearPrecioHora", () => {
  it("añade el sufijo de unidad", () => {
    expect(formatearPrecioHora(60)).toBe("Bs 60/h");
  });

  it("permite personalizar el sufijo", () => {
    expect(formatearPrecioHora(60, "/hora")).toBe("Bs 60/hora");
  });
});
