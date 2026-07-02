"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  type ContactStatus,
  isContactStatus,
} from "@/features/contacts/types/contact-status";

type UpdateContactInput = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  fuente: string;
};

type UpdateContactResult =
  | { success: true }
  | { success: false; error: string };

export async function updateContact(
  input: UpdateContactInput,
): Promise<UpdateContactResult> {
  const { id, nombre, telefono, email, estado, fuente } = input;

  if (!nombre.trim()) {
    return { success: false, error: "El nombre es requerido." };
  }
  if (!telefono.trim()) {
    return { success: false, error: "El teléfono es requerido." };
  }

  const normalizedStatus = estado.trim().toLowerCase();

  if (!isContactStatus(normalizedStatus)) {
    return {
      success: false,
      error: "El estado seleccionado no es válido.",
    };
  }

  let contactId: bigint;
  try {
    contactId = BigInt(id);
  } catch {
    return { success: false, error: "ID de contacto inválido." };
  }

  try {
    await prisma.contactos.update({
      where: { id: contactId },
      data: {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || null,
        estado: normalizedStatus as ContactStatus,
        fuente: fuente.trim() || null,
        updated_at: new Date(),
      },
    });

    revalidatePath(`/contactos/${id}`);
    revalidatePath("/contactos");

    return { success: true };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        error: "El número de teléfono ya está registrado en otro contacto.",
      };
    }
    return { success: false, error: "Ocurrió un error al actualizar el contacto." };
  }
}
