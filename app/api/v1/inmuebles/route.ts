import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "../../../generated/prisma/client";
import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

type DecimalLike = {
  toString(): string;
};

type ApiPropertyRecord = {
  id: bigint;
  slug: string;
  titulo: string;
  descripcion: string | null;
  precio: DecimalLike;
  direccion: string;
  latitud: DecimalLike | null;
  longitud: DecimalLike | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  codigo_postal: string | null;
  destacado: boolean;
  visible: boolean;
  views: number;
  habitaciones: number | null;
  banos: number | null;
  estacionamientos: number | null;
  metros_cuadrados: DecimalLike | null;
  superficie_construida: DecimalLike | null;
  superficie_terreno: DecimalLike | null;
  anio_construccion: number | null;
  video_url: string | null;
  tour_virtual_url: string | null;
  amenidades: string | null;
  tags: string | null;
  requisitos_restricciones: unknown;
  seo_description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  published_at: Date | null;
  inmueble_estatus: {
    nombre: string;
    color: string | null;
  };
  coverImageUrl?: string | null;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function parseBoolean(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;

  return null;
}

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

function serializeProperty(property: ApiPropertyRecord) {
  const requirements = parseRequirements(property.requisitos_restricciones);

  return {
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
    imagenPortadaUrl: property.coverImageUrl ?? null,
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
    links: {
      self: `/api/v1/inmuebles/${property.slug}`,
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const perPage = Math.min(parsePositiveInt(searchParams.get("perPage"), 20), 100);
  const query = searchParams.get("q")?.trim() ?? "";
  const estatus = searchParams.get("estatus")?.trim() ?? "";
  const destacado = parseBoolean(searchParams.get("destacado"));
  const where: Prisma.inmueblesWhereInput = { visible: true };

  if (query.length >= 2) {
    where.OR = [
      { titulo: { contains: query, mode: "insensitive" } },
      { descripcion: { contains: query, mode: "insensitive" } },
      { colonia: { contains: query, mode: "insensitive" } },
      { municipio: { contains: query, mode: "insensitive" } },
      { estado: { contains: query, mode: "insensitive" } },
    ];
  }

  if (estatus) {
    where.inmueble_estatus = {
      nombre: { equals: estatus, mode: "insensitive" },
    };
  }

  if (destacado !== null) {
    where.destacado = destacado;
  }

  try {
    const [properties, total] = await Promise.all([
      prisma.inmuebles.findMany({
        where,
        orderBy: [{ destacado: "desc" }, { created_at: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
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
      }),
      prisma.inmuebles.count({ where }),
    ]);

    const propertyIds = properties.map((property) => property.id.toString());
    const rawImages =
      propertyIds.length > 0
        ? await prisma.inmueble_imagenes.findMany({
            where: { inmueble_id: { in: propertyIds } },
            orderBy: [{ orden: "asc" }, { id: "asc" }],
            select: { inmueble_id: true, s3_key: true },
          })
        : [];

    const coverImageByPropertyId = new Map<string, string>();

    for (const image of rawImages) {
      const propertyId = image.inmueble_id.toString();

      if (!coverImageByPropertyId.has(propertyId)) {
        coverImageByPropertyId.set(propertyId, getPublicImageUrl(image.s3_key));
      }
    }

    const data = properties.map((property) =>
      serializeProperty({
        ...property,
        coverImageUrl: coverImageByPropertyId.get(property.id.toString()) ?? null,
      }),
    );

    return NextResponse.json({
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/inmuebles failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar los inmuebles." },
      { status: 500 },
    );
  }
}

