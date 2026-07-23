// =============================================
// ClasesYa - Página principal (Home)
// =============================================

import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Aprende lo que quieras,{" "}
              <span className="text-blue-200">cuando quieras</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-2xl">
              Conectamos estudiantes con los mejores profesores particulares.
              Clases presenciales o virtuales, a tu ritmo y necesidad.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/clases"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Buscar clases
              </Link>
              <Link
                href="/registro"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Soy profesor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            ¿Cómo funciona?
          </h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            En tres simples pasos puedes encontrar al profesor perfecto
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                paso: "1",
                titulo: "Busca tu clase",
                descripcion: "Explora cientos de profesores y materias. Filtra por modalidad, precio y nivel.",
                icono: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                paso: "2",
                titulo: "Reserva tu horario",
                descripcion: "Elige la fecha y hora que mejor te convenga. El profesor confirmará tu reserva.",
                icono: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                paso: "3",
                titulo: "Aprende y califica",
                descripcion: "Toma tu clase y deja una reseña para ayudar a otros estudiantes.",
                icono: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.paso} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  {item.icono}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{item.titulo}</h3>
                <p className="mt-2 text-gray-600">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA para profesores */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">¿Eres profesor?</h2>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Publica tus servicios, llega a más estudiantes y gestiona tus reservas
            desde un solo lugar. Empieza gratis.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center mt-8 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Registrarme como profesor
          </Link>
        </div>
      </section>
    </>
  );
}
