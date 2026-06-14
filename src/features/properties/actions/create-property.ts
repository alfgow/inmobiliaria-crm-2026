"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export interface PropertyCreateData {
  titulo: string;
  descripcion: string | null;
  precio: number;
  tipo: string;
  operacion: string;
  estatus_id: number;
  habitaciones: number;
  banos: number;
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

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 180);
}

export async function createProperty(
  data: PropertyCreateData,
): Promise<{ success?: boolean; slug?: string; id?: string; error?: string }> {
  try {
    const base = toSlug(data.titulo) || "inmueble";
    let slug = base;
    let attempt = 0;
    while (await prisma.inmuebles.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${++attempt}`;
    }

    const amenidades = data.amenidades.length ? JSON.stringify(data.amenidades) : null;
    const tags = data.tags.length ? JSON.stringify(data.tags) : null;
    const requisitosJson = JSON.stringify({ requisitos: data.requisitos, restricciones: data.restricciones });
    const asesorId = data.asesor_id ?? 0;
    const now = new Date();

    const rows = await prisma.$queryRaw<Array<{ id: bigint }>>`
      INSERT INTO inmuebles (
        titulo, slug, destacado, descripcion, precio,
        direccion, latitud, longitud, colonia, municipio, estado, codigo_postal,
        tipo, operacion, estatus_id,
        habitaciones, banos, estacionamientos,
        metros_cuadrados, superficie_construida, superficie_terreno, anio_construccion,
        video_url, tour_virtual_url,
        amenidades, tags, requisitos_restricciones,
        visible, seo_description, asesor_id, updated_at
      ) VALUES (
        ${data.titulo}, ${slug}, ${data.destacado}, ${data.descripcion}, ${data.precio},
        ${data.direccion}, ${data.latitud}, ${data.longitud},
        ${data.colonia}, ${data.municipio}, ${data.estado}, ${data.codigo_postal},
        ${data.tipo}::inmuebles_tipo, ${data.operacion}::inmuebles_operacion,
        ${data.estatus_id},
        ${data.habitaciones}, ${data.banos}, ${data.estacionamientos},
        ${data.metros_cuadrados}, ${data.superficie_construida}, ${data.superficie_terreno},
        ${data.anio_construccion},
        ${data.video_url}, ${data.tour_virtual_url},
        ${amenidades}, ${tags}, ${requisitosJson}::jsonb,
        ${data.visible}, ${data.seo_description}, ${asesorId}, ${now}
      )
      RETURNING id
    `;

    const id = rows[0]?.id;
    if (!id) throw new Error("INSERT did not return an id");

    revalidatePath("/inmuebles");

    return { success: true, slug, id: id.toString() };
  } catch (err) {
    console.error("createProperty error:", err);
    return { error: "Error al crear el inmueble" };
  }
}
