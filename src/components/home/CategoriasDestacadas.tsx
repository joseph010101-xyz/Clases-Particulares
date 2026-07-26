// =============================================
// ClasesYa - Categorías destacadas del home
// Punto de entrada rápido al catálogo por área de estudio.
// =============================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/Motion";

interface Categoria {
  id: string;
  nombre: string;
  icono: string | null;
  _count?: { servicios: number };
}

export default function CategoriasDestacadas() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    fetch("/api/categorias")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.categorias) setCategorias(d.categorias.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  // Sin categorías configuradas la sección no aparece
  if (categorias.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center text-gray-900">Explora por categoría</h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            Encuentra rápido el área que te interesa
          </p>
        </FadeIn>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categorias.map((c, i) => (
            <FadeIn key={c.id} delay={Math.min(i * 0.05, 0.3)} className="h-full">
              <Link
                href={`/clases?categoriaId=${c.id}`}
                className="h-full flex flex-col items-center justify-center text-center gap-2 bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all"
              >
                <span className="text-3xl" aria-hidden="true">
                  {c.icono || "📚"}
                </span>
                <span className="font-semibold text-gray-900">{c.nombre}</span>
                {typeof c._count?.servicios === "number" && (
                  <span className="text-xs text-gray-500">
                    {c._count.servicios} clase{c._count.servicios !== 1 ? "s" : ""}
                  </span>
                )}
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
