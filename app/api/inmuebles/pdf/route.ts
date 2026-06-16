import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { PropertyPdfDocument, type PropertyPdfData } from "@/features/properties/pdf/property-pdf-document";
import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

type RequisitosJson = { requisitos?: string[]; restricciones?: string[] };

function formatPrice(value: { toString(): string } | null): string {
  if (!value) return "Precio no disponible";
  const n = Number(value.toString());
  if (!Number.isFinite(n)) return "Precio no disponible";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatArea(value: { toString(): string } | null): string | null {
  if (!value) return null;
  const n = Number(value.toString());
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(n);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug requerido" }, { status: 400 });
  }

  const [property, rawTipoOp] = await Promise.all([
    prisma.inmuebles.findUnique({
      where: { slug },
      select: {
        id: true,
        titulo: true,
        slug: true,
        descripcion: true,
        precio: true,
        habitaciones: true,
        banos: true,
        estacionamientos: true,
        metros_cuadrados: true,
        superficie_construida: true,
        superficie_terreno: true,
        anio_construccion: true,
        direccion: true,
        colonia: true,
        municipio: true,
        estado: true,
        codigo_postal: true,
        destacado: true,
        amenidades: true,
        requisitos_restricciones: true,
        asesor_id: true,
        inmueble_estatus: { select: { nombre: true, color: true } },
      },
    }),
    prisma.$queryRaw<Array<{ tipo: string; operacion: string }>>`
      SELECT tipo::text, operacion::text FROM inmuebles WHERE slug = ${slug} LIMIT 1
    `,
  ]);

  if (!property) {
    return NextResponse.json({ error: "Inmueble no encontrado" }, { status: 404 });
  }

  const tipo = rawTipoOp[0]?.tipo ?? "";
  const operacion = rawTipoOp[0]?.operacion ?? "";

  // Images — max 4, ordered
  const rawImages = await prisma.inmueble_imagenes.findMany({
    where: { inmueble_id: property.id.toString() },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    take: 4,
    select: { s3_key: true },
  });

  const imageUrls = rawImages.map((img) => getPublicImageUrl(img.s3_key));

  // Asesor
  const asesorId = Number(property.asesor_id.toString());
  const asesor =
    Number.isFinite(asesorId) && asesorId > 0
      ? await prisma.asesores.findFirst({
          where: { id: BigInt(asesorId) },
          select: { nombre: true, email: true, telefono: true },
        })
      : null;

  // Parse amenidades
  let amenidades: string[] = [];
  if (property.amenidades) {
    try {
      amenidades = JSON.parse(property.amenidades) as string[];
    } catch {
      amenidades = property.amenidades.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const req = property.requisitos_restricciones as RequisitosJson | null;
  const requisitos = req?.requisitos ?? [];
  const restricciones = req?.restricciones ?? [];

  const data: PropertyPdfData = {
    id: property.id.toString(),
    titulo: property.titulo,
    tipo,
    operacion,
    estatus: property.inmueble_estatus?.nombre ?? "Sin estado",
    estatusColor: property.inmueble_estatus?.color ?? "#6B7280",
    precio: formatPrice(property.precio),
    descripcion: property.descripcion ?? null,
    habitaciones: property.habitaciones,
    banos: property.banos,
    estacionamientos: property.estacionamientos,
    areaTotal: formatArea(property.metros_cuadrados),
    areaConstruida: formatArea(property.superficie_construida),
    areaTerreno: formatArea(property.superficie_terreno),
    anio_construccion: property.anio_construccion,
    direccion: property.direccion ?? null,
    colonia: property.colonia ?? null,
    municipio: property.municipio ?? null,
    estado: property.estado ?? null,
    codigo_postal: property.codigo_postal ?? null,
    destacado: property.destacado,
    amenidades,
    requisitos,
    restricciones,
    asesor: asesor
      ? { nombre: asesor.nombre, telefono: asesor.telefono ?? null, email: asesor.email ?? null }
      : null,
    images: imageUrls,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PropertyPdfDocument, { data }) as any;
  const buffer = await renderToBuffer(element);

  const filename = `ficha-${slug}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
