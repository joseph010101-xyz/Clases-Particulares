import { describe, it, expect } from "vitest";
import {
  montoReserva,
  reservaRequierePago,
  puedePagarReserva,
  puedeRevisarPagoReserva,
  estadoPagoTrasDecision,
} from "./pagos";

describe("montoReserva", () => {
  it("cobra el precio por hora completo en una clase de una hora", () => {
    expect(montoReserva(80, "15:00", "16:00")).toBe(80);
  });

  it("prorratea las clases más largas y más cortas", () => {
    expect(montoReserva(80, "15:00", "16:30")).toBe(120);
    expect(montoReserva(80, "15:00", "15:30")).toBe(40);
    expect(montoReserva(80, "15:00", "15:45")).toBe(60);
  });

  it("redondea a dos decimales, porque es dinero", () => {
    // 70 Bs/h durante 50 minutos = 58.333…
    expect(montoReserva(70, "09:00", "09:50")).toBe(58.33);
  });

  it("acepta el precio como string, tal como llega de Prisma", () => {
    expect(montoReserva("120.50", "10:00", "11:00")).toBe(120.5);
  });

  it("devuelve cero si el precio o la duración no son válidos", () => {
    expect(montoReserva(0, "15:00", "16:00")).toBe(0);
    expect(montoReserva(null, "15:00", "16:00")).toBe(0);
    expect(montoReserva(80, "16:00", "15:00")).toBe(0);
    expect(montoReserva(80, "15:00", "15:00")).toBe(0);
  });
});

describe("reservaRequierePago", () => {
  it("solo exige pago cuando hay un precio por hora positivo", () => {
    expect(reservaRequierePago(50)).toBe(true);
    expect(reservaRequierePago("50")).toBe(true);
    expect(reservaRequierePago(0)).toBe(false);
    expect(reservaRequierePago(null)).toBe(false);
    expect(reservaRequierePago(undefined)).toBe(false);
  });
});

describe("puedePagarReserva", () => {
  it("no deja pagar mientras el profesor no haya aceptado el horario", () => {
    const r = puedePagarReserva("PENDIENTE", null);
    expect(r.permitido).toBe(false);
    expect(r.permitido === false && r.mensaje).toMatch(/confirme el horario/i);
  });

  it("permite pagar una clase ya confirmada", () => {
    expect(puedePagarReserva("CONFIRMADA", null).permitido).toBe(true);
  });

  it("permite registrar el pago después de la clase, por el efectivo", () => {
    expect(puedePagarReserva("COMPLETADA", null).permitido).toBe(true);
  });

  it("deja reenviar el comprobante si el profesor lo rechazó", () => {
    expect(puedePagarReserva("CONFIRMADA", "FALLIDO").permitido).toBe(true);
    expect(puedePagarReserva("CONFIRMADA", "PENDIENTE").permitido).toBe(true);
  });

  it("no deja pagar una clase cancelada ni un pago ya confirmado", () => {
    expect(puedePagarReserva("CANCELADA", null).permitido).toBe(false);
    expect(puedePagarReserva("CONFIRMADA", "COMPLETADO").permitido).toBe(false);
  });
});

describe("puedeRevisarPagoReserva", () => {
  it("solo se revisa lo que está pendiente", () => {
    expect(puedeRevisarPagoReserva("PENDIENTE").permitido).toBe(true);
  });

  it("no se revisa dos veces ni sin comprobante", () => {
    expect(puedeRevisarPagoReserva("COMPLETADO").permitido).toBe(false);
    expect(puedeRevisarPagoReserva("FALLIDO").permitido).toBe(false);
    expect(puedeRevisarPagoReserva("REEMBOLSADO").permitido).toBe(false);
    expect(puedeRevisarPagoReserva(null).permitido).toBe(false);
  });
});

describe("estadoPagoTrasDecision", () => {
  it("traduce la decisión al estado del pago", () => {
    expect(estadoPagoTrasDecision("APROBAR")).toBe("COMPLETADO");
    expect(estadoPagoTrasDecision("RECHAZAR")).toBe("FALLIDO");
  });
});
