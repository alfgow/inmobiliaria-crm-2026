"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  slug: string;
  photoCount: number;
};

export function DownloadPhotosButton({ slug, photoCount }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleDownload = async () => {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const res = await fetch(`/api/inmuebles/download-photos?slug=${encodeURIComponent(slug)}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Error al generar el ZIP");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? `fotos-${slug}.zip`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
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
          Generando ZIP…
        </>
      ) : status === "error" ? (
        <>
          <Download className="size-4 text-rose-500" />
          <span className="text-rose-500">Error al descargar</span>
        </>
      ) : (
        <>
          <Download className="size-4" />
          Descargar fotos ({photoCount})
        </>
      )}
    </button>
  );
}
