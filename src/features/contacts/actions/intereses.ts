"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "../../../../app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type ActionResult = { success: true } | { success: false; error: string };

export async function addInterest(
  contactoId: string,
  inmuebleId: string,
): Promise<ActionResult> {
  let contactoDecimal: Prisma.Decimal;
  let inmuebleDecimal: Prisma.Decimal;

  try {
    contactoDecimal = new Prisma.Decimal(contactoId);
    inmuebleDecimal = new Prisma.Decimal(inmuebleId);
  } catch {
    return { success: false, error: "IDs inválidos." };
  }

  try {
    await prisma.intereses.create({
      data: {
        contacto_id: contactoDecimal,
        inmueble_id: inmuebleDecimal,
      },
    });

    revalidatePath(`/contactos/${contactoId}`);
    return { success: true };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Este inmueble ya está en la lista de intereses." };
    }
    return { success: false, error: "No se pudo agregar el interés." };
  }
}

export async function removeInterest(
  interestId: string,
  contactoId: string,
): Promise<ActionResult> {
  let id: bigint;

  try {
    id = BigInt(interestId);
  } catch {
    return { success: false, error: "ID de interés inválido." };
  }

  try {
    await prisma.intereses.delete({
      where: { id },
    });

    revalidatePath(`/contactos/${contactoId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el interés." };
  }
}
