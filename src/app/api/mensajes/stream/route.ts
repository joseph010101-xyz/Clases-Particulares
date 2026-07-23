// =============================================
// ClasesYa - API: Stream de mensajes en tiempo real (SSE)
// GET /api/mensajes/stream → conexión Server-Sent Events del usuario autenticado
// Empuja eventos "mensaje:nuevo" y "mensaje:leido" publicados en el bus.
// =============================================

import { NextRequest } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { busRealtime } from "@/lib/realtime/bus";

// SSE requiere el runtime de Node y una respuesta dinámica de larga duración.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const payload = await obtenerUsuarioActual();
  if (!payload) {
    return new Response("No autenticado", { status: 401 });
  }

  const encoder = new TextEncoder();
  const usuarioId = payload.userId;

  const stream = new ReadableStream({
    start(controller) {
      const escribir = (texto: string) => {
        try {
          controller.enqueue(encoder.encode(texto));
        } catch {
          // La conexión ya se cerró; se limpiará en 'abort'.
        }
      };

      // Comentario inicial para abrir el flujo de inmediato.
      escribir(": conectado\n\n");

      const manejador = (evento: string, datos: unknown) => {
        escribir(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`);
      };
      const cancelarSuscripcion = busRealtime.suscribir(usuarioId, manejador);

      // Latido periódico para mantener viva la conexión frente a proxies.
      const latido = setInterval(() => escribir(": ping\n\n"), 25000);

      const cerrar = () => {
        clearInterval(latido);
        cancelarSuscripcion();
        try {
          controller.close();
        } catch {
          // Ya estaba cerrado.
        }
      };

      request.signal.addEventListener("abort", cerrar);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Evita el buffering de proxies intermedios (hint tipo nginx).
      "X-Accel-Buffering": "no",
    },
  });
}
