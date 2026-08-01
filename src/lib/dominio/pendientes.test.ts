import { describe, it, expect } from "vitest";
import {
  urgenciaDeFecha,
  etiquetaUrgencia,
  ordenarPendientes,
  contarUrgentes,
  DIAS_PROXIMOS,
  type Pendiente,
} from "./pendientes";

const ahora = new Date("2026-06-15T14:00:00");
const enDias = (d: number, hora = "12:00:00") => {
  const f = new Date(ahora);
  f.setDate(f.getDate() + d);
  const [h, m, s] = hora.split(":").map(Number);
  f.setHours(h, m, s, 0);
  return f;
};

describe("urgenciaDeFecha", () => {
  it("sin fecha límite nada urge", () => {
    expect(urgenciaDeFecha(null, ahora)).toBe("normal");
    expect(urgenciaDeFecha(undefined, ahora)).toBe("normal");
  });

  it("una fecha inválida no rompe ni inventa urgencia", () => {
    expect(urgenciaDeFecha("no es una fecha", ahora)).toBe("normal");
  });

  it("lo que ya pasó está vencido", () => {
    expect(urgenciaDeFecha(enDias(-1), ahora)).toBe("vencida");
    expect(urgenciaDeFecha(enDias(0, "13:59:00"), ahora)).toBe("vencida");
  });

  it("lo que vence más tarde hoy es de hoy, no de mañana", () => {
    expect(urgenciaDeFecha(enDias(0, "23:59:00"), ahora)).toBe("hoy");
  });

  it("mañana a primera hora ya no es hoy", () => {
    expect(urgenciaDeFecha(enDias(1, "00:30:00"), ahora)).toBe("pronto");
  });

  it("dentro de la ventana próxima avisa, y más allá no", () => {
    expect(urgenciaDeFecha(enDias(DIAS_PROXIMOS), ahora)).toBe("pronto");
    expect(urgenciaDeFecha(enDias(DIAS_PROXIMOS + 2), ahora)).toBe("normal");
  });

  it("acepta la fecha como cadena, tal como viaja en JSON", () => {
    expect(urgenciaDeFecha(enDias(-3).toISOString(), ahora)).toBe("vencida");
  });
});

describe("etiquetaUrgencia", () => {
  it("solo pone texto cuando hay algo que decir", () => {
    expect(etiquetaUrgencia("vencida")).toBe("Venció");
    expect(etiquetaUrgencia("hoy")).toBe("Vence hoy");
    expect(etiquetaUrgencia("pronto")).toBe("Vence pronto");
    expect(etiquetaUrgencia("normal")).toBe("");
  });
});

const p = (
  tipo: Pendiente["tipo"],
  urgencia: Pendiente["urgencia"],
  fecha: string | null = null
): Pendiente => ({ tipo, urgencia, fecha, titulo: tipo, contexto: "", enlace: "" });

describe("ordenarPendientes", () => {
  it("lo vencido va primero, aunque sea menos importante", () => {
    const orden = ordenarPendientes([p("PAGO", "normal"), p("CALIFICAR", "vencida")]);
    expect(orden[0].tipo).toBe("CALIFICAR");
  });

  it("con la misma urgencia, primero lo que deja a otro bloqueado", () => {
    const orden = ordenarPendientes([
      p("CALIFICAR", "hoy"),
      p("TAREA", "hoy"),
      p("REVISAR_PAGO", "hoy"),
      p("PAGO", "hoy"),
    ]);
    expect(orden.map((x) => x.tipo)).toEqual(["PAGO", "REVISAR_PAGO", "TAREA", "CALIFICAR"]);
  });

  it("a igualdad de todo, antes la fecha más cercana", () => {
    const orden = ordenarPendientes([
      p("TAREA", "pronto", "2026-06-18T12:00:00.000Z"),
      p("TAREA", "pronto", "2026-06-16T12:00:00.000Z"),
    ]);
    expect(orden[0].fecha).toContain("06-16");
  });

  it("lo que tiene fecha va antes que lo que no la tiene", () => {
    const orden = ordenarPendientes([p("TAREA", "normal", null), p("TAREA", "normal", "2026-07-01")]);
    expect(orden[0].fecha).toBe("2026-07-01");
  });

  it("no altera la lista que recibe", () => {
    const original = [p("CALIFICAR", "normal"), p("PAGO", "vencida")];
    const copia = [...original];
    ordenarPendientes(original);
    expect(original).toEqual(copia);
  });
});

describe("contarUrgentes", () => {
  it("cuenta lo vencido y lo de hoy, no lo demás", () => {
    expect(
      contarUrgentes([p("TAREA", "vencida"), p("TAREA", "hoy"), p("TAREA", "pronto"), p("TAREA", "normal")])
    ).toBe(2);
  });

  it("sin nada pendiente cuenta cero", () => {
    expect(contarUrgentes([])).toBe(0);
  });
});
