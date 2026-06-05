import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { DashboardMobileDock } from "@/components/dashboard/dashboard-navbar";
import { NewContactForm } from "@/components/contacts/new-contact-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function NewContactPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const prefilledPhone =
    normalizeSearchParam(resolvedSearchParams.telefono)?.trim() ?? "";

  const activeProperties = await prisma.inmuebles.findMany({
    where: {
      estatus_id: 1,
    },
    orderBy: {
      updated_at: "desc",
    },
    take: 24,
      select: {
        id: true,
        titulo: true,
        direccion: true,
        precio: true,
        inmueble_estatus: {
          select: {
            nombre: true,
          },
        },
      },
    });

  const formattedActiveProperties = activeProperties.map((property) => ({
    id: property.id.toString(),
    titulo: property.titulo,
    precio: property.precio.toString(),
    direccion: property.direccion,
    inmuebleEstatus: property.inmueble_estatus.nombre,
  }));

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-6 pb-28 text-zinc-950 sm:px-6 lg:px-10 lg:pb-6">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
                  Contactos
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                  Nuevo contacto
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Completa los datos básicos, asigna una propiedad de interés y
                  deja un comentario inicial para el seguimiento.
                </p>
              </div>
            </div>
          </section>

          <NewContactForm
            initialPhone={prefilledPhone}
            activeProperties={formattedActiveProperties}
          />
        </div>
      </AnimatedDashboardBackground>
      <DashboardMobileDock />
    </main>
  );
}
