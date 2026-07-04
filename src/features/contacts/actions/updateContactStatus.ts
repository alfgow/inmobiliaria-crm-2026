"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  type ContactStatus,
  isContactStatus,
} from "@/features/contacts/types/contact-status";
import { getPrismaErrorCode } from "@/features/contacts/services/contact-api.service";

type UpdateContactStatusResult =
  | { success: true }
  | { success: false; error: string };

export async function updateContactStatus(
  contactId: string,
  estado: string,
): Promise<UpdateContactStatusResult> {
  if (!/^[1-9]\d*$/.test(contactId)) {
    return { success: false, error: "ID de contacto inválido." };
  }

  const normalizedStatus = estado.trim().toLowerCase();

  if (!isContactStatus(normalizedStatus)) {
    return { success: false, error: "El estado seleccionado no es válido." };
  }

  try {
    await prisma.contactos.update({
      where: { id: BigInt(contactId) },
      data: {
        estado: normalizedStatus as ContactStatus,
        updated_at: new Date(),
      },
    });

    revalidatePath(`/contactos/${contactId}`);
    revalidatePath("/contactos");

    return { success: true };
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2025") {
      return { success: false, error: "Contacto no encontrado." };
    }

    console.error("updateContactStatus error:", error);
    return { success: false, error: "No se pudo actualizar el estado." };
  }
}
