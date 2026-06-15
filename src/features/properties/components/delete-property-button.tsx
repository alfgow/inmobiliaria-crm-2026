"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { deleteProperty } from "@/features/properties/actions/delete-property";

type Props = {
  slug: string;
  title: string;
  className?: string;
};

export function DeletePropertyButton({ slug, title, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteProperty(slug);
      if (result.error) {
        setError(result.error);
        setOpen(true);
        return;
      }

      router.push("/inmuebles");
      router.refresh();
    });
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Eliminar propiedad
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => !isPending && setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#12131a] text-white shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">
                    Eliminar inmueble
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
                    Esta acción no se puede deshacer
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Vas a eliminar <span className="font-semibold text-white">{title}</span>, incluyendo sus imágenes, intereses y relaciones asociadas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isPending && setOpen(false)}
                  className="rounded-full p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:pointer-events-none disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
