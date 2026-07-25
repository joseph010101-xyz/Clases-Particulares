// =============================================
// ClasesYa - Componente: ProfesorForm
// Formulario para crear/editar servicios
// =============================================

"use client";

import { useState, FormEvent } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

interface ProfesorFormProps {
  datosIniciales?: {
    materia: string;
    descripcion: string;
    precioHora: number;
    modalidad: string;
    nivel: string;
    duracionMin: number;
  };
  onSubmit: (datos: {
    materia: string;
    descripcion: string;
    precioHora: number;
    modalidad: string;
    nivel: string;
    duracionMin: number;
  }) => Promise<void>;
  cargando?: boolean;
}

export default function ProfesorForm({ datosIniciales, onSubmit, cargando }: ProfesorFormProps) {
  const [materia, setMateria] = useState(datosIniciales?.materia || "");
  const [descripcion, setDescripcion] = useState(datosIniciales?.descripcion || "");
  const [precioHora, setPrecioHora] = useState(datosIniciales?.precioHora || 0);
  const [modalidad, setModalidad] = useState(datosIniciales?.modalidad || "VIRTUAL");
  const [nivel, setNivel] = useState(datosIniciales?.nivel || "");
  const [duracionMin, setDuracionMin] = useState(datosIniciales?.duracionMin || 60);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({ materia, descripcion, precioHora, modalidad, nivel, duracionMin });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
        <input
          type="text"
          value={materia}
          onChange={(e) => setMateria(e.target.value)}
          placeholder="Ej: Matemáticas, Python, Inglés"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe tu servicio de enseñanza, metodología, etc."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio por hora (€) *</label>
          <input
            type="number"
            value={precioHora}
            onChange={(e) => setPrecioHora(Number(e.target.value))}
            min={1}
            step={0.5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
          <Select
            valor={String(duracionMin)}
            onChange={(v) => setDuracionMin(Number(v))}
            ariaLabel="Duración"
            opciones={[
              { valor: "30", etiqueta: "30 min" },
              { valor: "45", etiqueta: "45 min" },
              { valor: "60", etiqueta: "1 hora" },
              { valor: "90", etiqueta: "1.5 horas" },
              { valor: "120", etiqueta: "2 horas" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad *</label>
          <Select
            valor={modalidad}
            onChange={setModalidad}
            ariaLabel="Modalidad"
            opciones={[
              { valor: "VIRTUAL", etiqueta: "Virtual" },
              { valor: "PRESENCIAL", etiqueta: "Presencial" },
              { valor: "AMBOS", etiqueta: "Ambos" },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
          <input
            type="text"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            placeholder="Ej: Primaria, Universitario"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <Button type="submit" cargando={cargando} className="w-full">
        {datosIniciales ? "Guardar cambios" : "Crear servicio"}
      </Button>
    </form>
  );
}
