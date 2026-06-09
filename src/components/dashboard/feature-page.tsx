import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";

type FeaturePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  highlights: Array<{
    label: string;
    value: string;
  }>;
};

export function FeaturePage({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  highlights,
}: FeaturePageProps) {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden px-4 py-4 text-[#2c2c2c] sm:px-6 sm:py-6 lg:px-8">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
          <section className="rounded-[2.5rem] border border-brand-secondary/20 bg-[linear-gradient(135deg,#7c3aed_0%,#2c2c2c_55%,#1f1f1f_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(44,44,44,0.22)] sm:px-8 sm:py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-brand-primary/90">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              {description}
            </p>
            <Link
              href={backHref}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-5 py-3 text-sm font-semibold text-[#2c2c2c] transition hover:-translate-y-0.5 hover:brightness-95"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.75rem] border border-border-soft bg-white/85 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)] backdrop-blur-xl"
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#6b7280]">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {item.value}
                </p>
              </div>
            ))}
          </section>
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
