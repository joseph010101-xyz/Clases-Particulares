import { describe, it, expect, vi } from "vitest";
import { BusRealtime } from "./bus";

describe("BusRealtime", () => {
  it("entrega los eventos publicados a un suscriptor del mismo usuario", () => {
    const bus = new BusRealtime();
    const recibido = vi.fn();
    bus.suscribir("u1", recibido);

    bus.publicar("u1", "mensaje:nuevo", { texto: "hola" });

    expect(recibido).toHaveBeenCalledOnce();
    expect(recibido).toHaveBeenCalledWith("mensaje:nuevo", { texto: "hola" });
  });

  it("no entrega eventos dirigidos a otro usuario", () => {
    const bus = new BusRealtime();
    const recibido = vi.fn();
    bus.suscribir("u1", recibido);

    bus.publicar("u2", "mensaje:nuevo", { texto: "para otro" });

    expect(recibido).not.toHaveBeenCalled();
  });

  it("deja de entregar tras desuscribirse", () => {
    const bus = new BusRealtime();
    const recibido = vi.fn();
    const cancelar = bus.suscribir("u1", recibido);

    cancelar();
    bus.publicar("u1", "mensaje:nuevo", {});

    expect(recibido).not.toHaveBeenCalled();
    expect(bus.contarSuscriptores("u1")).toBe(0);
  });

  it("entrega a múltiples conexiones del mismo usuario (varias pestañas)", () => {
    const bus = new BusRealtime();
    const a = vi.fn();
    const b = vi.fn();
    bus.suscribir("u1", a);
    bus.suscribir("u1", b);

    bus.publicar("u1", "mensaje:leido", { lectorId: "u2" });

    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    expect(bus.contarSuscriptores("u1")).toBe(2);
  });

  it("aísla el fallo de un manejador para no afectar al resto", () => {
    const bus = new BusRealtime();
    const bueno = vi.fn();
    bus.suscribir("u1", () => {
      throw new Error("boom");
    });
    bus.suscribir("u1", bueno);

    expect(() => bus.publicar("u1", "x", {})).not.toThrow();
    expect(bueno).toHaveBeenCalledOnce();
  });
});
