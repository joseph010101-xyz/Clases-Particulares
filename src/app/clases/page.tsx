// =============================================
// ClasesYa - Página: Lista de Clases/Servicios
// =============================================

"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ClaseCard from "@/components/clases/ClaseCard";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { FadeIn } from "@/components/ui/Motion";
import { SIMBOLO_MONEDA } from "@/lib/dominio/moneda";

interface Servicio {
  id: string;
  materia: string;
  descripcion: string | null;
  precioHora: number;
  modalidad: string;
  nivel: string;
  duracionMin: number;
  calificacionPromedio: number | null;
  totalResenas: number;
  categoria?: { id: string; nombre: string; icono: string | null } | null;
  profesor: {
    id: string;
    nombre: string;
    foto: string | null;
    verificado?: boolean;
  };
}

export default function ClasesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <ClasesContent />
    </Suspense>
  );
}

function ClasesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);

  // Filtros
  const [materia, setMateria] = useState(searchParams.get("materia") || "");
  const [modalidad, setModalidad] = useState(searchParams.get("modalidad") || "");
  const [nivel, setNivel] = useState(searchParams.get("nivel") || "");
  const [precioMin, setPrecioMin] = useState(searchParams.get("precioMin") || "");
  const [precioMax, setPrecioMax] = useState(searchParams.get("precioMax") || "");
  const [categoriaId, setCategoriaId] = useState(searchParams.get("categoriaId") || "");
  const [orden, setOrden] = useState(searchParams.get("orden") || "recientes");
  const [categorias, setCategorias] = useState<{ id: string; nombre: string; icono: string | null }[]>([]);

  // Catálogo de categorías para el filtro
  useEffect(() => {
    fetch("/api/categorias")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.categorias) setCategorias(d.categorias);
      })
      .catch(() => {});
  }, []);

  const fetchServicios = useCallback(async (pagina: number) => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (materia) params.set("materia", materia);
      if (modalidad) params.set("modalidad", modalidad);
      if (nivel) params.set("nivel", nivel);
      if (precioMin) params.set("precioMin", precioMin);
      if (precioMax) params.set("precioMax", precioMax);
      if (categoriaId) params.set("categoriaId", categoriaId);
      if (orden && orden !== "recientes") params.set("orden", orden);
      params.set("pagina", String(pagina));
      params.set("limite", "12");

      const res = await fetch(`/api/clases?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setServicios(data.servicios);
        setTotalPaginas(data.paginacion.totalPaginas);
        setPaginaActual(data.paginacion.pagina);
      }
    } catch {
      // Error silencioso
    } finally {
      setCargando(false);
    }
  }, [materia, modalidad, nivel, precioMin, precioMax, categoriaId, orden]);

  useEffect(() => {
    fetchServicios(1);
  }, [fetchServicios]);

  const handleBuscar = () => {
    const params = new URLSearchParams();
    if (materia) params.set("materia", materia);
    if (modalidad) params.set("modalidad", modalidad);
    if (nivel) params.set("nivel", nivel);
    if (precioMin) params.set("precioMin", precioMin);
    if (precioMax) params.set("precioMax", precioMax);
    if (categoriaId) params.set("categoriaId", categoriaId);
    if (orden && orden !== "recientes") params.set("orden", orden);
    router.push(`/clases?${params.toString()}`);
    fetchServicios(1);
  };

  const limpiarFiltros = () => {
    setMateria("");
    setModalidad("");
    setNivel("");
    setPrecioMin("");
    setPrecioMax("");
    setCategoriaId("");
    setOrden("recientes");
    router.push("/clases");
  };

  const categoriaActiva = categorias.find((c) => c.id === categoriaId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clases disponibles</h1>
        <p className="mt-2 text-gray-600">
          {categoriaActiva
            ? `Explorando ${categoriaActiva.nombre}`
            : "Encuentra la clase particular perfecta para ti"}
        </p>
      </div>

      {/* Categorías: acceso rápido por área de estudio */}
      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategoriaId("")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              categoriaId === ""
                ? "bg-primario text-white border-transparent"
                : "bg-superficie text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                categoriaId === c.id
                  ? "bg-primario text-white border-transparent"
                  : "bg-superficie text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {c.icono ? `${c.icono} ` : ""}
              {c.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <Select
              valor={orden}
              onChange={setOrden}
              ariaLabel="Ordenar por"
              opciones={[
                { valor: "recientes", etiqueta: "Más recientes" },
                { valor: "precioAsc", etiqueta: "Precio: menor a mayor" },
                { valor: "precioDesc", etiqueta: "Precio: mayor a menor" },
                { valor: "calificacion", etiqueta: "Mejor valorados" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
            <input
              type="text"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="Ej: Matemáticas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
            <Select
              valor={modalidad}
              onChange={setModalidad}
              placeholder="Todas"
              ariaLabel="Modalidad"
              opciones={[
                { valor: "", etiqueta: "Todas" },
                { valor: "PRESENCIAL", etiqueta: "Presencial" },
                { valor: "VIRTUAL", etiqueta: "Virtual" },
                { valor: "AMBOS", etiqueta: "Ambas" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
            <Select
              valor={nivel}
              onChange={setNivel}
              placeholder="Todos"
              ariaLabel="Nivel"
              opciones={[
                { valor: "", etiqueta: "Todos" },
                { valor: "PRIMARIA", etiqueta: "Primaria" },
                { valor: "SECUNDARIA", etiqueta: "Secundaria" },
                { valor: "BACHILLERATO", etiqueta: "Bachillerato" },
                { valor: "UNIVERSIDAD", etiqueta: "Universidad" },
                { valor: "ADULTOS", etiqueta: "Adultos" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio mín. ({SIMBOLO_MONEDA})
            </label>
            <input
              type="number"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio máx. ({SIMBOLO_MONEDA})
            </label>
            <input
              type="number"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              placeholder="Sin límite"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={handleBuscar}>Buscar</Button>
          <Button variante="ghost" onClick={limpiarFiltros}>Limpiar filtros</Button>
        </div>
      </div>

      {/* Resultados */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
          ))}
        </div>
      ) : servicios.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No se encontraron clases con esos filtros.</p>
          <Button variante="ghost" onClick={limpiarFiltros} className="mt-4">
            Ver todas las clases
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio, i) => (
              <FadeIn key={servicio.id} delay={Math.min(i * 0.05, 0.3)} className="h-full">
                <ClaseCard
                  id={servicio.id}
                  materia={servicio.materia}
                  descripcion={servicio.descripcion || ""}
                  precioHora={servicio.precioHora}
                  modalidad={servicio.modalidad}
                  nivel={servicio.nivel}
                  duracionMin={servicio.duracionMin}
                  calificacionPromedio={servicio.calificacionPromedio}
                  totalResenas={servicio.totalResenas}
                  categoria={servicio.categoria}
                  profesor={servicio.profesor}
                />
              </FadeIn>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variante="ghost"
                disabled={paginaActual <= 1}
                onClick={() => fetchServicios(paginaActual - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                variante="ghost"
                disabled={paginaActual >= totalPaginas}
                onClick={() => fetchServicios(paginaActual + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
