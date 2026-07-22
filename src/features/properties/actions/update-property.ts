"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export interface PropertyUpdateData {
  titulo: string;
  descripcion: string | null;
  precio: number;
  tipo: string;
  operacion: string;
  estatus_id: number;
  habitaciones: number;
  banos: number;
  banos_modalidad: string | null;
  estacionamientos: number;
  metros_cuadrados: number | null;
  superficie_construida: number | null;
  superficie_terreno: number | null;
  anio_construccion: number | null;
  direccion: string;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  codigo_postal: string | null;
  latitud: number | null;
  longitud: number | null;
  video_url: string | null;
  tour_virtual_url: string | null;
  amenidades: string[];
  requisitos: string[];
  restricciones: string[];
  tags: string[];
  destacado: boolean;
  visible: boolean;
  seo_description: string | null;
  asesor_id: number | null;
}

export async function updateProperty(
  slug: string,
  data: PropertyUpdateData,
): Promise<{ success?: boolean; error?: string }> {
  const property = await prisma.inmuebles.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!property) return { error: "Inmueble no encontrado" };

  try {
    await prisma.inmuebles.update({
      where: { id: property.id },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: data.precio,
        estatus_id: data.estatus_id,
        habitaciones: data.habitaciones,
        banos: data.banos,
        banos_modalidad: data.banos_modalidad ?? undefined,
        estacionamientos: data.estacionamientos,
        metros_cuadrados: data.metros_cuadrados,
        superficie_construida: data.superficie_construida,
        superficie_terreno: data.superficie_terreno,
        anio_construccion: data.anio_construccion,
        direccion: data.direccion,
        colonia: data.colonia,
        municipio: data.municipio,
        estado: data.estado,
        codigo_postal: data.codigo_postal,
        latitud: data.latitud,
        longitud: data.longitud,
        video_url: data.video_url,
        tour_virtual_url: data.tour_virtual_url,
        amenidades: JSON.stringify(data.amenidades),
        tags: JSON.stringify(data.tags),
        requisitos_restricciones: {
          requisitos: data.requisitos,
          restricciones: data.restricciones,
        },
        destacado: data.destacado,
        visible: data.visible,
        seo_description: data.seo_description,
        ...(data.asesor_id != null ? { asesor_id: data.asesor_id } : {}),
        updated_at: new Date(),
      },
    });

    await prisma.$executeRaw`
      UPDATE inmuebles
      SET tipo      = ${data.tipo}::inmuebles_tipo,
          operacion = ${data.operacion}::inmuebles_operacion
      WHERE id = ${property.id}
    `;

    revalidatePath(`/inmuebles/${slug}`);
    revalidatePath(`/inmuebles/${slug}/editar`);
    revalidatePath("/inmuebles");

    return { success: true };
  } catch (err) {
    console.error("updateProperty error:", err);
    return { error: "Error al guardar los cambios" };
  }
}
