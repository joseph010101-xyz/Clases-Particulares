import { describe, it, expect } from "vitest";
import { puedeVerMaterial, puedeGestionarCurso } from "./cursos";

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
