"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const BOT_STATUS_VALUES = ["activo", "pausado", "finalizado"] as const;
export type BotStatus = (typeof BOT_STATUS_VALUES)[number];

export function isBotStatus(value: unknown): value is BotStatus {
  return (
    typeof value === "string" &&
    (BOT_STATUS_VALUES as readonly string[]).includes(value)
  );
}

export async function updateBotStatus(
  conversacionId: string,
  nuevoEstado: string,
  contactoId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!isBotStatus(nuevoEstado)) {
    return { success: false, error: "Estado inválido." };
  }

  let id: bigint;
  try {
    id = BigInt(conversacionId);
  } catch {
    return { success: false, error: "ID de conversación inválido." };
  }

  try {
    await prisma.contacto_conversaciones.update({
      where: { id },
      data: { estado_bot: nuevoEstado, updated_at: new Date() },
    });

    revalidatePath(`/contactos/${contactoId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el estado del bot." };
  }
}
