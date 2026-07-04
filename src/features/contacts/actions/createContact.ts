"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONTACT_STATUS,
  type ContactStatus,
  isContactStatus,
} from "@/features/contacts/types/contact-status";
import {
  getPrismaErrorCode,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";

type ActionResult = { success: false; error: string };

function isPositiveId(value: string) {
  return /^[1-9]\d*$/.test(value);
}

export async function createContact(
  nombre: string,
  telefono: string,
  email: string,
  inmuebleId: string,
  comentario: string,
  estado = DEFAULT_CONTACT_STATUS,
): Promise<ActionResult> {
  const nombreTrim = nombre.trim();
  const telefonoTrim = telefono.trim();
  const emailTrim = email.trim();
  const comentarioTrim = comentario.trim();
  const inmuebleIdTrim = inmuebleId.trim();
  const normalizedStatus = estado.trim().toLowerCase();

  if (!nombreTrim) return { success: false, error: "El nombre es requerido." };
  if (!telefonoTrim) return { success: false, error: "El teléfono es requerido." };
  if (!inmuebleIdTrim) {
    return { success: false, error: "Debes seleccionar una propiedad de interés." };
  }
  if (nombreTrim.length > 100) {
    return { success: false, error: "El nombre no puede superar 100 caracteres." };
  }
  if (telefonoTrim.length > 20) {
    return { success: false, error: "El teléfono no puede superar 20 caracteres." };
  }
  if (emailTrim.length > 150) {
    return { success: false, error: "El correo no puede superar 150 caracteres." };
  }
  if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
    return { success: false, error: "El correo no tiene un formato válido." };
  }
  if (comentarioTrim.length > 2000) {
    return { success: false, error: "El comentario no puede superar 2000 caracteres." };
  }
  if (!isPositiveId(inmuebleIdTrim)) {
    return { success: false, error: "La propiedad seleccionada no es válida." };
  }
  if (!isContactStatus(normalizedStatus)) {
    return { success: false, error: "El estado seleccionado no es válido." };
  }

  let newContactId: bigint;

  try {
    const selectedProperty = await prisma.inmuebles.findFirst({
      where: {
        id: BigInt(inmuebleIdTrim),
        estatus_id: 1,
      },
      select: { id: true },
    });

    if (!selectedProperty) {
      return {
        success: false,
        error: "La propiedad seleccionada ya no existe o no está activa.",
      };
    }

    const contact = await prisma.$transaction(async (tx) => {
      const created = await tx.contactos.create({
        data: {
          nombre: nombreTrim,
          telefono: telefonoTrim,
          email: emailTrim || null,
          estado: normalizedStatus as ContactStatus,
          fuente: "Web",
        },
        select: { id: true },
      });

      await tx.intereses.create({
        data: {
          contacto_id: toDecimalId(created.id),
          inmueble_id: toDecimalId(inmuebleIdTrim),
        },
      });

      if (comentarioTrim) {
        await tx.comentarios.create({
          data: {
            contacto_id: toDecimalId(created.id),
            comentario: comentarioTrim,
          },
        });
      }

      return created;
    });

    newContactId = contact.id;
  } catch (error: unknown) {
    const code = getPrismaErrorCode(error);

    if (code === "P2002") {
      return { success: false, error: "Ya existe un contacto registrado con ese teléfono." };
    }

    console.error("createContact error:", error);
    return { success: false, error: "No se pudo crear el contacto. Intenta de nuevo." };
  }

  revalidatePath("/contactos");
  redirect(`/contactos/${newContactId}`);
}
