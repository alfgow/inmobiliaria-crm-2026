import Link from "next/link";
import {
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  MapPin,
  Search,
  SlidersHorizontal,
  SquareStack,
} from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";

export const dynamic = "force-dynamic";

function formatPrice(value: { toString(): string } | null) {
  if (!value) {
    return "Precio no disponible";
  }

  const numericValue = Number(value.toString());

  if (!Number.isFinite(numericValue)) {
    return "Precio no disponible";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatArea(value: { toString(): string } | null) {
  if (!value) {
    return "—";
  }

  const numericValue = Number(value.toString());

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0,
  }).format(numericValue)} m²`;
}

function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined || value <= 0) {
    return "—";
  }

  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0,
  }).format(value);
}

function shortReference(value: bigint) {
  return `#${value.toString().padStart(5, "0")}`;
}

function propertyCardGradient(index: number) {
  const palettes = [
    "from-indigo-600 via-violet-500 to-lime-300",
    "from-slate-900 via-slate-700 to-indigo-500",
    "from-emerald-600 via-teal-500 to-lime-200",
    "from-fuchsia-600 via-violet-600 to-sky-300",
  ];

  return palettes[index % palettes.length];
}

export default async function PropertiesPage() {
  let properties: Array<{
    id: bigint;
    titulo: string;
    direccion: string;
    colonia: string | null;
    municipio: string | null;
    estado: string | null;
    codigo_postal: string | null;
    precio: { toString(): string };
    destacado: boolean;
    visible: boolean;
    created_at: Date | null;
    habitaciones: number | null;
    banos: number | null;
    estacionamientos: number | null;
    metros_cuadrados: { toString(): string } | null;
    superficie_construida: { toString(): string } | null;
    inmueble_estatus: {
      nombre: string;
      color: string | null;
    };
  }> = [];
  let totalProperties = 0;
  let databaseUnavailable = false;

  try {
    [properties, totalProperties] = await Promise.all([
      prisma.inmuebles.findMany({
        orderBy: [
          {
            destacado: "desc",
          },
          {
            created_at: "desc",
          },
        ],
        take: 6,
        select: {
          id: true,
          titulo: true,
          direccion: true,
          colonia: true,
          municipio: true,
          estado: true,
          codigo_postal: true,
          precio: true,
          destacado: true,
          visible: true,
          created_at: true,
          habitaciones: true,
          banos: true,
          estacionamientos: true,
          metros_cuadrados: true,
          superficie_construida: true,
          inmueble_estatus: {
            select: {
              nombre: true,
              color: true,
            },
          },
        },
      }),
      prisma.inmuebles.count(),
    ]);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    databaseUnavailable = true;
  }

  const totalShown = properties.length;

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-brand-base px-4 py-4 text-brand-text sm:px-6 sm:py-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-24 lg:pb-8">
          <section className="rounded-[2.25rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_28px_70px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-secondary">
                  <SquareStack className="size-3.5" />
                  Inventario de inmuebles
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
                    Portafolio inmobiliario
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-brand-text/70 sm:text-base">
                    Explora las propiedades activas, filtra por estado comercial
                    y revisa la información operativa más reciente.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border-soft bg-white px-5 text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
                >
                  Volver al dashboard
                </Link>
                <Link
                  href="/inmuebles/nuevo"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-brand-primary px-5 text-sm font-semibold text-brand-text transition hover:brightness-95"
                >
                  Nuevo inmueble
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 px-4 py-4 shadow-[0_20px_50px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:px-5 sm:py-5 lg:px-6 lg:py-5">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border-soft bg-white px-4 text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                <Search className="size-4" />
                Tipo de propiedad
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border-soft bg-white px-4 text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                Rango de precio
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border-soft bg-white px-4 text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                Estado
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 text-sm font-semibold text-brand-secondary transition hover:bg-brand-primary/15"
              >
                <SlidersHorizontal className="size-4" />
                Filtros avanzados
              </button>
            </div>
          </section>

          {databaseUnavailable ? (
            <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              La base de datos no responde en este momento. La ruta ya existe,
              pero necesitas levantar PostgreSQL o corregir `DATABASE_URL` para
              ver el inventario.
            </section>
          ) : null}

          {databaseUnavailable ? (
            <section className="rounded-[2.25rem] border border-border-soft/80 bg-white/90 p-6 text-brand-text shadow-[0_28px_70px_rgba(20,16,35,0.08)]">
              <p className="text-sm text-brand-text/70">
                El listado estará disponible en cuanto PostgreSQL vuelva a estar
                accesible.
              </p>
            </section>
          ) : properties.length === 0 ? (
            <section className="rounded-[2.25rem] border border-border-soft/80 bg-white/90 p-6 text-brand-text shadow-[0_28px_70px_rgba(20,16,35,0.08)]">
              <p className="text-sm text-brand-text/70">
                No hay inmuebles registrados todavía.
              </p>
            </section>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property, index) => (
                <article
                  key={property.id.toString()}
                  className="group overflow-hidden rounded-[2rem] border border-border-soft/80 bg-white shadow-[0_22px_55px_rgba(20,16,35,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(20,16,35,0.12)]"
                >
                  <div
                    className={[
                      "relative h-56 overflow-hidden bg-gradient-to-br",
                      propertyCardGradient(index),
                    ].join(" ")}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_40%,rgba(17,24,39,0.22)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_20%_70%,rgba(210,255,30,0.16),transparent_28%)]" />
                    <div className="absolute left-4 top-4 z-10">
                      <span
                        className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/95"
                        style={{
                          backgroundColor: property.inmueble_estatus.color
                            ? `${property.inmueble_estatus.color}dd`
                            : "rgba(15, 23, 42, 0.55)",
                        }}
                      >
                        {property.visible ? "Disponible" : "Oculto"}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Marcar como favorito"
                      className="absolute right-4 top-4 z-10 inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/20 text-white backdrop-blur-md transition hover:bg-white/30"
                    >
                      <Heart className="size-4" />
                    </button>
                    <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-4 text-white">
                      <div>
                        <p className="text-3xl font-semibold tracking-tight">
                          {formatPrice(property.precio)}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-white/80">
                          {shortReference(property.id)}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/15 bg-white/12 px-3 py-2 text-right text-[11px] uppercase tracking-[0.3em] text-white/80 backdrop-blur-sm">
                        <p>{property.destacado ? "Destacado" : "General"}</p>
                        <p className="mt-1 text-[10px] tracking-[0.28em] text-white/65">
                          {property.inmueble_estatus.nombre}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold leading-tight tracking-tight text-brand-text">
                          {property.titulo}
                        </h3>
                        <button
                          type="button"
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border-soft bg-brand-surface transition hover:border-brand-secondary hover:text-brand-secondary"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>

                      <div className="space-y-1 text-sm text-brand-text/70">
                        <p className="flex items-center gap-2">
                          <MapPin className="size-4 shrink-0 text-brand-secondary" />
                          <span>
                            {[property.colonia, property.municipio, property.estado]
                              .filter(Boolean)
                              .join(", ") || "Ubicación no disponible"}
                          </span>
                        </p>
                        <p className="pl-6 text-brand-text/55">
                          {property.direccion}
                          {property.codigo_postal ? ` • CP ${property.codigo_postal}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] border border-border-soft bg-brand-surface/70 p-3">
                      <div className="rounded-[1.15rem] bg-white px-3 py-3 text-center shadow-sm">
                        <BedDouble className="mx-auto size-4 text-brand-secondary" />
                        <p className="mt-2 text-lg font-semibold text-brand-text">
                          {formatCount(property.habitaciones)}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text/45">
                          Recámaras
                        </p>
                      </div>
                      <div className="rounded-[1.15rem] bg-white px-3 py-3 text-center shadow-sm">
                        <Bath className="mx-auto size-4 text-brand-secondary" />
                        <p className="mt-2 text-lg font-semibold text-brand-text">
                          {formatCount(property.banos)}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text/45">
                          Baños
                        </p>
                      </div>
                      <div className="rounded-[1.15rem] bg-white px-3 py-3 text-center shadow-sm">
                        <LayoutGrid className="mx-auto size-4 text-brand-secondary" />
                        <p className="mt-2 text-sm font-semibold text-brand-text">
                          {formatArea(property.metros_cuadrados ?? property.superficie_construida)}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text/45">
                          Área
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          <section className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-brand-text/45">
                  Resultados
                </p>
                <p className="mt-2 text-sm text-brand-text/70">
                  Mostrando {totalShown} de {new Intl.NumberFormat("es-MX").format(totalProperties)} inmuebles.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border-soft bg-white text-brand-text/70 transition hover:border-brand-secondary hover:text-brand-secondary"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-brand-secondary px-4 text-sm font-semibold text-white">
                  1
                </div>
                <div className="flex h-10 min-w-10 items-center justify-center rounded-full border border-border-soft bg-white px-4 text-sm font-medium text-brand-text/60">
                  2
                </div>
                <div className="flex h-10 min-w-10 items-center justify-center rounded-full border border-border-soft bg-white px-4 text-sm font-medium text-brand-text/60">
                  3
                </div>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border-soft bg-white text-brand-text/70 transition hover:border-brand-secondary hover:text-brand-secondary"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </section>
        </div>

        <Link
          href="/inmuebles/nuevo"
          className="fixed bottom-6 right-6 z-40 inline-flex h-14 items-center gap-3 rounded-full bg-brand-primary px-5 text-sm font-semibold text-brand-text shadow-[0_18px_45px_rgba(210,255,30,0.35)] transition hover:brightness-95 md:hidden"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-text text-brand-primary">
            +
          </span>
          Nuevo inmueble
        </Link>
      </AnimatedDashboardBackground>
    </main>
  );
}
