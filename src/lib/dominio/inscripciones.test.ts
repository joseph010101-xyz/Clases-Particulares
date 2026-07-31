import { describe, it, expect } from "vitest";
import {
  estadoInicialInscripcion,
  inscripcionDaAcceso,
  puedeEnviarComprobante,
  puedeRevisarPago,
  estadoTrasDecision,
  inscripcionImpagaCaducada,
  PLAZO_PAGO_HORAS,
} from "./inscripciones";

describe("estadoInicialInscripcion", () => {
  it("un curso gratuito activa la inscripción al instante", () => {
    expect(estadoInicialInscripcion(0)).toBe("ACTIVA");
    expect(estadoInicialInscripcion(null)).toBe("ACTIVA");
  });

  it("un curso de pago queda esperando confirmación", () => {
    expect(estadoInicialInscripcion(250)).toBe("PENDIENTE_PAGO");
    expect(estadoInicialInscripcion("99.90")).toBe("PENDIENTE_PAGO");
  });
});

describe("inscripcionDaAcceso", () => {
  it("solo la inscripción activa abre el material", () => {
    expect(inscripcionDaAcceso("ACTIVA")).toBe(true);
    expect(inscripcionDaAcceso("PENDIENTE_PAGO")).toBe(false);
    expect(inscripcionDaAcceso("RECHAZADA")).toBe(false);
    expect(inscripcionDaAcceso(null)).toBe(false);
  });
});

describe("puedeEnviarComprobante", () => {
  it("permite enviarlo mientras el pago no esté confirmado", () => {
    expect(puedeEnviarComprobante("PENDIENTE_PAGO")).toBe(true);
  });

  it("permite reenviarlo tras un rechazo", () => {
    expect(puedeEnviarComprobante("RECHAZADA")).toBe(true);
  });

  it("no tiene sentido con la inscripción ya activa", () => {
    expect(puedeEnviarComprobante("ACTIVA")).toBe(false);
  });
});

describe("puedeRevisarPago", () => {
  it("solo se revisa lo que está pendiente", () => {
    expect(puedeRevisarPago("PENDIENTE_PAGO").permitido).toBe(true);
  });

  it("rechaza revisar una inscripción ya resuelta", () => {
    const activa = puedeRevisarPago("ACTIVA");
    expect(activa.permitido).toBe(false);
    if (!activa.permitido) expect(activa.mensaje).toContain("ya está activa");

    const rechazada = puedeRevisarPago("RECHAZADA");
    expect(rechazada.permitido).toBe(false);
    if (!rechazada.permitido) expect(rechazada.mensaje).toContain("ya fue rechazada");
  });
});

describe("estadoTrasDecision", () => {
  it("aprobar activa y rechazar deja constancia", () => {
    expect(estadoTrasDecision("APROBAR")).toBe("ACTIVA");
    expect(estadoTrasDecision("RECHAZAR")).toBe("RECHAZADA");
  });
});

describe("inscripcionImpagaCaducada", () => {
  const ahora = new Date("2026-03-10T12:00:00");
  const hace = (horas: number) => new Date(ahora.getTime() - horas * 60 * 60 * 1000);

  it("caduca la que nunca envió comprobante pasado el plazo", () => {
    expect(inscripcionImpagaCaducada("PENDIENTE_PAGO", hace(PLAZO_PAGO_HORAS + 1), false, ahora)).toBe(true);
  });

  it("respeta a quien todavía está dentro del plazo", () => {
    expect(inscripcionImpagaCaducada("PENDIENTE_PAGO", hace(PLAZO_PAGO_HORAS - 1), false, ahora)).toBe(false);
  });

  it("no castiga al estudiante por la demora del profesor en revisar", () => {
    expect(inscripcionImpagaCaducada("PENDIENTE_PAGO", hace(PLAZO_PAGO_HORAS + 100), true, ahora)).toBe(false);
  });

  it("no toca las inscripciones activas ni las rechazadas", () => {
    expect(inscripcionImpagaCaducada("ACTIVA", hace(500), false, ahora)).toBe(false);
    expect(inscripcionImpagaCaducada("RECHAZADA", hace(500), false, ahora)).toBe(false);
  });
});
