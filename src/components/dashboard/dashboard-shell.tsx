import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { MapPreviewCard } from "@/components/dashboard/map-preview-card";
import { WelcomeCard } from "@/components/dashboard/welcome-card";

const shortcuts = [
  {
    title: "Inmuebles",
    description: "Registrar, editar y publicar inventario.",
    href: "/inmuebles",
  },
  {
    title: "Contactos",
    description: "Buscar prospectos y revisar seguimiento.",
    href: "/contactos",
  },
  {
    title: "Mapa",
    description: "Cruzar oportunidades por ubicación.",
    href: "/mapa",
  },
  {
    title: "Regina contextos",
    description: "Revisar y depurar contextos almacenados.",
    href: "/regina-contextos",
  },
];

export function DashboardShell() {
  return (
    <main className="scrollbar-hide relative min-h-[100dvh] overflow-x-hidden overflow-y-auto px-4 py-4 text-[#2c2c2c] sm:px-6 sm:py-6 lg:px-8">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
          <WelcomeCard />

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <MapPreviewCard />

            <div className="rounded-[2.5rem] border border-border-soft bg-white/85 p-6 shadow-[0_24px_65px_rgba(44,44,44,0.08)] backdrop-blur-xl sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#6b7280]">
                Acciones rápidas
              </p>
              <div className="mt-4 space-y-3">
                {shortcuts.map((shortcut) => (
                  <Link
                    key={shortcut.href}
                    href={shortcut.href}
                    className="group block rounded-[1.5rem] border border-border-soft bg-surface-2 px-4 py-4 transition hover:-translate-y-0.5 hover:border-brand-secondary/20 hover:bg-white hover:shadow-[0_18px_40px_rgba(44,44,44,0.08)]"
                  >
                    <p className="text-base font-semibold text-[#2c2c2c]">
                      {shortcut.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5c5c5c]">
                      {shortcut.description}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-medium text-brand-secondary transition group-hover:text-brand-secondary">
                      Abrir →
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-brand-secondary/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.98)_0%,rgba(44,44,44,0.96)_100%)] p-5 text-white">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-[10px] uppercase tracking-[0.35em]">
                    Enfoque hoy
                  </p>
                </div>
                <p className="mt-3 text-lg font-semibold tracking-tight">
                  Limpia el embudo, publica inventario y responde primero los
                  leads calientes.
                </p>
              </div>
            </div>
          </section>
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
