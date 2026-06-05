import Link from "next/link";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(value);
}

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

export default async function PropertiesPage() {
  let properties: Array<{
    id: bigint;
    titulo: string;
    direccion: string;
    municipio: string | null;
    estado: string | null;
    precio: { toString(): string };
    destacado: boolean;
    visible: boolean;
    created_at: Date | null;
    inmueble_estatus: {
      nombre: string;
    };
  }> = [];
  let totalProperties = 0;
  let visibleProperties = 0;
  let featuredProperties = 0;
  let databaseUnavailable = false;

  try {
    [properties, totalProperties, visibleProperties, featuredProperties] =
      await Promise.all([
        prisma.inmuebles.findMany({
          orderBy: { created_at: "desc" },
          take: 12,
          select: {
            id: true,
            titulo: true,
            direccion: true,
            municipio: true,
            estado: true,
            precio: true,
            destacado: true,
            visible: true,
            created_at: true,
            inmueble_estatus: {
              select: {
                nombre: true,
              },
            },
          },
        }),
        prisma.inmuebles.count(),
        prisma.inmuebles.count({
          where: {
            visible: true,
          },
        }),
        prisma.inmuebles.count({
          where: {
            destacado: true,
          },
        }),
      ]);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    databaseUnavailable = true;
  }

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
                  Inmuebles
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                  Portafolio de propiedades
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Revisa el inventario activo, el estado comercial y los
                  registros más recientes del CRM.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex w-fit items-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white/90 transition hover:bg-white/[0.1] hover:text-white"
                >
                  Volver al dashboard
                </Link>
                <Link
                  href="/inmuebles/nuevo"
                  className="inline-flex w-fit items-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Nuevo inmueble
                </Link>
              </div>
            </div>
          </section>

          {databaseUnavailable ? (
            <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              La base de datos no responde en este momento. La ruta ya existe,
              pero necesitas levantar PostgreSQL o corregir `DATABASE_URL` para
              ver el inventario.
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Inmuebles", value: totalProperties },
              { label: "Visibles", value: visibleProperties },
              { label: "Destacados", value: featuredProperties },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
                  Inventario reciente
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Últimos inmuebles
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Accede al formulario para registrar nuevas propiedades.
              </p>
            </div>

            {databaseUnavailable ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
                El listado estará disponible en cuanto PostgreSQL vuelva a estar
                accesible.
              </div>
            ) : properties.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
                No hay inmuebles registrados todavía.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <article
                    key={property.id.toString()}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {property.titulo}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {property.direccion}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {[property.municipio, property.estado]
                            .filter(Boolean)
                            .join(", ") || "Ubicación no disponible"}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                        {property.inmueble_estatus.nombre}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-slate-950">
                        {formatPrice(property.precio)}
                      </p>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
                        {property.visible ? "Visible" : "Oculto"}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                      <span>{formatDate(property.created_at)}</span>
                      <span className="font-medium text-slate-900">
                        {property.destacado ? "Destacado" : "General"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
