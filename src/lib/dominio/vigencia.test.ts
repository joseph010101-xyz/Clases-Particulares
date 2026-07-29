import { describe, it, expect } from "vitest";
import {
  esCursoGratuito,
  cursoFinalizado,
  cursoPorComenzar,
  puedeInscribirse,
  describirVigencia,
} from "./vigencia";

const AHORA = new Date(2026, 7, 15, 12, 0); // 15-ago-2026 12:00

describe("esCursoGratuito", () => {
  it("considera gratuito el precio cero o ausente", () => {
    expect(esCursoGratuito(0)).toBe(true);
    expect(esCursoGratuito("0")).toBe(true);
    expect(esCursoGratuito(null)).toBe(true);
    expect(esCursoGratuito(undefined)).toBe(true);
  });

  it("considera de pago cualquier precio positivo", () => {
    expect(esCursoGratuito(50)).toBe(false);
    expect(esCursoGratuito("120.50")).toBe(false);
  });
});

describe("cursoFinalizado", () => {
  it("un curso sin fecha de fin nunca finaliza", () => {
    expect(cursoFinalizado({ activo: true }, AHORA)).toBe(false);
  });

  it("sigue vigente durante todo el día de la fecha de fin", () => {
    expect(cursoFinalizado({ activo: true, fechaFin: new Date(2026, 7, 15) }, AHORA)).toBe(false);
  });

  it("finaliza al día siguiente de la fecha de fin", () => {
    expect(cursoFinalizado({ activo: true, fechaFin: new Date(2026, 7, 14) }, AHORA)).toBe(true);
  });
});

describe("cursoPorComenzar", () => {
  it("sin fecha de inicio se considera en marcha", () => {
    expect(cursoPorComenzar({ activo: true }, AHORA)).toBe(false);
  });

  it("detecta un curso que aún no empieza", () => {
    expect(cursoPorComenzar({ activo: true, fechaInicio: new Date(2026, 7, 20) }, AHORA)).toBe(true);
  });

  it("el día de inicio ya cuenta como comenzado", () => {
    expect(cursoPorComenzar({ activo: true, fechaInicio: new Date(2026, 7, 15) }, AHORA)).toBe(false);
  });
});

describe("puedeInscribirse", () => {
  it("permite en un curso activo sin fechas", () => {
    expect(puedeInscribirse({ activo: true }, AHORA).permitido).toBe(true);
  });

  it("permite incorporarse a un curso ya empezado que sigue vigente", () => {
    const r = puedeInscribirse(
      { activo: true, fechaInicio: new Date(2026, 7, 1), fechaFin: new Date(2026, 8, 30) },
      AHORA
    );
    expect(r.permitido).toBe(true);
  });

  it("rechaza un curso finalizado", () => {
    const r = puedeInscribirse({ activo: true, fechaFin: new Date(2026, 6, 30) }, AHORA);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("finalizado");
  });

  it("rechaza un curso desactivado", () => {
    const r = puedeInscribirse({ activo: false }, AHORA);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("inactivo");
  });
});

describe("describirVigencia", () => {
  it("indica disponibilidad permanente cuando no hay fechas", () => {
    expect(describirVigencia({ activo: true })).toBe("Disponible en cualquier momento");
  });

  it("describe el periodo completo", () => {
    const t = describirVigencia({
      activo: true,
      fechaInicio: new Date(2026, 7, 1),
      fechaFin: new Date(2026, 8, 30),
    });
    expect(t).toContain("Del");
    expect(t).toContain("al");
  });

  it("describe solo el inicio o solo el fin", () => {
    expect(describirVigencia({ activo: true, fechaInicio: new Date(2026, 7, 1) })).toContain("Comienza el");
    expect(describirVigencia({ activo: true, fechaFin: new Date(2026, 8, 30) })).toContain("Hasta el");
  });
});
