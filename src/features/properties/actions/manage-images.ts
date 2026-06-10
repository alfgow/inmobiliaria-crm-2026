"use server";

import { revalidatePath } from "next/cache";

import { deleteObject } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export async function deletePropertyImage(
  imageId: string,
  s3Key: string,
  slug: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await prisma.inmueble_imagenes.delete({ where: { id: BigInt(imageId) } });

    try {
      await deleteObject(s3Key);
    } catch (s3Err) {
      console.warn("S3 delete failed (image record already removed):", s3Err);
    }

    revalidatePath(`/inmuebles/${slug}`);
    revalidatePath(`/inmuebles/${slug}/editar`);
    return { success: true };
  } catch (err) {
    console.error("deletePropertyImage error:", err);
    return { error: "Error al eliminar la imagen" };
  }
}

export async function addPropertyImage(
  inmuebleId: string,
  s3Key: string,
  orden: number,
  slug: string,
): Promise<{ success?: boolean; id?: string; error?: string }> {
  try {
    const image = await prisma.inmueble_imagenes.create({
      data: {
        inmueble_id: inmuebleId as unknown as number,
        s3_key: s3Key,
        orden: BigInt(orden),
        disk: "s3",
      },
    });

    revalidatePath(`/inmuebles/${slug}`);
    revalidatePath(`/inmuebles/${slug}/editar`);
    return { success: true, id: image.id.toString() };
  } catch (err) {
    console.error("addPropertyImage error:", err);
    return { error: "Error al guardar la imagen" };
  }
}

export async function reorderPropertyImages(
  orders: Array<{ id: string; orden: number }>,
  slug: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await Promise.all(
      orders.map(({ id, orden }) =>
        prisma.inmueble_imagenes.update({
          where: { id: BigInt(id) },
          data: { orden: BigInt(orden) },
        }),
      ),
    );

    revalidatePath(`/inmuebles/${slug}`);
    revalidatePath(`/inmuebles/${slug}/editar`);
    return { success: true };
  } catch (err) {
    console.error("reorderPropertyImages error:", err);
    return { error: "Error al reordenar imágenes" };
  }
}
