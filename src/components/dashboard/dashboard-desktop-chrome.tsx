import { Bell, UserCircle2 } from "lucide-react";

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { LogoutButton } from "@/components/auth/logout-button";
import type { SessionUser } from "@/lib/session";

interface Props {
  user: SessionUser | null;
}

export function DashboardDesktopChrome({ user }: Props) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <>
      <div className="fixed left-4 top-4 z-40 hidden h-[calc(100dvh-2rem)] w-[19rem] lg:block">
        <DashboardNavbar />
      </div>

      <div className="fixed left-[22rem] right-4 top-4 z-30 hidden lg:block">
        <header className="rounded-[2rem] border border-border-soft bg-white/85 px-5 py-4 shadow-[0_16px_45px_rgba(44,44,44,0.06)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#6b7280]">
                CRM inmobiliario
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Sala de control diaria
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border-soft bg-surface-1 text-[#5c5c5c] shadow-sm transition hover:-translate-y-0.5 hover:text-[#2c2c2c]"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-1 px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-secondary text-sm font-bold text-white">
                  {user ? initials : <UserCircle2 className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2c2c2c]">
                    {user?.name ?? "—"}
                  </p>
                  <p className="text-xs text-[#6b7280] capitalize">
                    {user?.role ?? ""}
                  </p>
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>
      </div>
    </>
  );
}
