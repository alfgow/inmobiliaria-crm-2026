import Link from "next/link";
import { Database, Search } from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { ReginaContextosTable } from "@/features/regina-contextos/components/regina-contextos-table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ReginaContextosPage() {
  const contextos = await prisma.regina_contextos.findMany({
    orderBy: [{ updated_at: "desc" }, { wa_id: "asc" }],
    select: {
      wa_id: true,
      nombre: true,
      inmueble_id: true,
      status: true,
      rechazos_post: true,
      historial: true,
      updated_at: true,
    },
  });

  const rows = contextos.map((contexto) => ({
    ...contexto,
    updated_at: contexto.updated_at ? contexto.updated_at.toISOString() : null,
  }));

  const totalContexts = rows.length;
  const namedContexts = rows.filter((row) => Boolean(row.nombre?.trim())).length;
  const linkedContexts = rows.filter((row) => row.inmueble_id !== null).length;
  const recentlyUpdated = rows.filter((row) => {
    if (!row.updated_at) return false;
    const updated = new Date(row.updated_at);
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    return updated.getTime() >= cutoff.getTime();
  }).length;

  const latestUpdate = rows[0]?.updated_at ? new Date(rows[0].updated_at) : null;

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-brand-base px-4 py-4 text-brand-text sm:px-6 sm:py-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-24 lg:pb-8">
          <section className="rounded-[2.5rem] border border-brand-secondary/20 bg-[linear-gradient(135deg,#7c3aed_0%,#2c2c2c_54%,#1f1f1f_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(44,44,44,0.22)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-primary">
                  <Database className="size-3.5" />
                  regina_contextos
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-balance text-brand-primary sm:text-5xl lg:text-6xl">
                    Contextos de Regina
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                    Revisa los contextos registrados, filtra por estado y elimina
                    individualmente los registros que ya no necesitas.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                >
                  Volver al dashboard
                </Link>
                <Link
                  href="#tabla"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-brand-secondary px-5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Ir a la tabla
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.75rem] border border-border-soft bg-white/90 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#6b7280]">
                Contextos
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{totalContexts}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border-soft bg-white/90 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#6b7280]">
                Con nombre
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{namedContexts}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border-soft bg-white/90 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#6b7280]">
                Vinculados
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{linkedContexts}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border-soft bg-white/90 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#6b7280]">
                Últimas 24 h
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{recentlyUpdated}</p>
              <p className="mt-2 text-sm text-[#5c5c5c]">
                {latestUpdate ? `Última actualización: ${formatDate(latestUpdate)}` : "Sin actividad reciente"}
              </p>
            </div>
          </section>

          <section id="tabla">
            <ReginaContextosTable data={rows} />
          </section>

          <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 px-5 py-4 shadow-[0_20px_50px_rgba(20,16,35,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-brand-text/45">
                  Fuente
                </p>
                <p className="mt-2 text-sm text-brand-text/70">
                  Los datos provienen de PostgreSQL vía Prisma. El borrado se
                  revalida automáticamente en esta misma ruta.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-medium text-brand-secondary">
                <Search className="size-4" />
                {rows.length} contextos cargados
              </div>
            </div>
          </section>
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
