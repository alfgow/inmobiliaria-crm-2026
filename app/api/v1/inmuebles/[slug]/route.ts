import { NextRequest, NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

type DecimalLike = {
  toString(): string;
};

function decimalToNumber(value: DecimalLike | null) {
  if (!value) return null;

  const numberValue = Number(value.toString());

  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseList(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseRequirements(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { requisitos: [], restricciones: [] };
  }

  const data = value as {
    requisitos?: unknown;
    restricciones?: unknown;
  };

  return {
    requisitos: Array.isArray(data.requisitos)
      ? data.requisitos.filter((item): item is string => typeof item === "string")
      : [],
    restricciones: Array.isArray(data.restricciones)
      ? data.restricciones.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ error: "slug requerido." }, { status: 400 });
  }

  try {
    const property = await prisma.inmuebles.findFirst({
      where: {
        slug,
        visible: true,
      },
      select: {
        id: true,
        slug: true,
        titulo: true,
        descripcion: true,
        precio: true,
        direccion: true,
        latitud: true,
        longitud: true,
        colonia: true,
        municipio: true,
        estado: true,
        codigo_postal: true,
        destacado: true,
        visible: true,
        views: true,
        habitaciones: true,
        banos: true,
        estacionamientos: true,
        metros_cuadrados: true,
        superficie_construida: true,
        superficie_terreno: true,
        anio_construccion: true,
        video_url: true,
        tour_virtual_url: true,
        amenidades: true,
        tags: true,
        requisitos_restricciones: true,
        seo_description: true,
        created_at: true,
        updated_at: true,
        published_at: true,
        inmueble_estatus: {
          select: {
            nombre: true,
            color: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Inmueble no encontrado." },
        { status: 404 },
      );
    }

    const images = await prisma.inmueble_imagenes.findMany({
      where: { inmueble_id: property.id.toString() },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: { s3_key: true },
    });
    const requirements = parseRequirements(property.requisitos_restricciones);

    return NextResponse.json({
      data: {
        id: property.id.toString(),
        slug: property.slug,
        titulo: property.titulo,
        descripcion: property.descripcion,
        precio: {
          monto: property.precio.toString(),
          moneda: "MXN",
        },
        ubicacion: {
          direccion: property.direccion,
          colonia: property.colonia,
          municipio: property.municipio,
          estado: property.estado,
          codigoPostal: property.codigo_postal,
          latitud: decimalToNumber(property.latitud),
          longitud: decimalToNumber(property.longitud),
        },
        especificaciones: {
          habitaciones: property.habitaciones,
          banos: property.banos,
          estacionamientos: property.estacionamientos,
          metrosCuadrados: decimalToNumber(property.metros_cuadrados),
          superficieConstruida: decimalToNumber(property.superficie_construida),
          superficieTerreno: decimalToNumber(property.superficie_terreno),
          anioConstruccion: property.anio_construccion,
        },
        estatus: {
          nombre: property.inmueble_estatus.nombre,
          color: property.inmueble_estatus.color,
        },
        destacado: property.destacado,
        visible: property.visible,
        vistas: property.views,
        imagenes: images.map((image) => getPublicImageUrl(image.s3_key)),
        multimedia: {
          videoUrl: property.video_url,
          tourVirtualUrl: property.tour_virtual_url,
        },
        amenidades: parseList(property.amenidades),
        tags: parseList(property.tags),
        requisitos: requirements.requisitos,
        restricciones: requirements.restricciones,
        seoDescription: property.seo_description,
        fechas: {
          creado: property.created_at?.toISOString() ?? null,
          actualizado: property.updated_at?.toISOString() ?? null,
          publicado: property.published_at?.toISOString() ?? null,
        },
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/inmuebles/[slug] failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar el inmueble." },
      { status: 500 },
    );
  }
}

