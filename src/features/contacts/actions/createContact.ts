"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "../../../../app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTACT_STATUS } from "@/features/contacts/types/contact-status";

type ActionResult = { success: false; error: string };

export async function createContact(
  nombre: string,
  telefono: string,
  email: string,
  inmuebleId: string,
  comentario: string,
): Promise<ActionResult> {
  const nombreTrim = nombre.trim();
  const telefonoTrim = telefono.trim();
  const emailTrim = email.trim();
  const comentarioTrim = comentario.trim();

  if (!nombreTrim) return { success: false, error: "El nombre es requerido." };
  if (!telefonoTrim) return { success: false, error: "El teléfono es requerido." };
  if (!inmuebleId) return { success: false, error: "Debes seleccionar una propiedad de interés." };

  let newContactId: bigint;

  try {
    const contact = await prisma.contactos.create({
      data: {
        nombre: nombreTrim,
        telefono: telefonoTrim,
        email: emailTrim || null,
        estado: DEFAULT_CONTACT_STATUS,
        fuente: "Web",
      },
      select: { id: true },
    });

    newContactId = contact.id;

    const contactoDecimal = new Prisma.Decimal(newContactId.toString());
    const inmuebleDecimal = new Prisma.Decimal(inmuebleId);

    await prisma.intereses.create({
      data: {
        contacto_id: contactoDecimal,
        inmueble_id: inmuebleDecimal,
      },
    });

    if (comentarioTrim) {
      await prisma.comentarios.create({
        data: {
          contacto_id: contactoDecimal,
          comentario: comentarioTrim,
        },
      });
    }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Ya existe un contacto registrado con ese teléfono." };
    }
    console.error("createContact error:", error);
    return { success: false, error: "No se pudo crear el contacto. Intenta de nuevo." };
  }

  revalidatePath("/contactos");
  redirect(`/contactos/${newContactId}`);
}
