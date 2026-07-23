import { describe, it, expect } from "vitest";
import {
  jsDayADiaSemana,
  intervalosSeSolapan,
  filtroSolapamientoPrisma,
  minutosDesdeHHmm,
  bloqueAdmiteDuracion,
  claseCabeEnBloque,
  DIAS_SEMANA,
} from "./horarios";

describe("jsDayADiaSemana", () => {
  it("convierte domingo de JS (0) a domingo del dominio (6)", () => {
    expect(jsDayADiaSemana(0)).toBe(6);
  });

  it("convierte lunes de JS (1) a lunes del dominio (0)", () => {
    expect(jsDayADiaSemana(1)).toBe(0);
  });

  it("convierte sábado de JS (6) a sábado del dominio (5)", () => {
    expect(jsDayADiaSemana(6)).toBe(5);
  });

  it("mapea toda la semana dentro del rango 0..6", () => {
    const mapeados = [0, 1, 2, 3, 4, 5, 6].map(jsDayADiaSemana);
    expect([...mapeados].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    mapeados.forEach((d) => {
      expect(DIAS_SEMANA[d]).toBeDefined();
    });
  });
});

describe("intervalosSeSolapan", () => {
  it("detecta solapamiento parcial", () => {
    expect(intervalosSeSolapan("10:00", "11:00", "10:30", "11:30")).toBe(true);
  });

  it("detecta cuando una franja contiene a la otra", () => {
    expect(intervalosSeSolapan("09:00", "12:00", "10:00", "11:00")).toBe(true);
  });

  it("considera que franjas contiguas NO se solapan (fin exclusivo)", () => {
    expect(intervalosSeSolapan("10:00", "11:00", "11:00", "12:00")).toBe(false);
    expect(intervalosSeSolapan("11:00", "12:00", "10:00", "11:00")).toBe(false);
  });

  it("no marca solapamiento entre franjas disjuntas", () => {
    expect(intervalosSeSolapan("08:00", "09:00", "14:00", "15:00")).toBe(false);
  });

  it("es simétrico respecto al orden de los argumentos", () => {
    const a = intervalosSeSolapan("10:00", "11:00", "10:30", "11:30");
    const b = intervalosSeSolapan("10:30", "11:30", "10:00", "11:00");
    expect(a).toBe(b);
  });
});

describe("filtroSolapamientoPrisma", () => {
  it("construye el filtro AND con las cotas correctas", () => {
    expect(filtroSolapamientoPrisma("10:00", "11:00")).toEqual({
      AND: [{ horaInicio: { lt: "11:00" } }, { horaFin: { gt: "10:00" } }],
    });
  });
});

describe("minutosDesdeHHmm", () => {
  it("convierte horas y minutos a minutos desde medianoche", () => {
    expect(minutosDesdeHHmm("00:00")).toBe(0);
    expect(minutosDesdeHHmm("07:15")).toBe(435);
    expect(minutosDesdeHHmm("23:59")).toBe(1439);
  });
});

describe("bloqueAdmiteDuracion", () => {
  it("acepta un bloque más largo que la duración", () => {
    // 07:15-10:00 = 165 min, clase de 120 min -> cabe
    expect(bloqueAdmiteDuracion("07:15", "10:00", 120)).toBe(true);
  });

  it("acepta un bloque de duración exacta", () => {
    expect(bloqueAdmiteDuracion("09:00", "10:00", 60)).toBe(true);
  });

  it("rechaza un bloque más corto que la duración (caso del bug)", () => {
    // 15:00-16:00 = 60 min, clase de 120 min -> NO cabe
    expect(bloqueAdmiteDuracion("15:00", "16:00", 120)).toBe(false);
  });
});

describe("claseCabeEnBloque", () => {
  it("cabe cuando empieza al inicio y termina dentro del bloque", () => {
    expect(claseCabeEnBloque("07:15", 120, "07:15", "10:00")).toBe(true);
  });

  it("no cabe cuando la clase desborda el fin del bloque", () => {
    // 15:00 + 120 = 17:00 > 16:00 (el caso exacto de la captura)
    expect(claseCabeEnBloque("15:00", 120, "15:00", "16:00")).toBe(false);
  });

  it("no cabe cuando empieza antes del inicio del bloque", () => {
    expect(claseCabeEnBloque("06:00", 30, "07:15", "10:00")).toBe(false);
  });

  it("cabe empezando en el último inicio válido del bloque", () => {
    // Bloque 09:00-11:00 (120 min), clase de 60 min: último inicio válido 10:00
    expect(claseCabeEnBloque("10:00", 60, "09:00", "11:00")).toBe(true);
    expect(claseCabeEnBloque("10:30", 60, "09:00", "11:00")).toBe(false);
  });
});
