// =============================================
// ClasesYa - Componente: Footer
// Adapta sus accesos rápidos al rol con el que navega el usuario e incluye el
// selector de apariencia.
// =============================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SelectorTema from "@/components/tema/SelectorTema";
import { identidadDe, ENLACES_PUBLICOS, type IdentidadRol } from "@/lib/rolesUI";

export default function Footer() {
  const pathname = usePathname();
  const [identidad, setIdentidad] = useState<IdentidadRol | null>(null);

  useEffect(() => {
    let activo = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activo) setIdentidad(identidadDe(data?.usuario?.rol));
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [pathname]);

  const enlaces = identidad?.enlaces ?? ENLACES_PUBLICOS;

  return (
    <footer className="bg-gray-100 border-t border-gray-200 text-gray-600 mt-auto">
      {/* Franja del color del rol activo */}
      <div
        className="h-1 w-full"
        style={{
          background: identidad
            ? identidad.color
            : "linear-gradient(90deg, var(--c-primary), var(--i-500))",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marca */}
          <div className="md:col-span-2">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ClasesYa
            </span>
            <p className="mt-3 text-sm text-gray-500 max-w-md">
              La plataforma que conecta estudiantes con los mejores profesores particulares.
              Encuentra clases de cualquier materia, en cualquier modalidad.
            </p>

            {identidad && (
              <p className="mt-4 text-sm text-gray-500">
                Navegando como{" "}
                <span
                  className="inline-block text-[11px] font-semibold text-white px-2 py-0.5 rounded-full align-middle"
                  style={{ backgroundColor: identidad.color }}
                >
                  {identidad.etiqueta}
                </span>
              </p>
            )}
          </div>

          {/* Accesos según el rol */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              {identidad ? "Tu espacio" : "Plataforma"}
            </h3>
            <ul className="space-y-2">
              {enlaces.map((e, i) => (
                <li key={`${e.href}-${i}`}>
                  <Link href={e.href} className="text-sm hover:text-gray-900 transition-colors">
                    {e.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte y apariencia */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Soporte
            </h3>
            <p className="text-sm mb-5">contacto@clasesya.com</p>

            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Apariencia
            </h3>
            <SelectorTema compacto />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ClasesYa. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
