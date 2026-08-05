"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X, type LucideIcon } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type DashboardMobileMoreSheetProps = {
  items: NavItem[];
};

export function DashboardMobileMoreSheet({ items }: DashboardMobileMoreSheetProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Más opciones"
        className="flex h-[4.1rem] flex-col items-center justify-center gap-0.5 rounded-[1.1rem] border border-border-soft bg-white/90 px-2 py-1 text-[10px] font-medium text-[#5c5c5c] shadow-sm transition active:scale-[0.98]"
      >
        <MoreHorizontal className="h-[1.1rem] w-[1.1rem] text-[#2c2c2c]" />
        <span className="sr-only">Más</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          <div
            className="absolute inset-x-3 bottom-[5.75rem] z-[80] rounded-[1.5rem] border border-white/60 bg-white/95 p-3 shadow-[0_24px_60px_rgba(44,44,44,0.2)] backdrop-blur-2xl"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="mb-2 flex items-center justify-between px-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#6b7280]">
                Más opciones
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
                      active
                        ? "border border-brand-secondary/20 bg-brand-secondary/10 text-brand-secondary"
                        : "border border-transparent text-[#5c5c5c] hover:bg-surface-2",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-xl border",
                        active
                          ? "border-brand-secondary/20 bg-brand-secondary text-white"
                          : "border-border-soft bg-surface-1 text-[#6b7280]",
                      ].join(" ")}
                    >
                      <Icon className="h-[0.95rem] w-[0.95rem]" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-1 border-t border-border-soft pt-1.5">
                <LogoutButton variant="full" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
