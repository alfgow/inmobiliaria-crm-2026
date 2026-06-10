"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import { updatePropertyStatus } from "@/features/properties/actions/update-status";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatusOption {
  id: number;
  nombre: string;
  color: string | null;
}

interface Props {
  propertyId: string;
  slug: string;
  current: StatusOption;
  options: StatusOption[];
}

// ── Color helper (same semantic rules as the listing page) ────────────────────

function badgeStyle(nombre: string, color: string | null): { bg: string; fg: string } {
  const n = nombre.toLowerCase();
  if (n === "disponible")
    return { bg: "var(--brand-primary)", fg: "var(--brand-text)" };
  if (n === "reservado")
    return { bg: "#f97316", fg: "#ffffff" };
  if (n === "rentado" || n === "vendido")
    return { bg: "#ef4444", fg: "#ffffff" };
  return { bg: color ? `${color}dd` : "rgba(15,23,42,0.55)", fg: "#ffffff" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatusBadgeSelect({ propertyId, slug, current, options }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<StatusOption>(current);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (option: StatusOption) => {
    if (option.id === selected.id) { setOpen(false); return; }

    const previous = selected;
    setSelected(option); // optimistic
    setOpen(false);
    setError(null);

    startTransition(async () => {
      const result = await updatePropertyStatus(propertyId, option.id, slug);
      if (result.error) {
        setSelected(previous); // rollback
        setError(result.error);
      }
    });
  };

  const { bg, fg } = badgeStyle(selected.nombre, selected.color);

  return (
    <div ref={containerRef} className="relative">
      {/* Badge trigger */}
      <button
        type="button"
        onClick={() => !isPending && setOpen((v) => !v)}
        title="Cambiar estatus"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] transition hover:brightness-90"
        style={{ backgroundColor: bg, color: fg }}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <>
            {selected.nombre}
            <ChevronDown className="size-3 opacity-60" />
          </>
        )}
      </button>

      {/* Error toast */}
      {error && (
        <p className="absolute left-0 top-full mt-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs text-rose-600 shadow-sm whitespace-nowrap">
          {error}
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-border-soft bg-white shadow-[0_20px_50px_rgba(20,16,35,0.14)]">
          <p className="border-b border-border-soft px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text/35">
            Cambiar estatus
          </p>
          <div className="py-1.5">
            {options.map((opt) => {
              const s = badgeStyle(opt.nombre, opt.color);
              const isActive = opt.id === selected.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-brand-surface/70 ${
                    isActive ? "bg-brand-surface/40" : ""
                  }`}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: s.bg }}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      isActive ? "font-semibold text-brand-text" : "font-medium text-brand-text/60"
                    }`}
                  >
                    {opt.nombre}
                  </span>
                  {isActive && <Check className="size-3.5 text-brand-secondary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
