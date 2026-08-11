"use client";

import { useEffect, useRef } from "react";
import { Bot, MessageCircle, User, X } from "lucide-react";
import Link from "next/link";

import type { ReginaContextoRow } from "./regina-contextos-table";

type ChatMessage = {
  ts: string;
  rol: string;
  mensaje: string;
};

function parseHistorial(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ChatMessage =>
      typeof item === "object" &&
      item !== null &&
      "ts" in item &&
      "rol" in item &&
      "mensaje" in item,
  );
}

function formatTime(ts: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Mexico_City",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

function formatDate(ts: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeZone: "America/Mexico_City",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

type Props = {
  row: ReginaContextoRow;
  onClose: () => void;
};

export function ChatHistorialModal({ row, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const messages = parseHistorial(row.historial);

  // Group messages by date for date separators
  const groupedMessages: { date: string; items: (ChatMessage & { index: number })[] }[] = [];
  for (const [i, msg] of messages.entries()) {
    const date = formatDate(msg.ts);
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== date) {
      groupedMessages.push({ date, items: [{ ...msg, index: i }] });
    } else {
      last.items.push({ ...msg, index: i });
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:px-4 sm:py-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default bg-slate-950/65 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 flex h-dvh min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-none shadow-[0_40px_100px_rgba(0,0,0,0.55)] sm:h-auto sm:max-h-[88dvh] sm:rounded-[2rem]"
        style={{
          background: "linear-gradient(160deg, #1a1b26 0%, #0f1117 60%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div className="relative shrink-0 border-b border-white/8 px-4 py-4 pr-14 sm:px-5 sm:pr-14">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-secondary/25 text-brand-secondary">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/contactos/${row.contacto_id}`}
                className="block truncate font-semibold text-white transition hover:text-brand-primary hover:underline"
              >
                {row.nombre ?? "Sin nombre"}
              </Link>
              <Link
                href={`/contactos/${row.contacto_id}`}
                className="block truncate font-mono text-[11px] text-white/45 transition hover:text-brand-primary hover:underline"
              >
                {row.telefono}
              </Link>
            </div>
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 sm:ml-[52px]">
            {row.inmueble_id && (
              <span className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/55">
                Inmueble #{row.inmueble_id}
              </span>
            )}
            <span
              className={[
                "max-w-full truncate rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em]",
                (row.status ?? "").toLowerCase().includes("activ") || (row.status ?? "").toLowerCase().includes("open")
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                  : "border-white/10 bg-white/5 text-white/45",
              ].join(" ")}
            >
              {row.status ?? "sin estado"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Chat area */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <MessageCircle className="size-7 text-white/25" />
              </div>
              <p className="mt-4 text-sm font-medium text-white/40">
                Sin mensajes en el historial
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/35">
                      {group.date}
                    </span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>

                  <div className="flex flex-col gap-2">
                    {group.items.map((msg) => {
                      const isRegina = msg.rol === "regina";
                      const lines = msg.mensaje.split("\n");

                      return (
                        <div
                          key={msg.index}
                          className={[
                            "flex min-w-0 items-end gap-2",
                            isRegina ? "flex-row" : "flex-row-reverse",
                          ].join(" ")}
                        >
                          {/* Avatar */}
                          <div
                            className={[
                              "flex size-6 shrink-0 items-center justify-center rounded-full mb-1",
                              isRegina
                                ? "bg-brand-secondary/30 text-brand-secondary"
                                : "bg-slate-600/60 text-slate-300",
                            ].join(" ")}
                          >
                            {isRegina ? (
                              <Bot className="size-3" />
                            ) : (
                              <User className="size-3" />
                            )}
                          </div>

                          {/* Bubble + time */}
                          <div
                            className={[
                              "flex min-w-0 max-w-[82%] flex-col gap-1 sm:max-w-[76%]",
                              isRegina ? "items-start" : "items-end",
                            ].join(" ")}
                          >
                            <div
                              className={[
                                "max-w-full whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-[1.6] [overflow-wrap:anywhere] sm:px-4",
                                isRegina
                                  ? "rounded-bl-[4px] bg-brand-secondary/20 text-white"
                                  : "rounded-br-[4px] bg-slate-600/70 text-white/90",
                              ].join(" ")}
                            >
                              {lines.join("\n")}
                            </div>
                            <p
                              className={[
                                "px-1 text-[10px] text-white/30",
                                isRegina ? "" : "text-right",
                              ].join(" ")}
                            >
                              {isRegina ? "Regina · " : "Prospecto · "}
                              {formatTime(msg.ts)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/8 px-5 py-3">
          <p className="text-center text-[11px] text-white/25">
            {messages.length} mensaje{messages.length !== 1 ? "s" : ""} · Historial de conversación WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
