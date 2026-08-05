"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Database,
  Compass,
  LayoutDashboard,
  MessageCircle,
  Settings2,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ContactSearchButton } from "@/components/dashboard/contact-search-button";
import { DashboardMobileMoreSheet } from "@/components/dashboard/dashboard-mobile-more-sheet";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inmuebles", label: "Inmuebles", icon: Compass },
  { href: "/contactos", label: "Contactos", icon: Users },
  { href: "/mapa", label: "Mapa", icon: BarChart3 },
  { href: "/blog", label: "Blog", icon: MessageCircle },
  { href: "/regina-contextos", label: "Regina", icon: Database },
  { href: "/configuracion", label: "Ajustes", icon: Settings2 },
];

const adminOnlyItem = { href: "/usuarios", label: "Usuarios", icon: UserCog };

function getNavigationItems(isAdmin: boolean) {
  return isAdmin ? [...navigationItems, adminOnlyItem] : navigationItems;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
        active
          ? "border border-brand-secondary/20 bg-brand-secondary/10 text-brand-secondary shadow-[0_12px_30px_rgba(124,58,237,0.08)]"
          : "text-[#5c5c5c] hover:bg-surface-1/80 hover:text-[#2c2c2c]",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-8 w-8 items-center justify-center rounded-xl border transition",
          active
            ? "border-brand-secondary/20 bg-brand-secondary text-white"
            : "border-border-soft bg-surface-1 text-[#6b7280] group-hover:border-brand-secondary/20 group-hover:text-[#2c2c2c]",
        ].join(" ")}
      >
        <Icon className="h-[0.95rem] w-[0.95rem]" />
      </span>
      <span>{label}</span>
    </Link>
  );
}

export function DashboardNavbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = getNavigationItems(isAdmin);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/dashboard") : pathname.startsWith(href);

  return (
    <aside className="relative hidden w-full max-w-[17rem] overflow-hidden rounded-[2rem] border border-border-soft bg-white/85 p-3.5 text-[#2c2c2c] shadow-[0_24px_70px_rgba(44,44,44,0.08)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/75 lg:flex lg:max-h-[calc(100dvh-3rem)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(243,241,236,0.88)_40%,rgba(246,251,248,0.35)_100%)]" />
      <div className="absolute -left-24 top-0 h-44 w-44 rounded-full bg-brand-secondary/12 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-44 w-44 rounded-full bg-brand-primary/28 blur-3xl" />

      <div className="relative flex h-full flex-col gap-3.5">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.36em] text-[#6b7280]">
              Centro de operaciones
            </p>
            <p className="mt-1 text-[1.05rem] font-semibold tracking-tight text-[#2c2c2c]">
              Villanueva García
            </p>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="flex flex-col gap-1.5">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </nav>

        <ContactSearchButton variant="sidebar" />
      </div>
    </aside>
  );
}

export function DashboardMobileDock({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = getNavigationItems(isAdmin);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/dashboard") : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-3 bottom-3 z-[60] grid grid-cols-6 gap-1.5 rounded-[1.4rem] border border-white/50 bg-white/55 p-1.5 text-[#2c2c2c] shadow-[0_18px_50px_rgba(44,44,44,0.14)] backdrop-blur-3xl supports-[backdrop-filter]:bg-white/55 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.25rem)" }}
    >
      {items.slice(0, 4).map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex h-[4.1rem] flex-col items-center justify-center rounded-[1.1rem] border px-2 py-1 text-[10px] font-medium shadow-sm transition active:scale-[0.98]",
              active
                ? "border-brand-secondary/20 bg-brand-secondary/10 text-brand-secondary"
                : "border-border-soft bg-white/90 text-[#5c5c5c]",
            ].join(" ")}
          >
            <Icon className={["h-[1.1rem] w-[1.1rem]", active ? "text-brand-secondary" : "text-[#2c2c2c]"].join(" ")} />
            <span className="sr-only">{item.label}</span>
          </Link>
        );
      })}
      <ContactSearchButton variant="dock" />
      <DashboardMobileMoreSheet items={items.slice(4)} />
    </nav>
  );
}
