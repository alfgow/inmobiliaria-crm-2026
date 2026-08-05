import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
};

export function PageShell({ eyebrow, title, description, children, actionHref, actionLabel }: Props) {
  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-brand-base px-4 py-6 text-brand-text sm:px-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 pb-24 lg:pb-8">
          <section className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_28px_70px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45 transition hover:text-brand-secondary"
                >
                  <ArrowLeft className="size-3.5" />
                  Dashboard
                </Link>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-secondary">{eyebrow}</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-text sm:text-4xl">{title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-text/60">{description}</p>
                </div>
              </div>
              {actionHref && actionLabel && (
                <Link
                  href={actionHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-text px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary"
                >
                  <Plus className="size-4" />
                  {actionLabel}
                </Link>
              )}
            </div>
          </section>
          {children}
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
