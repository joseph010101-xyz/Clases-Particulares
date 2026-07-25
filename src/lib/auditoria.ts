// =============================================
// ClasesYa - Auditoría
// Punto único para registrar acciones administrativas sensibles.
// Nunca interrumpe la operación principal: si el registro falla, se anota en
// consola pero la acción del administrador se completa igualmente.
// =============================================

import type { AccionAuditoria } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TokenPayload } from "@/lib/auth";

export async function auditar(params: {
  actor: TokenPayload;
  accion: AccionAuditoria;
  objetivoId?: string | null;
  objetivoNombre?: string | null;
  detalle?: string | null;
}): Promise<void> {
  try {
    await prisma.registroAuditoria.create({
      data: {
        actorId: params.actor.userId,
        actorNombre: params.actor.nombre,
        accion: params.accion,
        objetivoId: params.objetivoId ?? null,
        objetivoNombre: params.objetivoNombre ?? null,
        detalle: params.detalle ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar la auditoría:", error);
  }
}

// Los textos legibles de cada acción viven en `auditoriaUI.ts`, sin dependencia
// de Prisma, para poder usarlos también desde componentes de cliente.
