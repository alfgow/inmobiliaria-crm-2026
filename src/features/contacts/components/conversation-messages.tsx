"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type ConversationMessage = {
  id: string;
  rol: string;
  mensaje: string;
  enviado_at: string;
};

type Props = {
  messages: ConversationMessage[];
};

const ROL_CONFIG = {
  prospecto: {
    align: "justify-end",
    bubble: "bg-sky-600 text-white rounded-[1.25rem] rounded-br-sm",
    label: "Prospecto",
    labelAlign: "text-right",
    timeAlign: "text-right",
  },
  regina: {
    align: "justify-start",
    bubble: "bg-violet-600 text-white rounded-[1.25rem] rounded-bl-sm",
    label: "Regina",
    labelAlign: "text-left",
    timeAlign: "text-left",
  },
  asesor: {
    align: "justify-start",
    bubble: "bg-emerald-700 text-white rounded-[1.25rem] rounded-bl-sm",
    label: "Asesor",
    labelAlign: "text-left",
    timeAlign: "text-left",
  },
} as const;

function getConfig(rol: string) {
  return ROL_CONFIG[rol as keyof typeof ROL_CONFIG] ?? ROL_CONFIG.asesor;
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ConversationMessages({ messages }: Props) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 4;

  if (messages.length === 0) {
    return (
      <p className="text-sm italic text-slate-400">
        Sin mensajes registrados.
      </p>
    );
  }

  const displayed = expanded ? messages : messages.slice(-PREVIEW);
  const hidden = messages.length - PREVIEW;

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-950"
      >
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {expanded
          ? "Ocultar mensajes"
          : `Ver ${messages.length} mensaje${messages.length !== 1 ? "s" : ""}`}
      </button>

      {expanded && (
        <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 pr-3">
          {!expanded && hidden > 0 && (
            <p className="text-center text-xs text-slate-400">
              {hidden} mensaje{hidden !== 1 ? "s" : ""} anteriores
            </p>
          )}
          {displayed.map((msg) => {
            const cfg = getConfig(msg.rol);
            return (
              <div key={msg.id} className={`flex ${cfg.align}`}>
                <div className="max-w-[76%]">
                  <p
                    className={`mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 ${cfg.labelAlign}`}
                  >
                    {cfg.label}
                  </p>
                  <div className={`px-4 py-2.5 text-sm leading-relaxed ${cfg.bubble}`}>
                    {msg.mensaje}
                  </div>
                  <p
                    className={`mt-1 px-1 text-[10px] text-slate-400 ${cfg.timeAlign}`}
                  >
                    {formatTime(msg.enviado_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
