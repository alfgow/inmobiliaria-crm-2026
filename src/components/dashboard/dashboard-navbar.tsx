import Link from "next/link";
import Image from "next/image";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "/dashboard/icons/dashboard.png",
  },
  {
    href: "/inmuebles",
    label: "Inmuebles",
    icon: "/dashboard/icons/inmuebles.png",
  },
  {
    href: "/contactos",
    label: "Contactos",
    icon: "/dashboard/icons/contactos.png",
  },
  {
    href: "/mapa",
    label: "Mapa",
    icon: "/dashboard/icons/mapa.png",
  },
];

export function DashboardNavbar() {
  return (
    <aside className="relative hidden w-full max-w-[19rem] overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/70 p-4 text-zinc-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55 lg:flex lg:max-h-[calc(100dvh-3rem)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.55)_42%,rgba(191,219,254,0.15)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/80" />
      <div className="absolute -left-24 top-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold tracking-[0.2em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            CRM
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
              Centro de operaciones
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Administración premium de inmuebles, contactos y mapa.
            </p>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/inmuebles/nuevo"
          className="mt-auto rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Nuevo inmueble
        </Link>
      </div>
    </aside>
  );
}

export function DashboardMobileDock() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-5 bottom-4 z-[60] grid grid-cols-4 gap-2 rounded-[1.5rem] border border-white/70 bg-white/85 p-2 text-zinc-950 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/65 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.35rem)" }}
    >
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex h-[4.4rem] flex-col items-center justify-center rounded-[1.2rem] border border-slate-200/80 bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm transition active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[0.85rem] bg-transparent">
            <Image
              alt=""
              src={item.icon}
              width={120}
              height={120}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="sr-only">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
