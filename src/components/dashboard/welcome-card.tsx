import Link from "next/link";

import { ContactSearchButton } from "@/components/dashboard/contact-search-button";

export function WelcomeCard() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-12">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative z-10 max-w-3xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
          Centro de Operaciones
        </p>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Buenos días, Alfonso 👋
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
          ¿Qué quieres hacer hoy? Empieza registrando un nuevo contacto o
          agregando un inmueble al inventario.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ContactSearchButton />

          <Link
            href="/inmuebles/nuevo"
            className="group rounded-3xl border border-white/10 bg-white/[0.06] p-5 transition hover:-translate-y-1 hover:bg-white/[0.1]"
          >
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-zinc-950">
              🏠
            </div>

            <h2 className="text-xl font-semibold">Nuevo Inmueble</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Agrega una propiedad con fotos, precio y ubicación.
            </p>

            <span className="mt-6 inline-flex text-sm font-medium text-white/80 group-hover:text-white">
              Registrar inmueble →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
