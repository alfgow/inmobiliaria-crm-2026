"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function deleteReginaContexto(
  waId: string,
): Promise<{ success?: boolean; error?: string }> {
  const trimmedWaId = waId.trim();

  if (!trimmedWaId) {
    return { error: "WA ID inválido." };
  }

  try {
    await prisma.regina_contextos.delete({
      where: {
        wa_id: trimmedWaId,
      },
    });

    revalidatePath("/regina-contextos");

    return { success: true };
  } catch (error) {
    console.error("deleteReginaContexto error:", error);
    return { error: "Error al eliminar el contexto." };
  }
}
