"use client";

import { useState, useTransition } from "react";
import {
  BOT_STATUS_VALUES,
  type BotStatus,
  isBotStatus,
} from "@/features/contacts/types/bot-status";
import { updateBotStatus } from "../actions/updateBotStatus";

const BOT_STATUS_LABELS: Record<BotStatus, string> = {
  activo: "Bot activo",
  pausado: "Bot pausado",
  finalizado: "Finalizado",
};

const BOT_STATUS_BADGE: Record<BotStatus, string> = {
  activo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pausado: "border-amber-200 bg-amber-50 text-amber-700",
  finalizado: "border-slate-200 bg-slate-100 text-slate-600",
};

const BOT_STATUS_DOT: Record<BotStatus, string> = {
  activo: "bg-emerald-500",
  pausado: "bg-amber-500",
  finalizado: "bg-slate-400",
};

type Props = {
  conversacionId: string;
  contactoId: string;
  currentStatus: string;
};

export function BotStatusSelect({
  conversacionId,
  contactoId,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState<BotStatus>(
    isBotStatus(currentStatus) ? currentStatus : "activo",
  );
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(value: BotStatus) {
    const prev = status;
    setStatus(value);
    setOpen(false);
    setError(null);

    startTransition(async () => {
      const result = await updateBotStatus(conversacionId, value, contactoId);
      if (!result.success) {
        setStatus(prev);
        setError(result.error);
      }
    });
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${BOT_STATUS_BADGE[status]} ${
          isPending
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:opacity-80"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${BOT_STATUS_DOT[status]}`}
        />
        {BOT_STATUS_LABELS[status]}
        <svg
          className="h-3 w-3"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[164px] rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg">
            {BOT_STATUS_VALUES.map((value) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  value === status
                    ? "font-semibold text-slate-950"
                    : "text-slate-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${BOT_STATUS_DOT[value]}`}
                />
                {BOT_STATUS_LABELS[value]}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
