import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import {
  PropertyEditForm,
  type EditableImage,
} from "@/features/properties/components/property-edit-form";
import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function PropertyEditPage({ params }: PageProps) {
  const { slug } = await params;

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
        latitud: true,
        longitud: true,
        destacado: true,
        amenidades: true,
        tags: true,
        video_url: true,
        tour_virtual_url: true,
        requisitos_restricciones: true,
        asesor_id: true,
        estatus_id: true,
        visible: true,
        seo_description: true,
      },
    }),
    prisma.$queryRaw<Array<{ tipo: string; operacion: string }>>`
      SELECT tipo::text, operacion::text FROM inmuebles WHERE slug = ${slug} LIMIT 1
    `,
  ]);

  if (!property) notFound();

  const [rawImages, statuses, advisors] = await Promise.all([
    prisma.inmueble_imagenes.findMany({
      where: { inmueble_id: property.id.toString() as unknown as number },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: { id: true, s3_key: true, orden: true },
    }),
    prisma.inmueble_estatus.findMany({
      select: { id: true, nombre: true, color: true },
      orderBy: { orden: "asc" },
    }),
    prisma.asesores.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const images: EditableImage[] = rawImages.map((img) => ({
    id: img.id.toString(),
    s3_key: img.s3_key,
    url: getPublicImageUrl(img.s3_key),
    orden: img.orden ? Number(img.orden) : 0,
  }));

  function parseJsonbObject(raw: unknown): Record<string, unknown> {
    if (!raw) return {};
    if (typeof raw === "string") {
      try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
    }
    if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
    return {};
  }

  function toDisplayArray(val: unknown): string[] {
    if (Array.isArray(val)) {
      return (val as unknown[]).filter((x) => typeof x === "string") as string[];
    }
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.entries(val as Record<string, unknown>).map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: ${(v as unknown[]).join(", ")}`;
        return `${k}: ${String(v)}`;
      });
    }
    return [];
  }

  const reqObj = parseJsonbObject(property.requisitos_restricciones);
  const requisitosList = toDisplayArray(reqObj.requisitos);
  const restriccionesList = toDisplayArray(reqObj.restricciones);

  function parseStringArray(raw: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const amenidades = parseStringArray(property.amenidades);
  const tags = parseStringArray(property.tags ?? null);

  const initialData = {
    titulo: property.titulo,
    descripcion: property.descripcion ?? "",
    precio: property.precio ? property.precio.toString() : "0",
    tipo: rawTipoOp[0]?.tipo ?? "",
    operacion: rawTipoOp[0]?.operacion ?? "",
    estatus_id: property.estatus_id,
    destacado: property.destacado,
    visible: property.visible,
    habitaciones: property.habitaciones ?? 0,
    banos: property.banos ?? 0,
    estacionamientos: property.estacionamientos ?? 0,
    metros_cuadrados: property.metros_cuadrados
      ? Number(property.metros_cuadrados.toString()).toString()
      : "",
    superficie_construida: property.superficie_construida
      ? Number(property.superficie_construida.toString()).toString()
      : "",
    superficie_terreno: property.superficie_terreno
      ? Number(property.superficie_terreno.toString()).toString()
      : "",
    anio_construccion: property.anio_construccion
      ? String(property.anio_construccion)
      : "",
    direccion: property.direccion,
    colonia: property.colonia ?? "",
    municipio: property.municipio ?? "",
    estado: property.estado ?? "",
    codigo_postal: property.codigo_postal ?? "",
    latitud: property.latitud !== null ? property.latitud.toString() : "",
    longitud: property.longitud !== null ? property.longitud.toString() : "",
    video_url: property.video_url ?? "",
    tour_virtual_url: property.tour_virtual_url ?? "",
    amenidades,
    tags,
    requisitos: requisitosList,
    restricciones: restriccionesList,
    seo_description: property.seo_description ?? "",
    asesor_id: property.asesor_id ? property.asesor_id.toString() : "",
  };

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-brand-base px-4 py-4 text-brand-text sm:px-6 sm:py-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 pb-24 lg:pb-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/inmuebles"
              className="inline-flex items-center gap-1.5 text-brand-text/50 transition hover:text-brand-text"
            >
              <ArrowLeft className="size-4" />
              Portafolio
            </Link>
            <span className="text-brand-text/25">/</span>
            <Link
              href={`/inmuebles/${slug}`}
              className="truncate text-brand-text/50 transition hover:text-brand-text"
            >
              {property.titulo}
            </Link>
            <span className="text-brand-text/25">/</span>
            <span className="text-brand-text/70">Editar</span>
          </nav>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">
              Editar inmueble
            </h1>
            <p className="mt-1 text-sm text-brand-text/45">{property.titulo}</p>
          </div>

          {/* Form */}
          <PropertyEditForm
            slug={slug}
            propertyId={property.id.toString()}
            initialData={initialData}
            statuses={statuses.map((s) => ({
              id: s.id,
              nombre: s.nombre,
              color: s.color,
            }))}
            advisors={advisors.map((a) => ({
              id: a.id.toString(),
              nombre: a.nombre,
            }))}
            initialImages={images}
          />
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
