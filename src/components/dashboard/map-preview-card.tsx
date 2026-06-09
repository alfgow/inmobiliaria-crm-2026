import Link from "next/link";
import { MapPinned, Sparkles } from "lucide-react";

const pins = [
  { className: "left-[18%] top-[26%]" },
  { className: "left-[41%] top-[48%]" },
  { className: "left-[64%] top-[33%]" },
  { className: "left-[78%] top-[60%]" },
];

export function MapPreviewCard() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-border-soft bg-white/90 p-6 shadow-[0_24px_65px_rgba(44,44,44,0.08)] backdrop-blur-xl sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10)_0%,rgba(124,58,237,0)_26%),radial-gradient(circle_at_bottom_right,rgba(210,255,30,0.18)_0%,rgba(210,255,30,0)_26%)]" />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] xl:items-center">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#6b7280]">
            Vista geoespacial
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#2c2c2c] sm:text-3xl">
            Mapa de oportunidades por zona
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#5c5c5c] sm:text-base">
            Detecta inmuebles activos, nuevas captaciones y zonas con mayor
            actividad comercial desde una vista visual y rápida de leer.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-secondary px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-95"
            >
              <MapPinned className="h-4 w-4" />
              Abrir mapa
            </Link>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-border-soft bg-surface-1 px-5 py-3 text-sm font-medium text-[#4b4b4b]">
              <Sparkles className="h-4 w-4 text-brand-secondary" />
              Capas activas
            </div>
          </div>
        </div>

        <div className="relative min-h-[19rem] overflow-hidden rounded-[2rem] border border-border-soft bg-[linear-gradient(180deg,#7c3aed_0%,#2c2c2c_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:min-h-[22rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(210,255,30,0.30)_0%,rgba(210,255,30,0)_34%),radial-gradient(circle_at_72%_72%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_36%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />

          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-primary/15" />
            <div className="absolute left-1/2 top-1/2 h-[84%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            {pins.map((pin, index) => (
              <div key={index} className={`absolute ${pin.className}`}>
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inline-flex h-6 w-6 rounded-full bg-brand-primary/35 blur-sm" />
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-white/90 shadow-[0_0_0_6px_rgba(210,255,30,0.18)]" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-brand-primary shadow-[0_0_18px_rgba(210,255,30,0.85)]" />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
            <div className="max-w-[13rem] rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-200">
                Cobertura
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                Zonas activas y nuevas oportunidades
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-200">
                Estado
              </p>
              <p className="mt-1 text-sm font-medium text-white">En vivo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
