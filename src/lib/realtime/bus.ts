// =============================================
// ClasesYa - Realtime: bus de eventos en memoria
// Pub/sub por usuario para empujar eventos (mensajes nuevos, lecturas) a las
// conexiones SSE abiertas. Vive en el proceso Node: válido para una sola
// instancia (el caso de Railway Hobby). Para escalar a varias instancias habría
// que reemplazarlo por Postgres LISTEN/NOTIFY o Redis pub/sub.
// =============================================

export type ManejadorRealtime = (evento: string, datos: unknown) => void;

export class BusRealtime {
  private canales = new Map<string, Set<ManejadorRealtime>>();

  // Suscribe un manejador al canal de un usuario. Devuelve la función para
  // cancelar la suscripción.
  suscribir(usuarioId: string, manejador: ManejadorRealtime): () => void {
    let set = this.canales.get(usuarioId);
    if (!set) {
      set = new Set();
      this.canales.set(usuarioId, set);
    }
    set.add(manejador);
    return () => this.desuscribir(usuarioId, manejador);
  }

  desuscribir(usuarioId: string, manejador: ManejadorRealtime): void {
    const set = this.canales.get(usuarioId);
    if (!set) return;
    set.delete(manejador);
    if (set.size === 0) this.canales.delete(usuarioId);
  }

  // Publica un evento a todas las conexiones abiertas de un usuario.
  publicar(usuarioId: string, evento: string, datos: unknown): void {
    const set = this.canales.get(usuarioId);
    if (!set) return;
    set.forEach((manejador) => {
      try {
        manejador(evento, datos);
      } catch {
        // Un manejador que falle no debe impedir notificar al resto.
      }
    });
  }

  contarSuscriptores(usuarioId: string): number {
    return this.canales.get(usuarioId)?.size ?? 0;
  }
}

// Singleton anclado a globalThis para sobrevivir al hot-reload de desarrollo y a
// una posible duplicación de módulos (mismo patrón que el cliente de Prisma).
const global = globalThis as unknown as { __busRealtime?: BusRealtime };
export const busRealtime = global.__busRealtime ?? (global.__busRealtime = new BusRealtime());
