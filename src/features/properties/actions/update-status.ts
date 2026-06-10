"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function updatePropertyStatus(
  propertyId: string,
  estatusId: number,
  slug: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await prisma.inmuebles.update({
      where: { id: BigInt(propertyId) },
      data: { estatus_id: estatusId, updated_at: new Date() },
    });
    revalidatePath(`/inmuebles/${slug}`);
    revalidatePath("/inmuebles");
    return { success: true };
  } catch (err) {
    console.error("updatePropertyStatus error:", err);
    return { error: "No se pudo actualizar el estatus" };
  }
}
