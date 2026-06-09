import Link from "next/link";
import { Clock3, Compass, Search } from "lucide-react";

import { ContactSearchButton } from "@/components/dashboard/contact-search-button";

export function WelcomeCard() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-brand-secondary/20 bg-[linear-gradient(135deg,#7c3aed_0%,#2c2c2c_54%,#1f1f1f_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(44,44,44,0.22)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-brand-primary/32 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand-primary/18 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_30%),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px] opacity-50" />

      <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)] xl:items-end">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-brand-primary sm:text-5xl lg:text-6xl">
            Centro de Operaciones Villanueva García
          </h1>

          <div className="mt-8 flex flex-wrap gap-3">
            <ContactSearchButton variant="sidebar" />
            <Link
              href="/inmuebles/nuevo"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <Compass className="h-4 w-4" />
              Nuevo inmueble
            </Link>
            <Link
              href="/contactos"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              <Search className="h-4 w-4" />
              Ver directorio
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Siguiente paso
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Captura un lead antes de perder contexto
                </p>
              </div>
              <div className="rounded-2xl bg-brand-primary/20 p-3 text-[#2c2c2c]">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              Usa la búsqueda para comprobar si el contacto ya existe y
              acelerar el seguimiento comercial.
            </p>
            <div className="mt-5">
              <ContactSearchButton />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
