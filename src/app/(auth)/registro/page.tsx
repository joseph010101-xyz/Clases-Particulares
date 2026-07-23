// =============================================
// ClasesYa - Página: Registro
// =============================================

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"PROFESOR" | "ESTUDIANTE">("ESTUDIANTE");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, rol }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }

      // Redirigir según el rol
      if (rol === "PROFESOR") {
        router.push("/profesores/dashboard");
      } else {
        router.push("/estudiantes/dashboard");
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="mt-2 text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Selector de rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Soy...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRol("ESTUDIANTE")}
                className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  rol === "ESTUDIANTE"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="block text-lg mb-1">🎓</span>
                Estudiante
              </button>
              <button
                type="button"
                onClick={() => setRol("PROFESOR")}
                className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  rol === "PROFESOR"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="block text-lg mb-1">👨‍🏫</span>
                Profesor
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <Button type="submit" cargando={cargando} className="w-full">
            Crear cuenta
          </Button>
        </form>
      </div>
    </div>
  );
}
