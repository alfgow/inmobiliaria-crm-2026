"use client";

import { useState, useTransition } from "react";
import { Laptop2, Loader2, ShieldCheck, Trash2 } from "lucide-react";

import { revokeDevice } from "@/features/auth/actions/revoke-device";
import { trustDevice } from "@/features/auth/actions/trust-device";

export type TrustedDeviceListItem = {
  id: string;
  label: string;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
};

type TrustedDevicesPanelProps = {
  devices: TrustedDeviceListItem[];
  hasActiveEnrollment: boolean;
  hasTrustedCurrentDevice: boolean;
};

export function TrustedDevicesPanel({
  devices,
  hasActiveEnrollment,
  hasTrustedCurrentDevice,
}: TrustedDevicesPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleTrustCurrentDevice() {
    setMessage(null);
    startTransition(async () => {
      const result = await trustDevice();
      setMessage(result.message);
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-neutral-400">
            Whitelist de dispositivos
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">
            Dispositivos de confianza
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            El reconocimiento facial solo funciona en los dispositivos que
            confirmes aqui.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-border-soft bg-white px-3 py-1 text-xs font-medium text-neutral-500">
          {devices.length} activo{devices.length === 1 ? "" : "s"}
        </span>
      </div>

      {!hasTrustedCurrentDevice ? (
        <button
          type="button"
          onClick={handleTrustCurrentDevice}
          disabled={isPending || !hasActiveEnrollment}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          Confiar en este dispositivo
        </button>
      ) : null}

      {!hasActiveEnrollment ? (
        <p className="mt-3 text-xs text-neutral-400">
          Registra tu rostro primero para poder confiar en un dispositivo.
        </p>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl border border-border-soft bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {message}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-soft bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
            Aun no hay dispositivos de confianza.
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Laptop2 className="size-4 text-neutral-400" />
                  <p className="font-semibold text-neutral-900">{device.label}</p>
                  {device.isCurrent ? (
                    <span className="rounded-full bg-brand-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                      Este dispositivo
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
                  <span>Confiado: {device.createdAt}</span>
                  <span>Ultimo uso: {device.lastUsedAt}</span>
                </div>
              </div>

              <form action={revokeDevice}>
                <input type="hidden" name="id" value={device.id} />
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
  );
}
