// =============================================
// ClasesYa - Componente: foto de perfil
// Permite subir, reemplazar y quitar la foto. Una foto real aumenta la
// confianza entre estudiantes y profesores.
// =============================================

"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useConfirm } from "@/components/ui/ConfirmProvider";

export default function FotoPerfil({
  nombre,
  foto,
  color,
  onCambio,
}: {
  nombre: string;
  foto: string | null;
  color?: string;
  onCambio: (nuevaFoto: string | null) => void;
}) {
  const confirmar = useConfirm();
  const entrada = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);

  const subir = async (archivo: File) => {
    setProcesando(true);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const res = await fetch("/api/perfil/foto", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo subir la foto");
        return;
      }
      toast.success("Foto actualizada");
      onCambio(d.foto ?? null);
    } finally {
      setProcesando(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const quitar = async () => {
    const ok = await confirmar({
      titulo: "Quitar foto",
      mensaje: "¿Seguro que quieres quitar tu foto de perfil?",
      textoConfirmar: "Quitar",
      peligro: true,
    });
    if (!ok) return;
    setProcesando(true);
    try {
      const res = await fetch("/api/perfil/foto", { method: "DELETE" });
      if (res.ok) {
        toast.success("Foto eliminada");
        onCambio(null);
      } else {
        toast.error("No se pudo quitar la foto");
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar nombre={nombre} foto={foto} color={color} tamano={80} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">Foto de perfil</p>
        <p className="text-xs text-gray-500 mb-2">
          Una foto real genera confianza. JPG, PNG, WEBP o GIF, hasta 5 MB.
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
            }}
          />
          <Button
            type="button"
            variante="secondary"
            tamano="sm"
            cargando={procesando}
            onClick={() => entrada.current?.click()}
          >
            {foto ? "Cambiar foto" : "Subir foto"}
          </Button>
          {foto && (
            <Button type="button" variante="ghost" tamano="sm" disabled={procesando} onClick={quitar}>
              Quitar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
