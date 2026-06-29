"use client";

import { useActionState, useState } from "react";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";

import {
  createApiKey,
  deleteApiKey,
  type CreateApiKeyActionState,
} from "@/features/api-users/actions/manage-api-keys";

export type ApiKeyListItem = {
  id: string;
  name: string;
  prefix: string;
  allowedIp: string | null;
  createdAt: string;
  lastUsedAt: string;
};

const initialState: CreateApiKeyActionState = {
  success: false,
  message: "",
};

type ApiKeysPanelProps = {
  apiKeys: ApiKeyListItem[];
  baseUrl: string;
};

export function ApiKeysPanel({ apiKeys, baseUrl }: ApiKeysPanelProps) {
  const [state, formAction, isPending] = useActionState(createApiKey, initialState);
  const [copied, setCopied] = useState(false);

  const sampleKey = state.apiKey ?? "crm_xxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  const curlExample = `curl -H "Authorization: Bearer ${sampleKey}" "${baseUrl}/api/v1/inmuebles?perPage=10"`;

  async function copyApiKey() {
    if (!state.apiKey) return;

    try {
      await navigator.clipboard.writeText(state.apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-brand-text">
            <KeyRound className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-text/45">
              Acceso externo
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand-text">
              Nueva API key
            </h2>
            <p className="mt-2 text-sm leading-6 text-brand-text/60">
              Crea una llave para integraciones externas. La llave completa se
              muestra una sola vez.
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-key-name" className="text-xs font-semibold text-brand-text/70">
              Nombre
            </label>
            <input
              id="api-key-name"
              name="name"
              type="text"
              minLength={3}
              maxLength={80}
              required
              placeholder="Sitio web publico"
              className="h-12 w-full rounded-2xl border border-border-soft bg-white px-4 text-sm text-brand-text outline-none transition placeholder:text-brand-text/30 focus:border-brand-secondary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="api-key-ip" className="text-xs font-semibold text-brand-text/70">
              IP permitida
              <span className="ml-1 font-normal text-brand-text/35">(opcional)</span>
            </label>
            <input
              id="api-key-ip"
              name="allowedIp"
              type="text"
              placeholder="203.0.113.10"
              className="h-12 w-full rounded-2xl border border-border-soft bg-white px-4 text-sm text-brand-text outline-none transition placeholder:text-brand-text/30 focus:border-brand-secondary"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-sm font-semibold text-brand-text transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creando llave
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                Crear API key
              </>
            )}
          </button>
        </form>

        {state.message ? (
          <div
            className={[
              "mt-5 rounded-2xl border px-4 py-3 text-sm",
              state.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            {state.message}
          </div>
        ) : null}

        {state.apiKey ? (
          <div className="mt-4 rounded-2xl border border-brand-secondary/20 bg-brand-secondary/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-text/45">
                  Llave completa
                </p>
                <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-xl bg-white px-3 py-2 text-xs text-brand-text shadow-sm">
                  {state.apiKey}
                </code>
              </div>
              <button
                type="button"
                onClick={copyApiKey}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border-soft bg-white px-4 text-xs font-semibold text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copiada" : "Copiar"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-text/45">
              Credenciales
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand-text">
              API keys activas
            </h2>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-border-soft bg-white px-3 py-1 text-xs font-medium text-brand-text/60">
            {apiKeys.length} activa{apiKeys.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {apiKeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-soft bg-brand-surface/60 px-4 py-6 text-sm text-brand-text/55">
              Aun no hay llaves creadas para integraciones externas.
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-brand-text">{apiKey.name}</p>
                    <code className="rounded-full bg-brand-surface px-2.5 py-1 text-[11px] text-brand-text/55">
                      {apiKey.prefix}...
                    </code>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-text/45">
                    <span>Creada: {apiKey.createdAt}</span>
                    <span>Ultimo uso: {apiKey.lastUsedAt}</span>
                    <span>IP: {apiKey.allowedIp ?? "sin restriccion"}</span>
                  </div>
                </div>

                <form action={deleteApiKey}>
                  <input type="hidden" name="id" value={apiKey.id} />
                  <button
                    type="submit"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 sm:w-auto"
                  >
                    <Trash2 className="size-4" />
                    Revocar
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border-soft/80 bg-[#111827] p-5 text-white shadow-[0_22px_55px_rgba(20,16,35,0.12)] xl:col-span-2 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-primary">
              Primer request
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Consulta inmuebles desde una integracion
            </h2>
          </div>
          <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
            GET /api/v1/inmuebles
          </span>
        </div>

        <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-100">
          <code>{curlExample}</code>
        </pre>
      </section>
    </div>
  );
}

