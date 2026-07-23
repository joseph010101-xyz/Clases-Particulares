import { describe, it, expect } from "vitest";
import { puedeModerar, puedeAdministrarUsuarios, esRolAsignable } from "./permisos";

describe("puedeModerar", () => {
  it("permite a ADMIN y MODERADOR", () => {
    expect(puedeModerar("ADMIN")).toBe(true);
    expect(puedeModerar("MODERADOR")).toBe(true);
  });

  it("niega a PROFESOR y ESTUDIANTE", () => {
    expect(puedeModerar("PROFESOR")).toBe(false);
    expect(puedeModerar("ESTUDIANTE")).toBe(false);
  });
});

describe("puedeAdministrarUsuarios", () => {
  it("solo lo permite a ADMIN (mínimo privilegio)", () => {
    expect(puedeAdministrarUsuarios("ADMIN")).toBe(true);
    expect(puedeAdministrarUsuarios("MODERADOR")).toBe(false);
    expect(puedeAdministrarUsuarios("PROFESOR")).toBe(false);
    expect(puedeAdministrarUsuarios("ESTUDIANTE")).toBe(false);
  });
});

describe("esRolAsignable", () => {
  it("acepta los cuatro roles válidos", () => {
    expect(esRolAsignable("ESTUDIANTE")).toBe(true);
    expect(esRolAsignable("PROFESOR")).toBe(true);
    expect(esRolAsignable("MODERADOR")).toBe(true);
    expect(esRolAsignable("ADMIN")).toBe(true);
  });

  it("rechaza valores desconocidos", () => {
    expect(esRolAsignable("SUPERADMIN")).toBe(false);
    expect(esRolAsignable("")).toBe(false);
  });
});
