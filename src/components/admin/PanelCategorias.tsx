// =============================================
// ClasesYa - Panel de administración: categorías del catálogo
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Cargando from "@/components/ui/Cargando";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  activo: boolean;
  _count: { servicios: number };
}

export default function PanelCategorias() {
  const confirmar = useConfirm();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);

  // Formulario de alta / edición
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/categorias?todas=true", { cache: "no-store" });
    if (res.ok) setCategorias((await res.json()).categorias ?? []);
  }, []);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombre("");
    setIcono("");
    setDescripcion("");
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const cuerpo = {
        nombre: nombre.trim(),
        icono: icono.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
      };
      const res = await fetch(
        editandoId ? `/api/categorias/${editandoId}` : "/api/categorias",
        {
          method: editandoId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpo),
        }
      );
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo guardar la categoría");
        return;
      }
      toast.success(editandoId ? "Categoría actualizada" : "Categoría creada");
      limpiarFormulario();
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const editar = (c: Categoria) => {
    setEditandoId(c.id);
    setNombre(c.nombre);
    setIcono(c.icono ?? "");
    setDescripcion(c.descripcion ?? "");
  };

  const alternarActiva = async (c: Categoria) => {
    if (c.activo) {
      const ok = await confirmar({
        titulo: "Desactivar categoría",
        mensaje: `¿Desactivar "${c.nombre}"? Dejará de ofrecerse en el buscador, pero los ${c._count.servicios} servicios ya clasificados la conservan.`,
        textoConfirmar: "Desactivar",
        peligro: true,
      });
      if (!ok) return;
    }
    setProcesando(c.id);
    try {
      const res = await fetch(`/api/categorias/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !c.activo }),
      });
      if (res.ok) {
        toast.success(c.activo ? "Categoría desactivada" : "Categoría activada");
        await cargar();
      } else {
        toast.error("No se pudo actualizar la categoría");
      }
    } finally {
      setProcesando(null);
    }
  };

  if (cargando) return <Cargando texto="Cargando categorías…" />;

  return (
    <div className="space-y-6">
      {/* Alta / edición */}
      <form onSubmit={guardar} className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {editandoId ? "Editar categoría" : "Nueva categoría"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">Icono</label>
            <input
              value={icono}
              onChange={(e) => setIcono(e.target.value)}
              placeholder="📐"
              maxLength={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Matemáticas"
              required
              minLength={2}
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">Descripción (opcional)</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Breve descripción del área"
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <Button type="submit" cargando={guardando}>
            {editandoId ? "Guardar cambios" : "Crear categoría"}
          </Button>
          {editandoId && (
            <Button type="button" variante="ghost" onClick={limpiarFormulario}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {/* Listado */}
      {categorias.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500">Aún no hay categorías.</p>
          <p className="text-sm text-gray-400 mt-1">
            Crea la primera para que los profesores puedan clasificar sus clases.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {categorias.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <span className="text-2xl w-8 text-center flex-shrink-0" aria-hidden="true">
                {c.icono || "📚"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{c.nombre}</span>
                  {!c.activo && (
                    <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                      Desactivada
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {c._count.servicios} servicio{c._count.servicios !== 1 ? "s" : ""}
                  {c.descripcion ? ` · ${c.descripcion}` : ""}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variante="secondary" tamano="sm" onClick={() => editar(c)}>
                  Editar
                </Button>
                <Button
                  variante={c.activo ? "danger" : "secondary"}
                  tamano="sm"
                  cargando={procesando === c.id}
                  onClick={() => alternarActiva(c)}
                >
                  {c.activo ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
