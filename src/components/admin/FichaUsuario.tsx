// =============================================
// ClasesYa - Ficha de usuario para administración
// Muestra perfil, actividad e historial sin salir del panel.
// =============================================

"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Cargando from "@/components/ui/Cargando";
import BadgeVerificado from "@/components/ui/BadgeVerificado";
import { identidadDe } from "@/lib/rolesUI";
import { DESCRIPCION_ACCION, tiempoRelativo, type AccionAuditoriaUI } from "@/lib/auditoriaUI";

interface Ficha {
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    telefono: string | null;
    ubicacion: string | null;
    bio: string | null;
    activo: boolean;
    verificado: boolean;
    ultimoAcceso: string | null;
    createdAt: string;
    _count: {
      servicios: number;
      reservas: number;
      cursos: number;
      inscripciones: number;
      entregas: number;
    };
  };
  reservas: {
    id: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: string;
    servicio: { materia: string };
    estudiante: { nombre: string };
  }[];
  calificacionMedia: number | null;
  totalResenas: number;
  auditoria: {
    id: string;
    actorNombre: string;
    accion: AccionAuditoriaUI;
    detalle: string | null;
    createdAt: string;
  }[];
}

const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700",
  CONFIRMADA: "bg-green-50 text-green-700",
  COMPLETADA: "bg-blue-50 text-blue-700",
  CANCELADA: "bg-red-50 text-red-700",
};

export default function FichaUsuario({
  usuarioId,
  onCerrar,
}: {
  usuarioId: string | null;
  onCerrar: () => void;
}) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!usuarioId) {
      setFicha(null);
      return;
    }
    setCargando(true);
    fetch(`/api/admin/usuarios/${usuarioId}/ficha`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setFicha(d))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuarioId]);

  const identidad = identidadDe(ficha?.usuario.rol);
  const esProfesor = ficha?.usuario.rol === "PROFESOR";

  return (
    <Modal abierto={usuarioId !== null} onCerrar={onCerrar} titulo="Ficha del usuario">
      {cargando || !ficha ? (
        <Cargando texto="Cargando ficha…" />
      ) : (
        <div className="space-y-5">
          {/* Cabecera */}
          <div className="flex items-start gap-3">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
              style={{ backgroundColor: identidad?.color ?? "var(--c-primary)" }}
            >
              {ficha.usuario.nombre.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{ficha.usuario.nombre}</h3>
                {ficha.usuario.verificado && <BadgeVerificado />}
                {!ficha.usuario.activo && (
                  <span className="text-xs font-medium bg-red-50 text-red-600 rounded-full px-2 py-0.5">
                    Desactivado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{ficha.usuario.email}</p>
              {identidad && (
                <span
                  className="inline-block mt-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: identidad.color }}
                >
                  {identidad.etiqueta}
                </span>
              )}
            </div>
          </div>

          {/* Actividad */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Última conexión</p>
              <p className="font-medium text-gray-900">
                {ficha.usuario.ultimoAcceso ? tiempoRelativo(ficha.usuario.ultimoAcceso) : "Nunca"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Miembro desde</p>
              <p className="font-medium text-gray-900">
                {new Date(ficha.usuario.createdAt).toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>

          {/* Cifras según el rol */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {esProfesor ? (
              <>
                <Cifra etiqueta="Servicios" valor={ficha.usuario._count.servicios} />
                <Cifra etiqueta="Cursos" valor={ficha.usuario._count.cursos} />
                <Cifra
                  etiqueta="Calificación"
                  valor={ficha.calificacionMedia !== null ? ficha.calificacionMedia.toFixed(1) : "—"}
                  detalle={`${ficha.totalResenas} reseñas`}
                />
              </>
            ) : (
              <>
                <Cifra etiqueta="Reservas" valor={ficha.usuario._count.reservas} />
                <Cifra etiqueta="Inscripciones" valor={ficha.usuario._count.inscripciones} />
                <Cifra etiqueta="Entregas" valor={ficha.usuario._count.entregas} />
              </>
            )}
          </div>

          {/* Reservas recientes */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Reservas recientes</h4>
            {ficha.reservas.length === 0 ? (
              <p className="text-sm text-gray-500">Sin reservas.</p>
            ) : (
              <ul className="space-y-1.5">
                {ficha.reservas.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-gray-700">
                      {r.servicio.materia}
                      <span className="text-gray-400">
                        {" · "}
                        {new Date(r.fecha).toLocaleDateString("es-ES")} {r.horaInicio}
                      </span>
                    </span>
                    <span
                      className={`text-[11px] font-medium rounded-full px-2 py-0.5 flex-shrink-0 ${
                        COLOR_ESTADO[r.estado] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.estado.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Acciones administrativas sobre esta cuenta */}
          {ficha.auditoria.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Historial administrativo</h4>
              <ul className="space-y-1.5">
                {ficha.auditoria.map((a) => (
                  <li key={a.id} className="text-sm text-gray-600">
                    <span className="text-gray-900 font-medium">{a.actorNombre}</span>{" "}
                    {(DESCRIPCION_ACCION[a.accion] ?? a.accion).toLowerCase()}
                    {a.detalle ? ` (${a.detalle})` : ""}
                    <span className="text-gray-400"> · {tiempoRelativo(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: string | number; detalle?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xl font-bold text-gray-900 tabular-nums">{valor}</p>
      <p className="text-xs text-gray-500">{etiqueta}</p>
      {detalle && <p className="text-[10px] text-gray-400">{detalle}</p>}
    </div>
  );
}
