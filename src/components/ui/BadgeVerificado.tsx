// =============================================
// ClasesYa - Componente: Insignia de profesor verificado
// =============================================

interface BadgeVerificadoProps {
  // Muestra solo el ícono (para tarjetas compactas) o ícono + texto.
  soloIcono?: boolean;
  className?: string;
}

export default function BadgeVerificado({ soloIcono = false, className = "" }: BadgeVerificadoProps) {
  const icono = (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  if (soloIcono) {
    return (
      <span
        title="Profesor verificado"
        className={`inline-flex text-blue-600 ${className}`}
        aria-label="Profesor verificado"
      >
        {icono}
      </span>
    );
  }

  return (
    <span
      title="Profesor verificado por ClasesYa"
      className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 ${className}`}
    >
      {icono}
      Verificado
    </span>
  );
}
