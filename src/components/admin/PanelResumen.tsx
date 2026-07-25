// =============================================
// ClasesYa - Panel de administración: Resumen de la plataforma
// =============================================

"use client";

import { useEffect, useState } from "react";
import Cargando from "@/components/ui/Cargando";
import { TarjetaMetrica, GraficaBarras, Desglose } from "@/components/admin/Graficas";
import { IDENTIDAD_ROL, type RolUsuario } from "@/lib/rolesUI";

interface Metricas {
  usuarios: { total: number; porRol: Record<string, number>; nuevos7d: number; activos7d: number };
  profesores: { total: number; verificados: number; pendientes: number };
  reservas: {
    total: number;
    porEstado: Record<string, number>;
    nuevas7d: number;
    tasaConfirmacion: number | null;
  };
  catalogo: { serviciosActivos: number; cursosActivos: number; inscripciones: number };
  resenas: { total: number; promedio: number | null };
  serieReservas: { fecha: string; total: number }[];
}

// Colores de estado reservados (no se reutilizan como serie categórica)
const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: "#d97706",
  CONFIRMADA: "#059669",
  COMPLETADA: "#0284c7",
  CANCELADA: "#dc2626",
};
const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendientes",
  CONFIRMADA: "Confirmadas",
  COMPLETADA: "Completadas",
  CANCELADA: "Canceladas",
};

const ORDEN_ROLES: RolUsuario[] = ["ESTUDIANTE", "PROFESOR", "MODERADOR", "ADMIN"];

export default function PanelResumen() {
  const [datos, setDatos] = useState<Metricas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metricas", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setDatos(d))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando texto="Calculando métricas…" />;
  if (!datos) return <p className="text-gray-500">No se pudieron cargar las métricas.</p>;

  const { usuarios, profesores, reservas, catalogo, resenas, serieReservas } = datos;

  const filasRoles = ORDEN_ROLES.filter((r) => (usuarios.porRol[r] ?? 0) > 0).map((r) => ({
    etiqueta: IDENTIDAD_ROL[r].etiqueta,
    valor: usuarios.porRol[r] ?? 0,
    color: IDENTIDAD_ROL[r].color,
  }));

  const filasEstados = Object.keys(ETIQUETA_ESTADO)
    .filter((e) => (reservas.porEstado[e] ?? 0) > 0)
    .map((e) => ({
      etiqueta: ETIQUETA_ESTADO[e],
      valor: reservas.porEstado[e] ?? 0,
      color: COLOR_ESTADO[e],
    }));

  const pctVerificados =
    profesores.total > 0 ? Math.round((profesores.verificados / profesores.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Indicadores principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica
          etiqueta="Usuarios"
          valor={usuarios.total}
          detalle={`${usuarios.nuevos7d} nuevos esta semana`}
        />
        <TarjetaMetrica
          etiqueta="Activos (7 días)"
          valor={usuarios.activos7d}
          detalle={
            usuarios.total > 0
              ? `${Math.round((usuarios.activos7d / usuarios.total) * 100)}% del total`
              : undefined
          }
        />
        <TarjetaMetrica
          etiqueta="Reservas"
          valor={reservas.total}
          detalle={`${reservas.nuevas7d} esta semana`}
        />
        <TarjetaMetrica
          etiqueta="Tasa de confirmación"
          valor={reservas.tasaConfirmacion !== null ? `${reservas.tasaConfirmacion}%` : "—"}
          detalle="Confirmadas o completadas"
        />
      </div>

      {/* Actividad reciente */}
      <GraficaBarras titulo="Reservas creadas (últimos 14 días)" datos={serieReservas} />

      {/* Composición */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Desglose titulo="Usuarios por rol" filas={filasRoles} />
        <Desglose titulo="Reservas por estado" filas={filasEstados} />
      </div>

      {/* Catálogo y confianza */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica
          etiqueta="Profesores verificados"
          valor={`${profesores.verificados}/${profesores.total}`}
          detalle={`${pctVerificados}% · ${profesores.pendientes} por revisar`}
        />
        <TarjetaMetrica etiqueta="Servicios activos" valor={catalogo.serviciosActivos} />
        <TarjetaMetrica
          etiqueta="Cursos activos"
          valor={catalogo.cursosActivos}
          detalle={`${catalogo.inscripciones} inscripciones`}
        />
        <TarjetaMetrica
          etiqueta="Calificación media"
          valor={resenas.promedio !== null ? resenas.promedio.toFixed(1) : "—"}
          detalle={`${resenas.total} reseñas`}
        />
      </div>
    </div>
  );
}
