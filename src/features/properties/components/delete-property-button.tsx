"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteProperty } from "@/features/properties/actions/delete-property";

type Props = {
  slug: string;
  title: string;
  className?: string;
};

export function DeletePropertyButton({ slug, title, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar "${title}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteProperty(slug);
      if (result.error) {
        setError(result.error);
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
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Eliminar propiedad
      </button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
