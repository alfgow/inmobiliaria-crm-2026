"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "../../../../app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function deleteContact(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  let contactId: bigint;
  let contactIdDecimal: Prisma.Decimal;

  try {
    contactId = BigInt(id);
    contactIdDecimal = new Prisma.Decimal(id);
  } catch {
    return { error: "ID de contacto inválido." };
  }

  try {
    await prisma.$transaction([
      prisma.intereses.deleteMany({ where: { contacto_id: contactIdDecimal } }),
      prisma.comentarios.deleteMany({ where: { contacto_id: contactIdDecimal } }),
      prisma.interacciones_ia.deleteMany({ where: { contacto_id: contactIdDecimal } }),
      prisma.contactos.delete({ where: { id: contactId } }),
    ]);

    revalidatePath("/contactos");
    revalidatePath(`/contactos/${id}`);

    return { success: true };
  } catch (err) {
    console.error("deleteContact error:", err);
    return { error: "Error al eliminar el contacto." };
  }
}
