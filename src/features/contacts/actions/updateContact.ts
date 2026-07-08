"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  type ContactStatus,
  isContactStatus,
} from "@/features/contacts/types/contact-status";
import { findContactByNormalizedPhone } from "@/features/contacts/services/contact-api.service";
import { normalizePhoneNumber } from "@/features/contacts/services/contact-normalization";

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
  const nombreTrim = nombre.trim();
  const telefonoTrim = normalizePhoneNumber(telefono);
  const emailTrim = email.trim();
  const fuenteTrim = fuente.trim();

  if (!nombreTrim) {
    return { success: false, error: "El nombre es requerido." };
  }
  if (!telefonoTrim) {
    return { success: false, error: "El teléfono es requerido." };
  }
  if (telefonoTrim.length > 20) {
    return { success: false, error: "El teléfono no puede superar 20 dígitos." };
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
    const existingContact = await findContactByNormalizedPhone(telefonoTrim, contactId);

    if (existingContact) {
      return {
        success: false,
        error: "El número de teléfono ya está registrado en otro contacto.",
      };
    }

    await prisma.contactos.update({
      where: { id: contactId },
      data: {
        nombre: nombreTrim,
        telefono: telefonoTrim,
        email: emailTrim || null,
        estado: normalizedStatus as ContactStatus,
        fuente: fuenteTrim || null,
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
