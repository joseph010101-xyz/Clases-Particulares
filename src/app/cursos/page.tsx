// =============================================
// ClasesYa - Página: Cursos (aula virtual)
// Catálogo público + "Mis cursos" + creación (profesores).
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import BadgeVerificado from "@/components/ui/BadgeVerificado";
import Avatar from "@/components/ui/Avatar";
import Cargando from "@/components/ui/Cargando";
import SelectorFecha from "@/components/ui/SelectorFecha";
import { FadeIn } from "@/components/ui/Motion";
import { SIMBOLO_MONEDA, formatearPrecio, esCursoGratuito, describirVigencia } from "@/lib/dominio";

interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  precio?: number | string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  profesor: { id: string; nombre: string; foto: string | null; verificado?: boolean };
  _count: { inscripciones: number; materiales: number };
}

interface Usuario {
  id: string;
  rol: "PROFESOR" | "ESTUDIANTE" | "ADMIN" | "MODERADOR";
}

export default function CursosPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [tab, setTab] = useState<"catalogo" | "mios">("catalogo");
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esDePago, setEsDePago] = useState(false);
  const [precio, setPrecio] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [puedeCobrar, setPuedeCobrar] = useState(true);

  const cargar = useCallback(async (t: "catalogo" | "mios", u: Usuario | null) => {
    let url = "/api/cursos";
    if (t === "mios" && u) {
      url += u.rol === "PROFESOR" ? "?mios=true" : "?inscrito=true";
    }
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) setCursos((await res.json()).cursos ?? []);
    else setCursos([]);
  }, []);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const u = meRes.ok ? (await meRes.json()).usuario : null;
      setUsuario(u);
      // Saber de antemano si el profesor puede cobrar evita que descubra el
      // impedimento solo al enviar el formulario.
      if (u?.rol === "PROFESOR") {
        fetch("/api/perfil/cobro", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => setPuedeCobrar(Boolean(d?.puedeCobrar)))
          .catch(() => {});
      }
      await cargar("catalogo", u);
      setCargando(false);
    })();
  }, [cargar]);

  const cambiarTab = async (t: "catalogo" | "mios") => {
    setTab(t);
    await cargar(t, usuario);
  };

  const crearCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm("");
    setCreando(true);
    try {
      const res = await fetch("/api/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descripcion,
          precio: esDePago ? Number(precio) || 0 : 0,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorForm(data.error || "No se pudo crear el curso");
        return;
      }
      setModalAbierto(false);
      setTitulo("");
      setDescripcion("");
      setEsDePago(false);
      setPrecio("");
      setFechaInicio("");
      setFechaFin("");
      setTab("mios");
      await cargar("mios", usuario);
    } finally {
      setCreando(false);
    }
  };

  const esProfesor = usuario?.rol === "PROFESOR";
  const etiquetaMios = esProfesor ? "Mis cursos" : "Mis inscripciones";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-600 mt-1">Aula virtual: material, apuntes y recursos de clase.</p>
        </div>
        {esProfesor && <Button onClick={() => setModalAbierto(true)}>Crear curso</Button>}
      </div>

      {usuario && (
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => cambiarTab("catalogo")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "catalogo" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Catálogo
          </button>
          <button
            onClick={() => cambiarTab("mios")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "mios" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {etiquetaMios}
          </button>
        </div>
      )}

      {cargando ? (
        <Cargando />
      ) : cursos.length === 0 ? (
        <p className="text-gray-500">
          {tab === "mios"
            ? esProfesor
              ? "Aún no has creado ningún curso."
              : "Aún no te has inscrito en ningún curso."
            : "Todavía no hay cursos publicados."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((c, i) => (
            <FadeIn key={c.id} delay={Math.min(i * 0.05, 0.3)} className="h-full">
            <Link
              href={`/cursos/${c.id}`}
              className="h-full bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{c.titulo}</h3>
                <span
                  className={`flex-shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 ${
                    esCursoGratuito(c.precio)
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {esCursoGratuito(c.precio) ? "Gratis" : formatearPrecio(c.precio)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3 flex-1">{c.descripcion}</p>
              {(c.fechaInicio || c.fechaFin) && (
                <p className="text-xs text-gray-400 mt-2">
                  📅 {describirVigencia({ activo: true, fechaInicio: c.fechaInicio, fechaFin: c.fechaFin })}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
                <Avatar nombre={c.profesor.nombre} foto={c.profesor.foto} tamano={22} />
                <span>{c.profesor.nombre}</span>
                {c.profesor.verificado && <BadgeVerificado soloIcono />}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>{c._count.inscripciones} inscrito{c._count.inscripciones !== 1 ? "s" : ""}</span>
                <span>{c._count.materiales} material{c._count.materiales !== 1 ? "es" : ""}</span>
              </div>
            </Link>
            </FadeIn>
          ))}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo="Crear curso">
        <form onSubmit={crearCurso} className="space-y-4">
          {errorForm && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{errorForm}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={150}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Cálculo I — Universitario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              maxLength={3000}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="¿Qué aprenderán y qué material encontrarán en el curso?"
            />
          </div>
          {/* Precio: gratuito por defecto */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={esDePago}
                onChange={(e) => setEsDePago(e.target.checked)}
                className="w-4 h-4 accent-[var(--c-primary)]"
              />
              <span className="text-sm font-medium text-gray-700">Este curso tiene costo</span>
            </label>
            {esDePago ? (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Precio del curso ({SIMBOLO_MONEDA})</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej: 250"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El estudiante te pagará directamente y tú confirmarás la inscripción.
                </p>
                {!puedeCobrar && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs">
                    Todavía no tienes configurado cómo cobrar. Ve a{" "}
                    <Link href="/profesores/dashboard" className="underline font-medium">
                      tu panel → Cobros
                    </Link>{" "}
                    y añade tu QR, cuenta bancaria o Tigo Money antes de publicarlo.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                El curso será gratuito y los estudiantes accederán al inscribirse.
              </p>
            )}
          </div>

          {/* Vigencia opcional */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Duración (opcional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Comienza</label>
                <SelectorFecha valor={fechaInicio} onChange={setFechaInicio} placeholder="Sin fecha" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Termina</label>
                <SelectorFecha
                  valor={fechaFin}
                  onChange={setFechaFin}
                  min={fechaInicio || undefined}
                  placeholder="Sin fecha"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Si no indicas fechas, el curso estará disponible de forma permanente.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variante="ghost" onClick={() => setModalAbierto(false)}>Cancelar</Button>
            <Button type="submit" cargando={creando}>Crear curso</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
