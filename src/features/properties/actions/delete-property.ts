"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/s3";

export async function deleteProperty(
  slug: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const property = await prisma.inmuebles.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!property) {
      return { error: "Inmueble no encontrado" };
    }

    const [images] = await Promise.all([
      prisma.inmueble_imagenes.findMany({
        where: { inmueble_id: property.id.toString() as unknown as number },
        select: { s3_key: true },
      }),
    ]);

    await prisma.$transaction([
      prisma.intereses.deleteMany({
        where: { inmueble_id: property.id.toString() as unknown as number },
      }),
      prisma.restricciones_inmueble.deleteMany({
        where: { id_inmueble: property.id.toString() as unknown as number },
      }),
      prisma.inmueble_imagenes.deleteMany({
        where: { inmueble_id: property.id.toString() as unknown as number },
      }),
      prisma.inmuebles.delete({
        where: { id: property.id },
      }),
    ]);

    await Promise.allSettled(
      images.map((image) => deleteObject(image.s3_key)),
    );

    revalidatePath("/inmuebles");
    revalidatePath(`/inmuebles/${slug}`);
    revalidatePath(`/inmuebles/${slug}/editar`);

    return { success: true };
  } catch (err) {
    console.error("deleteProperty error:", err);
    return { error: "Error al eliminar la propiedad" };
  }
}
