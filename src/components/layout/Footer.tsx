// =============================================
// ClasesYa - Componente: Footer
// =============================================

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="md:col-span-2">
            <span className="text-2xl font-bold text-white">ClasesYa</span>
            <p className="mt-3 text-sm text-gray-400 max-w-md">
              La plataforma que conecta estudiantes con los mejores profesores particulares.
              Encuentra clases de cualquier materia, en cualquier modalidad.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Plataforma
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/clases" className="text-sm hover:text-white transition-colors">
                  Buscar clases
                </Link>
              </li>
              <li>
                <Link href="/profesores" className="text-sm hover:text-white transition-colors">
                  Profesores
                </Link>
              </li>
              <li>
                <Link href="/registro" className="text-sm hover:text-white transition-colors">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Soporte
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm">contacto@clasesya.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ClasesYa. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
