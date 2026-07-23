import { describe, it, expect } from "vitest";
import { promedioCalificaciones } from "./calificaciones";

describe("promedioCalificaciones", () => {
  it("devuelve null cuando no hay calificaciones", () => {
    expect(promedioCalificaciones([])).toBeNull();
  });

  it("calcula el promedio exacto de un conjunto", () => {
    expect(promedioCalificaciones([5, 5, 5])).toBe(5);
    expect(promedioCalificaciones([2, 4])).toBe(3);
  });

  it("redondea a un decimal", () => {
    // (5 + 4 + 4) / 3 = 4.333... -> 4.3
    expect(promedioCalificaciones([5, 4, 4])).toBe(4.3);
    // (5 + 4) / 2 = 4.5
    expect(promedioCalificaciones([5, 4])).toBe(4.5);
    // (1 + 2 + 2) / 3 = 1.666... -> 1.7
    expect(promedioCalificaciones([1, 2, 2])).toBe(1.7);
  });

  it("distingue 'sin reseñas' (null) de promedio bajo", () => {
    expect(promedioCalificaciones([1])).toBe(1);
    expect(promedioCalificaciones([])).toBeNull();
  });
});
