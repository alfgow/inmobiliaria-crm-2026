"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  slug: string;
};

export function DownloadPdfButton({ slug }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleDownload = async () => {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const res = await fetch(`/api/inmuebles/pdf?slug=${encodeURIComponent(slug)}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Error al generar el PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ficha-${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={status === "loading"}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border-soft bg-white text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary disabled:pointer-events-none disabled:opacity-60"
    >
      {status === "loading" ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Generando ficha…
        </>
      ) : status === "error" ? (
        <>
          <FileText className="size-4 text-rose-500" />
          <span className="text-rose-500">Error al generar</span>
        </>
      ) : (
        <>
          <FileText className="size-4" />
          Descargar ficha técnica
        </>
      )}
    </button>
  );
}
