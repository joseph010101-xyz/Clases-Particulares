import { describe, it, expect } from "vitest";
import { puedeVerMaterial, puedeGestionarCurso, esEntregaTardia } from "./cursos";

describe("puedeVerMaterial", () => {
  it("permite al profesor dueño", () => {
    expect(puedeVerMaterial({ esDueño: true, estaInscrito: false })).toBe(true);
  });

  it("permite a un estudiante inscrito", () => {
    expect(puedeVerMaterial({ esDueño: false, estaInscrito: true })).toBe(true);
  });

  it("niega a quien no es dueño ni está inscrito", () => {
    expect(puedeVerMaterial({ esDueño: false, estaInscrito: false })).toBe(false);
  });
});

describe("puedeGestionarCurso", () => {
  it("solo lo permite al profesor dueño", () => {
    expect(puedeGestionarCurso({ esDueño: true, estaInscrito: false })).toBe(true);
    expect(puedeGestionarCurso({ esDueño: false, estaInscrito: true })).toBe(false);
    expect(puedeGestionarCurso({ esDueño: false, estaInscrito: false })).toBe(false);
  });
});

describe("esEntregaTardia", () => {
  const limite = new Date("2026-07-20T23:59:00");

  it("no es tardía cuando no hay fecha límite", () => {
    expect(esEntregaTardia(null, new Date("2030-01-01"))).toBe(false);
  });

  it("no es tardía si se entrega antes del límite", () => {
    expect(esEntregaTardia(limite, new Date("2026-07-20T10:00:00"))).toBe(false);
  });

  it("es tardía si se entrega después del límite", () => {
    expect(esEntregaTardia(limite, new Date("2026-07-21T00:05:00"))).toBe(true);
  });
});
