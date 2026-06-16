import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Car,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  Pencil,
  SquareStack,
  Video,
} from "lucide-react";
import type { ReactNode } from "react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { DeletePropertyButton } from "@/features/properties/components/delete-property-button";
import { DownloadPdfButton } from "@/features/properties/components/download-pdf-button";
import { DownloadPhotosButton } from "@/features/properties/components/download-photos-button";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { PropertyMapClient } from "@/features/properties/components/property-map-client";
import { StatusBadgeSelect } from "@/features/properties/components/status-badge-select";
import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(value: { toString(): string } | null) {
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

function operationBadge(op: string) {
  switch (op.toLowerCase()) {
    case "venta":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "renta":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "preventa":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "traspaso":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-brand-primary/10 text-brand-secondary border-brand-primary/20";
  }
}

type RequisitosJson = { requisitos?: string[]; restricciones?: string[] };

function parseCoordinate(value: { toString(): string } | null): number | null {
  if (!value) return null;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[1.35rem] border border-border-soft bg-brand-surface/60 px-4 py-5 text-center">
      <span className="text-brand-secondary">{icon}</span>
      <p className="mt-2 text-lg font-semibold text-brand-text">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.28em] text-brand-text/45">
        {label}
      </p>
    </div>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-6 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-8">
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PageProps = { params: Promise<{ slug: string }> };

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [property, rawTipoOp, interestCountResult, allStatuses] = await Promise.all([
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
        video_url: true,
        tour_virtual_url: true,
        requisitos_restricciones: true,
        asesor_id: true,
        estatus_id: true,
        inmueble_estatus: { select: { id: true, nombre: true, color: true } },
      },
    }),
    // tipo and operacion are Unsupported in Prisma; fetch via raw query
    prisma.$queryRaw<Array<{ tipo: string; operacion: string }>>`
      SELECT tipo::text, operacion::text FROM inmuebles WHERE slug = ${slug} LIMIT 1
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM intereses WHERE inmueble_id = (
        SELECT id FROM inmuebles WHERE slug = ${slug} LIMIT 1
      )
    `,
    prisma.inmueble_estatus.findMany({
      select: { id: true, nombre: true, color: true },
      orderBy: { orden: "asc" },
    }),
  ]);

  if (!property) notFound();

  const mapboxToken = process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  const tipo = rawTipoOp[0]?.tipo ?? "";
  const operacion = rawTipoOp[0]?.operacion ?? "";
  const interestCount = Number(interestCountResult[0]?.count ?? 0);

  // ── Images ──────────────────────────────────────────────────────────────────

  const rawImages = await prisma.inmueble_imagenes.findMany({
    where: { inmueble_id: property.id.toString() },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { s3_key: true },
  });

  const imageUrls = rawImages.map((img) => getPublicImageUrl(img.s3_key));

  // ── Asesor ──────────────────────────────────────────────────────────────────

  const asesorId = Number(property.asesor_id.toString());
  const asesor =
    Number.isFinite(asesorId) && asesorId > 0
      ? await prisma.asesores.findFirst({
          where: { id: BigInt(asesorId) },
          select: { nombre: true, email: true, telefono: true },
        })
      : null;

  // ── Parsed fields ────────────────────────────────────────────────────────────

  let amenidades: string[] = [];
  if (property.amenidades) {
    try {
      amenidades = JSON.parse(property.amenidades) as string[];
    } catch {
      amenidades = property.amenidades
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const req = property.requisitos_restricciones as RequisitosJson | null;
  const requisitos = req?.requisitos ?? [];
  const restricciones = req?.restricciones ?? [];

  const lat = parseCoordinate(property.latitud);
  const lng = parseCoordinate(property.longitud);
  const hasCoords = lat !== null && lng !== null;


  const areaTotal = formatArea(property.metros_cuadrados);
  const areaConstruida = formatArea(property.superficie_construida);
  const areaTerreno = formatArea(property.superficie_terreno);

  const locationParts = [
    property.colonia,
    property.municipio,
    property.estado,
  ].filter(Boolean);

  const hasCharacteristics =
    (property.habitaciones ?? 0) > 0 ||
    (property.banos ?? 0) > 0 ||
    (property.estacionamientos ?? 0) > 0 ||
    !!areaTotal ||
    !!areaConstruida ||
    !!areaTerreno ||
    !!property.anio_construccion;

  const hasRequisitos = requisitos.length > 0 || restricciones.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-brand-base px-4 py-4 text-brand-text sm:px-6 sm:py-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 pb-24 lg:pb-10">

          {/* ── Breadcrumb ── */}
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/inmuebles"
              className="inline-flex items-center gap-1.5 text-brand-text/50 transition hover:text-brand-text"
            >
              <ArrowLeft className="size-4" />
              Portafolio
            </Link>
            <span className="text-brand-text/25">/</span>
            <span className="truncate text-brand-text/70">{property.titulo}</span>
          </nav>

          {/* ── Gallery ── */}
          <PropertyGallery images={imageUrls} title={property.titulo} />

          {/* ── Main grid ── */}
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

            {/* ── Left column ── */}
            <div className="flex flex-col gap-5">

              {/* Header */}
              <SectionCard>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em]",
                      operationBadge(operacion),
                    ].join(" ")}
                  >
                    {operacion}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-brand-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-text/60">
                    <Building2 className="size-3" />
                    {tipo}
                  </span>
                  <StatusBadgeSelect
                    propertyId={property.id.toString()}
                    slug={property.slug}
                    current={property.inmueble_estatus}
                    options={allStatuses}
                  />
                  {property.destacado && (
                    <span className="inline-flex items-center rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-secondary">
                      Destacado
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl lg:text-4xl">
                  {property.titulo}
                </h1>

                {locationParts.length > 0 && (
                  <p className="mt-4 flex items-start gap-2 text-sm text-brand-text/60">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-secondary" />
                    <span>
                      {locationParts.join(", ")}
                      {property.codigo_postal
                        ? ` · CP ${property.codigo_postal}`
                        : ""}
                    </span>
                  </p>
                )}
                {property.direccion && (
                  <p className="mt-1 pl-6 text-sm text-brand-text/40">
                    {property.direccion}
                  </p>
                )}
              </SectionCard>

              {/* Description */}
              {property.descripcion && (
                <SectionCard>
                  <SectionLabel>Descripción</SectionLabel>
                  <p className="whitespace-pre-line text-sm leading-8 text-brand-text/70">
                    {property.descripcion}
                  </p>
                </SectionCard>
              )}

              {/* Characteristics */}
              {hasCharacteristics && (
                <SectionCard>
                  <SectionLabel>Características</SectionLabel>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {(property.habitaciones ?? 0) > 0 && (
                      <StatCard
                        icon={<BedDouble className="size-5" />}
                        label="Recámaras"
                        value={String(property.habitaciones)}
                      />
                    )}
                    {(property.banos ?? 0) > 0 && (
                      <StatCard
                        icon={<Bath className="size-5" />}
                        label="Baños"
                        value={String(property.banos)}
                      />
                    )}
                    {(property.estacionamientos ?? 0) > 0 && (
                      <StatCard
                        icon={<Car className="size-5" />}
                        label="Estacionamientos"
                        value={String(property.estacionamientos)}
                      />
                    )}
                    {areaTotal && (
                      <StatCard
                        icon={<LayoutGrid className="size-5" />}
                        label="m² totales"
                        value={`${areaTotal} m²`}
                      />
                    )}
                    {areaConstruida && (
                      <StatCard
                        icon={<SquareStack className="size-5" />}
                        label="Sup. construida"
                        value={`${areaConstruida} m²`}
                      />
                    )}
                    {areaTerreno && (
                      <StatCard
                        icon={<LayoutGrid className="size-5" />}
                        label="Sup. terreno"
                        value={`${areaTerreno} m²`}
                      />
                    )}
                    {property.anio_construccion && (
                      <StatCard
                        icon={<Calendar className="size-5" />}
                        label="Año"
                        value={String(property.anio_construccion)}
                      />
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Amenidades */}
              {amenidades.length > 0 && (
                <SectionCard>
                  <SectionLabel>Amenidades</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {amenidades.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center rounded-full border border-border-soft bg-brand-surface px-4 py-2 text-sm text-brand-text/70"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Requisitos y restricciones */}
              {hasRequisitos && (
                <SectionCard>
                  <SectionLabel>Requisitos y restricciones</SectionLabel>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {requisitos.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-text/45">
                          Requisitos
                        </p>
                        <ul className="space-y-2.5">
                          {requisitos.map((r) => (
                            <li
                              key={r}
                              className="flex items-start gap-2.5 text-sm text-brand-text/65"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {restricciones.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-text/45">
                          Restricciones
                        </p>
                        <ul className="space-y-2.5">
                          {restricciones.map((r) => (
                            <li
                              key={r}
                              className="flex items-start gap-2.5 text-sm text-brand-text/65"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Map */}
              {hasCoords && (
                <section className="overflow-hidden rounded-[2rem] border border-border-soft/80 bg-white/90 shadow-[0_22px_55px_rgba(20,16,35,0.08)]">
                  <div className="border-b border-border-soft px-6 py-4 sm:px-8">
                    <SectionLabel>Ubicación</SectionLabel>
                    {locationParts.length > 0 && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-text/55">
                        <MapPin className="size-3.5 text-brand-secondary" />
                        {locationParts.join(", ")}
                      </p>
                    )}
                  </div>
                  <PropertyMapClient lat={lat} lng={lng} mapboxToken={mapboxToken} />
                </section>
              )}

              {/* Video / Tour virtual */}
              {(property.video_url ?? property.tour_virtual_url) && (
                <SectionCard>
                  <SectionLabel>Multimedia</SectionLabel>
                  <div className="flex flex-wrap gap-3">
                    {property.video_url && (
                      <a
                        href={property.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-brand-surface px-4 py-2.5 text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
                      >
                        <Video className="size-4" />
                        Ver video
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    )}
                    {property.tour_virtual_url && (
                      <a
                        href={property.tour_virtual_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-brand-surface px-4 py-2.5 text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
                      >
                        <ExternalLink className="size-4" />
                        Tour virtual
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    )}
                  </div>
                </SectionCard>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:h-fit">

              {/* Price card */}
              <SectionCard>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">
                  Precio
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text sm:text-4xl">
                  {formatPrice(property.precio)}
                </p>
                <p className="mt-1.5 text-xs text-brand-text/45">
                  {operacion} · {tipo}
                </p>

                {/* Interest counter */}
                <div className="mt-5 flex items-center gap-3 rounded-[1.35rem] border border-border-soft bg-brand-surface/60 px-4 py-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50">
                    <Heart className="size-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold tabular-nums text-brand-text">
                      {interestCount}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text/40">
                      Intereses
                    </p>
                  </div>
                </div>

                {/* CRM actions */}
                <div className="mt-2.5 flex flex-col gap-2.5">
                  <Link
                    href={`/inmuebles/${property.slug}/editar`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-primary text-sm font-semibold text-brand-text shadow-[0_16px_35px_rgba(210,255,30,0.25)] transition hover:brightness-95"
                  >
                    <Pencil className="size-4" />
                    Editar propiedad
                  </Link>
                  <Link
                    href={`/inmuebles/${property.slug}/editar#fotos`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border-soft bg-white text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
                  >
                    <ImageIcon className="size-4" />
                    Gestionar fotos
                  </Link>
                  {imageUrls.length > 0 && (
                    <DownloadPhotosButton slug={property.slug} photoCount={imageUrls.length} />
                  )}
                  <DownloadPdfButton slug={property.slug} />
                  <DeletePropertyButton slug={property.slug} title={property.titulo} />
                </div>
              </SectionCard>

              {/* Asesor (internal info) */}
              {asesor && (
                <SectionCard>
                  <SectionLabel>Asesor asignado</SectionLabel>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
                      {asesor.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-text">
                        {asesor.nombre}
                      </p>
                      {asesor.telefono && (
                        <p className="truncate text-xs text-brand-text/45">{asesor.telefono}</p>
                      )}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Referencia */}
              <section className="rounded-[2rem] border border-border-soft/80 bg-white/90 px-6 py-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">
                      Referencia
                    </p>
                    <p className="mt-1.5 font-mono text-xl font-semibold tracking-wider text-brand-text">
                      #{property.id.toString().padStart(5, "0")}
                    </p>
                  </div>
                  <Link
                    href="/inmuebles"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-brand-surface px-3.5 py-2 text-xs font-medium text-brand-text/60 transition hover:border-brand-secondary hover:text-brand-secondary"
                  >
                    <ArrowLeft className="size-3.5" />
                    Portafolio
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
