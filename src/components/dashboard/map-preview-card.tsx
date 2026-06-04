import Link from "next/link";

const pins = [
  { className: "left-[18%] top-[28%]" },
  { className: "left-[43%] top-[46%]" },
  { className: "left-[66%] top-[34%]" },
  { className: "left-[78%] top-[62%]" },
];

export function MapPreviewCard() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 px-6 py-6 text-white shadow-2xl sm:px-8 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18)_0%,rgba(56,189,248,0)_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16)_0%,rgba(168,85,247,0)_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
            Vista geoespacial
          </p>

          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Mapa de inmuebles
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
            Visualiza la ubicación de tus propiedades activas y detecta oportunidades por zona.
          </p>

          <Link
            href="/mapa"
            className="mt-6 inline-flex items-center text-sm font-medium text-white/85 transition hover:text-white"
          >
            Abrir mapa completo →
          </Link>
        </div>

        <div className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:min-h-[22rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.22)_0%,rgba(56,189,248,0)_34%),radial-gradient(circle_at_70%_72%,rgba(168,85,247,0.2)_0%,rgba(168,85,247,0)_36%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />
          <div className="absolute inset-x-8 top-10 h-28 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute left-4 top-4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
          <div className="absolute right-4 top-4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

          <div className="absolute inset-0 opacity-90">
            <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/10" />
            <div className="absolute left-1/2 top-1/2 h-[84%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10" />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />

          <div className="absolute inset-0">
            {pins.map((pin, index) => (
              <div
                key={index}
                className={`absolute ${pin.className}`}
              >
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inline-flex h-6 w-6 rounded-full bg-sky-400/30 blur-sm" />
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-white/90 shadow-[0_0_0_6px_rgba(56,189,248,0.12)]" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.8)]" />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div className="max-w-[12rem] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                Cobertura
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                Zonas activas y nuevas oportunidades
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
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
