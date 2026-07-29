// =============================================
// ClasesYa - Componente: Avatar
// Muestra la foto del usuario y, si no tiene, su inicial sobre el color del
// rol. Unifica la representación de identidad en toda la aplicación.
// =============================================

/* eslint-disable @next/next/no-img-element */

interface AvatarProps {
  nombre: string;
  foto?: string | null;
  /** Color de fondo cuando no hay foto (normalmente el del rol) */
  color?: string;
  /** Diámetro en píxeles */
  tamano?: number;
  className?: string;
}

export default function Avatar({
  nombre,
  foto,
  color = "var(--c-primary)",
  tamano = 40,
  className = "",
}: AvatarProps) {
  const estilo = { width: tamano, height: tamano };

  if (foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        style={estilo}
        className={`rounded-full object-cover flex-shrink-0 bg-gray-100 ${className}`}
      />
    );
  }

  return (
    <span
      style={{ ...estilo, backgroundColor: color, fontSize: Math.max(11, tamano * 0.4) }}
      className={`rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      {nombre.charAt(0).toUpperCase()}
    </span>
  );
}
