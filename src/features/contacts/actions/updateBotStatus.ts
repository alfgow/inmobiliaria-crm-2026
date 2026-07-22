"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isBotStatus } from "@/features/contacts/types/bot-status";

export async function updateBotStatus(
  waId: string,
  nuevoEstado: string,
  contactoId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!isBotStatus(nuevoEstado)) {
    return { success: false, error: "Estado inválido." };
  }

  if (!waId) {
    return { success: false, error: "wa_id inválido." };
  }

  try {
    await prisma.regina_contextos.update({
      where: { wa_id: waId },
      data: { status: nuevoEstado, updated_at: new Date() },
    });

    revalidatePath(`/contactos/${contactoId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el estado del bot." };
  }
}
