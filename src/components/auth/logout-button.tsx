"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

type LogoutButtonProps = {
  variant?: "icon" | "full";
};

export function LogoutButton({ variant = "icon" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-500">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        </span>
        Cerrar sesión
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      title="Cerrar sesión"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-soft bg-surface-1 text-[#5c5c5c] shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </button>
  );
}
