import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { prisma } from "@/lib/prisma";
import { EditContactForm } from "@/features/contacts/components/edit-contact-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContactPage({ params }: PageProps) {
  const { id } = await params;

  let contactId: bigint;
  try {
    contactId = BigInt(id);
  } catch {
    notFound();
  }

  const contact = await prisma.contactos.findFirst({
    where: { id: contactId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      estado: true,
      fuente: true,
    },
  });

  if (!contact) {
    notFound();
  }

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/contactos/${id}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al contacto
            </Link>

            <div className="rounded-full border border-white/10 bg-zinc-950 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-zinc-300 shadow-2xl">
              Editar contacto
            </div>
          </div>

          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

            <div className="relative z-10 space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
                Edición
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {contact.nombre}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-300">
                Modifica los datos del contacto. Los cambios se guardan
                inmediatamente.
              </p>
            </div>
          </section>

          <EditContactForm
            contact={{
              id: contact.id.toString(),
              nombre: contact.nombre,
              telefono: contact.telefono,
              email: contact.email,
              estado: contact.estado ?? "nuevo",
              fuente: contact.fuente,
            }}
          />
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
