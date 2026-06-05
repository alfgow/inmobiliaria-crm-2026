import Link from "next/link";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(value);
}

export default async function ContactsPage() {
  const [contacts, totalContacts, totalInterests, totalComments] =
    await Promise.all([
      prisma.contactos.findMany({
        orderBy: { created_at: "desc" },
        take: 12,
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          fuente: true,
          created_at: true,
        },
      }),
      prisma.contactos.count(),
      prisma.intereses.count(),
      prisma.comentarios.count(),
    ]);

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-10">
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
                  Directorio de contactos
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Selecciona un contacto para ver su información, propiedades
                  de interés e interacciones registradas.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex w-fit items-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white/90 transition hover:bg-white/[0.1] hover:text-white"
              >
                Volver al dashboard
              </Link>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Contactos", value: totalContacts },
              { label: "Intereses", value: totalInterests },
              { label: "Comentarios", value: totalComments },
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
                  Últimos registros
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Contactos recientes
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Usa el buscador del dashboard para localizar un contacto
                específico.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {contacts.map((contact) => (
                <Link
                  key={contact.id.toString()}
                  href={`/contactos/${contact.id.toString()}`}
                  className="group rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {contact.nombre}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {contact.telefono}
                      </p>
                      {contact.email ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {contact.email}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                      {contact.fuente ?? "Sin fuente"}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                    <span>{formatDate(contact.created_at)}</span>
                    <span className="font-medium text-slate-900 transition group-hover:text-sky-700">
                      Ver contacto →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
