// =============================================
// ClasesYa - Página: Dashboard Estudiante
// =============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ReservaCard from "@/components/reservas/ReservaCard";
import Modal from "@/components/ui/Modal";
import StarRating from "@/components/ui/StarRating";

interface Reserva {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  notas: string | null;
  servicio: { materia: string; precioHora: number; modalidad: string; profesor: { nombre: string } };
  estudiante: { nombre: string };
  resena?: { calificacion: number } | null;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export default function EstudianteDashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"reservas" | "perfil">("reservas");

  // Estado para reseña
  const [reservaResena, setReservaResena] = useState<string | null>(null);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);

  // Perfil state
  const [perfilForm, setPerfilForm] = useState({ nombre: "", telefono: "", bio: "", ubicacion: "", foto: "" });
  const [perfilGuardando, setPerfilGuardando] = useState(false);
  const [perfilMensaje, setPerfilMensaje] = useState("");
  const [perfilEmail, setPerfilEmail] = useState("");

  const fetchDatos = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      if (meData.usuario.rol !== "ESTUDIANTE") {
        router.push("/");
        return;
      }
      setUsuario(meData.usuario);

      const reservasRes = await fetch("/api/reservas");
      if (reservasRes.ok) {
        const reservasData = await reservasRes.json();
        setReservas(reservasData.reservas || []);
      }

      const perfilRes = await fetch("/api/perfil");
      if (perfilRes.ok) {
        const perfilData = await perfilRes.json();
        setPerfilEmail(perfilData.usuario.email || "");
        setPerfilForm({
          nombre: perfilData.usuario.nombre || "",
          telefono: perfilData.usuario.telefono || "",
          bio: perfilData.usuario.bio || "",
          ubicacion: perfilData.usuario.ubicacion || "",
          foto: perfilData.usuario.foto || "",
        });
      }
    } catch {
      router.push("/login");
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  const handleCambiarEstado = async (id: string, estado: string) => {
    const res = await fetch(`/api/reservas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) fetchDatos();
  };

  const handleEnviarResena = async () => {
    if (!reservaResena) return;
    setEnviandoResena(true);

    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservaId: reservaResena,
          calificacion,
          comentario: comentario || undefined,
        }),
      });

      if (res.ok) {
        setReservaResena(null);
        setCalificacion(5);
        setComentario("");
        fetchDatos();
      }
    } catch {
      // Error silencioso
    } finally {
      setEnviandoResena(false);
    }
  };

  const handleGuardarPerfil = async () => {
    setPerfilGuardando(true);
    setPerfilMensaje("");
    const res = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: perfilForm.nombre || undefined,
        telefono: perfilForm.telefono || null,
        bio: perfilForm.bio || null,
        ubicacion: perfilForm.ubicacion || null,
        foto: perfilForm.foto || null,
      }),
    });
    if (res.ok) {
      setPerfilMensaje("Perfil actualizado correctamente");
      fetchDatos();
    } else {
      const data = await res.json();
      setPerfilMensaje(data.error || "Error al actualizar");
    }
    setPerfilGuardando(false);
  };

  if (cargando) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const reservasPendientes = reservas.filter(r => r.estado === "PENDIENTE" || r.estado === "CONFIRMADA");
  const reservasCompletadas = reservas.filter(r => r.estado === "COMPLETADA");
  const reservasCanceladas = reservas.filter(r => r.estado === "CANCELADA");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hola, {usuario?.nombre} 👋
        </h1>
        <p className="mt-1 text-gray-600">Panel de estudiante</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Clases activas</p>
          <p className="text-2xl font-bold text-blue-600">{reservasPendientes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Clases completadas</p>
          <p className="text-2xl font-bold text-green-600">{reservasCompletadas.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total reservas</p>
          <p className="text-2xl font-bold text-gray-900">{reservas.length}</p>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-3 mb-8">
        <Link href="/clases">
          <Button>Buscar clases</Button>
        </Link>
        <Link href="/profesores">
          <Button variante="secondary">Explorar profesores</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab("reservas")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "reservas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Mis reservas
        </button>
        <button
          onClick={() => setTab("perfil")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "perfil" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Mi perfil
        </button>
      </div>

      {tab === "reservas" && (
      <>
      {/* Reservas */}
      <div className="space-y-8">
        {/* Activas */}
        {reservasPendientes.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Reservas activas ({reservasPendientes.length})
            </h2>
            <div className="space-y-3">
              {reservasPendientes.map((reserva) => (
                <ReservaCard
                  key={reserva.id}
                  id={reserva.id}
                  fecha={reserva.fecha}
                  horaInicio={reserva.horaInicio}
                  horaFin={reserva.horaFin}
                  estado={reserva.estado}
                  notas={reserva.notas}
                  materia={reserva.servicio.materia}
                  profesorNombre={reserva.servicio.profesor.nombre}
                  estudianteNombre={reserva.estudiante?.nombre || ""}
                  precioHora={reserva.servicio.precioHora}
                  modalidad={reserva.servicio.modalidad}
                  tieneResena={!!reserva.resena}
                  rolUsuario="ESTUDIANTE"
                  onCambiarEstado={handleCambiarEstado}
                  onResenar={
                    reserva.estado === "COMPLETADA" && !reserva.resena
                      ? () => setReservaResena(reserva.id)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Completadas */}
        {reservasCompletadas.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Completadas ({reservasCompletadas.length})
            </h2>
            <div className="space-y-3">
              {reservasCompletadas.map((reserva) => (
                <ReservaCard
                  key={reserva.id}
                  id={reserva.id}
                  fecha={reserva.fecha}
                  horaInicio={reserva.horaInicio}
                  horaFin={reserva.horaFin}
                  estado={reserva.estado}
                  notas={reserva.notas}
                  materia={reserva.servicio.materia}
                  profesorNombre={reserva.servicio.profesor.nombre}
                  estudianteNombre={reserva.estudiante?.nombre || ""}
                  precioHora={reserva.servicio.precioHora}
                  modalidad={reserva.servicio.modalidad}
                  tieneResena={!!reserva.resena}
                  rolUsuario="ESTUDIANTE"
                  onCambiarEstado={handleCambiarEstado}
                  onResenar={
                    !reserva.resena
                      ? () => setReservaResena(reserva.id)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Canceladas */}
        {reservasCanceladas.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Canceladas ({reservasCanceladas.length})
            </h2>
            <div className="space-y-3">
              {reservasCanceladas.map((reserva) => (
                <ReservaCard
                  key={reserva.id}
                  id={reserva.id}
                  fecha={reserva.fecha}
                  horaInicio={reserva.horaInicio}
                  horaFin={reserva.horaFin}
                  estado={reserva.estado}
                  notas={reserva.notas}
                  materia={reserva.servicio.materia}
                  profesorNombre={reserva.servicio.profesor.nombre}
                  estudianteNombre={reserva.estudiante?.nombre || ""}
                  precioHora={reserva.servicio.precioHora}
                  modalidad={reserva.servicio.modalidad}
                  tieneResena={!!reserva.resena}
                  rolUsuario="ESTUDIANTE"
                  onCambiarEstado={handleCambiarEstado}
                />
              ))}
            </div>
          </section>
        )}

        {reservas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 mb-4">Aún no tienes reservas. ¡Busca tu primera clase!</p>
            <Link href="/clases">
              <Button>Buscar clases</Button>
            </Link>
          </div>
        )}
      </div>
      </>
      )}

      {tab === "perfil" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar perfil</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={perfilForm.nombre}
                  onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={perfilEmail}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={perfilForm.telefono}
                  onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })}
                  placeholder="Ej: +34 612 345 678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={perfilForm.ubicacion}
                  onChange={(e) => setPerfilForm({ ...perfilForm, ubicacion: e.target.value })}
                  placeholder="Ej: Madrid, España"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de foto</label>
                <input
                  type="url"
                  value={perfilForm.foto}
                  onChange={(e) => setPerfilForm({ ...perfilForm, foto: e.target.value })}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleGuardarPerfil} cargando={perfilGuardando}>
                  Guardar cambios
                </Button>
                {perfilMensaje && (
                  <p className={`text-sm ${perfilMensaje.includes("Error") ? "text-red-500" : "text-green-600"}`}>
                    {perfilMensaje}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal reseña */}
      <Modal
        abierto={!!reservaResena}
        onCerrar={() => {
          setReservaResena(null);
          setCalificacion(5);
          setComentario("");
        }}
        titulo="Dejar reseña"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
            <StarRating valor={calificacion} onChange={setCalificacion} tamano="lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Cómo fue tu experiencia?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button onClick={handleEnviarResena} cargando={enviandoResena} className="w-full">
            Enviar reseña
          </Button>
        </div>
      </Modal>
    </div>
  );
}
