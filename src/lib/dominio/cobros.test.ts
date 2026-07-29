import { describe, it, expect } from "vitest";
import { canalesDisponibles, tieneMetodoDeCobro } from "./cobros";

describe("canalesDisponibles", () => {
  it("no encuentra canales sin datos", () => {
    expect(canalesDisponibles(null)).toEqual([]);
    expect(canalesDisponibles(undefined)).toEqual([]);
    expect(canalesDisponibles({})).toEqual([]);
  });

  it("detecta el QR", () => {
    expect(canalesDisponibles({ qrUrl: "https://res.cloudinary.com/x/qr.png" })).toEqual(["QR"]);
  });

  it("exige banco y número de cuenta para la transferencia", () => {
    expect(canalesDisponibles({ banco: "BNB" })).toEqual([]);
    expect(canalesDisponibles({ numeroCuenta: "1234567" })).toEqual([]);
    expect(canalesDisponibles({ banco: "BNB", numeroCuenta: "1234567" })).toEqual(["TRANSFERENCIA"]);
  });

  it("detecta Tigo Money", () => {
    expect(canalesDisponibles({ tigoMoney: "71234567" })).toEqual(["TIGO_MONEY"]);
  });

  it("ignora los valores en blanco", () => {
    expect(canalesDisponibles({ qrUrl: "   ", tigoMoney: "" })).toEqual([]);
  });

  it("devuelve todos los canales configurados", () => {
    const canales = canalesDisponibles({
      qrUrl: "https://res.cloudinary.com/x/qr.png",
      banco: "Banco Unión",
      numeroCuenta: "10000123456",
      tigoMoney: "71234567",
    });
    expect(canales).toEqual(["QR", "TRANSFERENCIA", "TIGO_MONEY"]);
  });
});

describe("tieneMetodoDeCobro", () => {
  it("es falso sin ningún canal utilizable", () => {
    expect(tieneMetodoDeCobro(null)).toBe(false);
    expect(tieneMetodoDeCobro({ banco: "BNB" })).toBe(false);
    expect(tieneMetodoDeCobro({ titular: "María García" })).toBe(false);
  });

  it("basta con un canal para poder cobrar", () => {
    expect(tieneMetodoDeCobro({ tigoMoney: "71234567" })).toBe(true);
    expect(tieneMetodoDeCobro({ qrUrl: "https://res.cloudinary.com/x/qr.png" })).toBe(true);
  });
});
