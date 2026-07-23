// =============================================
// ClasesYa - Página: Panel de administración
// Moderación de profesores (verificación y activación). Solo rol ADMIN.
// =============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import BadgeVerificado from "@/components/ui/BadgeVerificado";

interface ProfesorAdmin {
  id: string;
  nombre: string;
  email: string;
  ubicacion: string | null;
  bio: string | null;
  activo: boolean;
  verificado: boolean;
  createdAt: string;
  _count: { servicios: number };
}

type Filtro = "todos" | "pendientes" | "verificados";

export default function AdminPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [profesores, setProfesores] = useState<ProfesorAdmin[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async (f: Filtro) => {
    const estado = f === "todos" ? "" : `?estado=${f}`;
    const res = await fetch(`/api/admin/profesores${estado}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProfesores(data.profesores ?? []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const me = await meRes.json();
      if (me.usuario.rol !== "ADMIN") {
        router.push("/");
        return;
      }
      setAutorizado(true);
      await cargar("pendientes");
      setCargando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarFiltro = async (f: Filtro) => {
    setFiltro(f);
    await cargar(f);
  };

  const moderar = async (id: string, cambios: { verificado?: boolean; activo?: boolean }) => {
    setProcesando(id);
    try {
      const res = await fetch(`/api/admin/profesores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      if (res.ok) await cargar(filtro);
    } finally {
      setProcesando(null);
    }
  };

  if (cargando) {
    return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">Cargando…</div>;
  }
  if (!autorizado) return null;

  const filtros: { clave: Filtro; etiqueta: string }[] = [
    { clave: "pendientes", etiqueta: "Pendientes" },
    { clave: "verificados", etiqueta: "Verificados" },
    { clave: "todos", etiqueta: "Todos" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
      <p className="text-gray-600 mt-1 mb-6">Verifica a los profesores tras revisar su perfil.</p>

      <div className="flex gap-2 mb-6">
        {filtros.map((f) => (
          <button
            key={f.clave}
            onClick={() => cambiarFiltro(f.clave)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f.clave ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {profesores.length === 0 ? (
        <p className="text-gray-500">No hay profesores en esta categoría.</p>
      ) : (
        <div className="space-y-3">
          {profesores.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/profesores/${p.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                    {p.nombre}
                  </Link>
                  {p.verificado && <BadgeVerificado />}
                  {!p.activo && (
                    <span className="text-xs font-medium bg-red-50 text-red-600 rounded-full px-2 py-0.5">
                      Desactivado
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{p.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {p._count.servicios} servicio{p._count.servicios !== 1 ? "s" : ""}
                  {p.ubicacion ? ` · ${p.ubicacion}` : ""} · Registrado el{" "}
                  {new Date(p.createdAt).toLocaleDateString("es-ES")}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {p.verificado ? (
                  <Button
                    variante="secondary"
                    tamano="sm"
                    cargando={procesando === p.id}
                    onClick={() => moderar(p.id, { verificado: false })}
                  >
                    Quitar verificación
                  </Button>
                ) : (
                  <Button
                    tamano="sm"
                    cargando={procesando === p.id}
                    onClick={() => moderar(p.id, { verificado: true })}
                  >
                    Verificar
                  </Button>
                )}
                <Button
                  variante={p.activo ? "danger" : "secondary"}
                  tamano="sm"
                  cargando={procesando === p.id}
                  onClick={() => moderar(p.id, { activo: !p.activo })}
                >
                  {p.activo ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
