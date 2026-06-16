"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "../../../../app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type ActionResult = { success: true } | { success: false; error: string };

export async function createComment(
  contactId: string,
  comentario: string,
): Promise<ActionResult> {
  const text = comentario.trim();

  if (!text) {
    return { success: false, error: "El comentario no puede estar vacío." };
  }

  if (text.length > 2000) {
    return { success: false, error: "El comentario no puede superar los 2000 caracteres." };
  }

  let contactoDecimal: Prisma.Decimal;

  try {
    contactoDecimal = new Prisma.Decimal(contactId);
  } catch {
    return { success: false, error: "ID de contacto inválido." };
  }

  try {
    await prisma.comentarios.create({
      data: {
        contacto_id: contactoDecimal,
        comentario: text,
      },
    });

    revalidatePath(`/contactos/${contactId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar el comentario." };
  }
}
