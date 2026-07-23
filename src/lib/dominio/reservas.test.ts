import { describe, it, expect } from "vitest";
import {
  validarTransicionReserva,
  esDiaPasado,
  reservaYaOcurrio,
} from "./reservas";

const PROFESOR = { esProfesor: true, esEstudiante: false };
const ESTUDIANTE = { esProfesor: false, esEstudiante: true };
const AJENO = { esProfesor: false, esEstudiante: false };

describe("validarTransicionReserva", () => {
  it("rechaza estados desconocidos como estado_invalido", () => {
    const r = validarTransicionReserva("PENDIENTE", "PENDIENTE", PROFESOR);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("estado_invalido");
  });

  it("impide modificar una reserva ya COMPLETADA (terminal)", () => {
    const r = validarTransicionReserva("COMPLETADA", "CANCELADA", PROFESOR);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("estado_terminal");
  });

  it("impide modificar una reserva ya CANCELADA (terminal)", () => {
    const r = validarTransicionReserva("CANCELADA", "CONFIRMADA", PROFESOR);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("estado_terminal");
  });

  it("solo el profesor puede CONFIRMAR", () => {
    expect(validarTransicionReserva("PENDIENTE", "CONFIRMADA", PROFESOR).permitido).toBe(true);
    const r = validarTransicionReserva("PENDIENTE", "CONFIRMADA", ESTUDIANTE);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("sin_permiso");
  });

  it("solo el profesor puede COMPLETAR", () => {
    expect(validarTransicionReserva("CONFIRMADA", "COMPLETADA", PROFESOR).permitido).toBe(true);
    const r = validarTransicionReserva("CONFIRMADA", "COMPLETADA", ESTUDIANTE);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("sin_permiso");
  });

  it("estudiante y profesor pueden CANCELAR, un tercero no", () => {
    expect(validarTransicionReserva("PENDIENTE", "CANCELADA", ESTUDIANTE).permitido).toBe(true);
    expect(validarTransicionReserva("CONFIRMADA", "CANCELADA", PROFESOR).permitido).toBe(true);
    const r = validarTransicionReserva("PENDIENTE", "CANCELADA", AJENO);
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toBe("sin_permiso");
  });
});

describe("esDiaPasado", () => {
  const ahora = new Date(2026, 6, 23, 10, 0); // 23-jul-2026 10:00 local

  it("marca un día anterior como pasado", () => {
    expect(esDiaPasado(new Date(2026, 6, 22), ahora)).toBe(true);
  });

  it("no marca el día de hoy como pasado", () => {
    expect(esDiaPasado(new Date(2026, 6, 23), ahora)).toBe(false);
  });

  it("no marca un día futuro como pasado", () => {
    expect(esDiaPasado(new Date(2026, 6, 24), ahora)).toBe(false);
  });
});

describe("reservaYaOcurrio", () => {
  const ahora = new Date(2026, 6, 23, 10, 0); // 23-jul-2026 10:00 local

  it("es verdadero para una clase de un día anterior", () => {
    expect(reservaYaOcurrio(new Date(2026, 6, 20), "11:00", ahora)).toBe(true);
  });

  it("es verdadero cuando la clase de hoy ya terminó", () => {
    expect(reservaYaOcurrio(new Date(2026, 6, 23), "09:00", ahora)).toBe(true);
  });

  it("es falso cuando la clase de hoy aún no termina", () => {
    expect(reservaYaOcurrio(new Date(2026, 6, 23), "15:00", ahora)).toBe(false);
  });

  it("es falso para una clase en un día futuro", () => {
    expect(reservaYaOcurrio(new Date(2026, 6, 25), "09:00", ahora)).toBe(false);
  });
});
