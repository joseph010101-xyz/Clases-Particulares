// =============================================
// ClasesYa - Página: Detalle de curso (aula virtual)
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import BadgeVerificado from "@/components/ui/BadgeVerificado";

interface Material {
  id: string;
  titulo: string;
  url: string;
  formato: string | null;
  bytes: number | null;
  createdAt: string;
}

interface CursoDetalle {
  curso: {
    id: string;
    titulo: string;
    descripcion: string;
    activo: boolean;
    createdAt: string;
    profesor: { id: string; nombre: string; foto: string | null; verificado?: boolean };
    _count: { inscripciones: number; materiales: number };
  };
  esDueño: boolean;
  estaInscrito: boolean;
  puedeVerMaterial: boolean;
  materiales: Material[];
}

interface Usuario {
  id: string;
  rol: "PROFESOR" | "ESTUDIANTE" | "ADMIN" | "MODERADOR";
}

function formatearBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CursoDetallePage() {
  const params = useParams();
  const id = params.id as string;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [data, setData] = useState<CursoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [accion, setAccion] = useState(false);

  // Subida de material (profesor dueño)
  const [tituloMat, setTituloMat] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState("");

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/cursos/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Curso no encontrado");
      return;
    }
    setData(await res.json());
  }, [id]);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      setUsuario(meRes.ok ? (await meRes.json()).usuario : null);
      await cargar();
      setCargando(false);
    })();
  }, [cargar]);

  const inscribirse = async () => {
    setAccion(true);
    try {
      const res = await fetch(`/api/cursos/${id}/inscripcion`, { method: "POST" });
      if (res.ok) await cargar();
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "No se pudo inscribir");
      }
    } finally {
      setAccion(false);
    }
  };

  const darseDeBaja = async () => {
    if (!confirm("¿Darte de baja de este curso?")) return;
    setAccion(true);
    try {
      const res = await fetch(`/api/cursos/${id}/inscripcion`, { method: "DELETE" });
      if (res.ok) await cargar();
    } finally {
      setAccion(false);
    }
  };

  const subirMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSubida("");
    if (!archivo) {
      setErrorSubida("Adjunta un archivo");
      return;
    }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("titulo", tituloMat);
      fd.append("archivo", archivo);
      const res = await fetch(`/api/cursos/${id}/materiales`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorSubida(d.error || "No se pudo subir el material");
        return;
      }
      setTituloMat("");
      setArchivo(null);
      const input = document.getElementById("archivo-input") as HTMLInputElement | null;
      if (input) input.value = "";
      await cargar();
    } finally {
      setSubiendo(false);
    }
  };

  const borrarMaterial = async (materialId: string) => {
    if (!confirm("¿Eliminar este material?")) return;
    setAccion(true);
    try {
      const res = await fetch(`/api/cursos/${id}/materiales/${materialId}`, { method: "DELETE" });
      if (res.ok) await cargar();
    } finally {
      setAccion(false);
    }
  };

  if (cargando) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-gray-500">Cargando…</div>;
  }
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Curso no encontrado</h1>
        <Link href="/cursos"><Button>Volver a cursos</Button></Link>
      </div>
    );
  }

  const { curso, esDueño, estaInscrito, puedeVerMaterial, materiales } = data;
  const esEstudiante = usuario?.rol === "ESTUDIANTE";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/cursos" className="text-sm text-blue-600 hover:text-blue-700">← Volver a cursos</Link>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mt-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{curso.titulo}</h1>
            <Link href={`/profesores/${curso.profesor.id}`} className="inline-flex items-center gap-1.5 mt-2 text-gray-600 hover:text-blue-600">
              {curso.profesor.nombre}
              {curso.profesor.verificado && <BadgeVerificado soloIcono />}
            </Link>
            <p className="text-xs text-gray-400 mt-1">
              {curso._count.inscripciones} inscrito{curso._count.inscripciones !== 1 ? "s" : ""} ·{" "}
              {curso._count.materiales} material{curso._count.materiales !== 1 ? "es" : ""}
            </p>
          </div>

          {/* Acciones según rol/estado */}
          <div className="flex-shrink-0">
            {esDueño ? (
              <span className="text-sm font-medium text-blue-600">Tu curso</span>
            ) : estaInscrito ? (
              <Button variante="secondary" cargando={accion} onClick={darseDeBaja}>Darse de baja</Button>
            ) : esEstudiante ? (
              <Button cargando={accion} onClick={inscribirse}>Inscribirme</Button>
            ) : !usuario ? (
              <Link href="/login"><Button>Inicia sesión para inscribirte</Button></Link>
            ) : null}
          </div>
        </div>

        <p className="text-gray-700 whitespace-pre-wrap mt-4">{curso.descripcion}</p>
      </div>

      {/* Subida de material (solo dueño) */}
      {esDueño && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Subir material</h2>
          <form onSubmit={subirMaterial} className="space-y-3">
            {errorSubida && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{errorSubida}</div>}
            <input
              value={tituloMat}
              onChange={(e) => setTituloMat(e.target.value)}
              placeholder="Título del material (ej: Apuntes tema 1)"
              maxLength={150}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              id="archivo-input"
              type="file"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400">PDF, Word, Excel, imágenes o video. Máximo 15 MB por archivo.</p>
            <Button type="submit" cargando={subiendo}>Subir</Button>
          </form>
        </div>
      )}

      {/* Lista de material */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
        <h2 className="font-semibold text-gray-900 mb-3">Material del curso</h2>
        {!puedeVerMaterial ? (
          <p className="text-sm text-gray-500">Inscríbete en el curso para acceder al material.</p>
        ) : materiales.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay material publicado.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {materiales.map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{m.titulo}</p>
                  <p className="text-xs text-gray-400">
                    {m.formato ? m.formato.toUpperCase() : "Archivo"}
                    {m.bytes ? ` · ${formatearBytes(m.bytes)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={m.url} target="_blank" rel="noopener noreferrer">
                    <Button variante="secondary" tamano="sm">Descargar</Button>
                  </a>
                  {esDueño && (
                    <Button variante="danger" tamano="sm" onClick={() => borrarMaterial(m.id)}>Eliminar</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
