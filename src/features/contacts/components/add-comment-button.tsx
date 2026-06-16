"use client";

import { Loader2, MessageSquarePlus, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { createComment } from "@/features/contacts/actions/createComment";

type Props = {
  contactId: string;
};

export function AddCommentButton({ contactId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isPending]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  function closeModal() {
    setOpen(false);
    setText("");
    setError(null);
    setSuccess(false);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createComment(contactId, text);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(closeModal, 800);
    });
  }

  const charCount = text.length;
  const isOverLimit = charCount > 2000;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar comentario"
        className="fixed bottom-28 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-zinc-950 shadow-[0_8px_32px_rgba(210,255,30,0.4)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(210,255,30,0.5)] active:translate-y-0 lg:bottom-8 lg:right-6"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Cerrar modal"
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => !isPending && closeModal()}
          />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#12131a] text-white shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
                  <MessageSquarePlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/45">
                    Nuevo comentario
                  </p>
                  <h3 className="mt-0.5 text-base font-semibold tracking-tight text-white">
                    Agregar nota al contacto
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isPending && closeModal()}
                disabled={isPending}
                className="rounded-full p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (!isOverLimit && text.trim()) handleSubmit();
                    }
                  }}
                  placeholder="Escribe tu comentario aquí..."
                  rows={5}
                  disabled={isPending || success}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-7 text-white placeholder-white/30 outline-none transition focus:border-sky-500/50 focus:bg-white/[0.07] disabled:opacity-60"
                />
                <p
                  className={`mt-1 text-right text-xs ${
                    isOverLimit ? "text-rose-400" : "text-white/30"
                  }`}
                >
                  {charCount} / 2000
                </p>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  Comentario guardado correctamente.
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-white/30">
                  <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘ Enter
                  </kbd>{" "}
                  para enviar
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || isOverLimit || !text.trim() || success}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
