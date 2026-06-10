"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

interface Props {
  initialQuery: string;
}

export function ContactsSearchInput({ initialQuery }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = (q: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsPending(true);
      const url = q.trim() ? `/contactos?q=${encodeURIComponent(q.trim())}` : "/contactos";
      router.replace(url, { scroll: false });
      // Clear pending after navigation completes
      setTimeout(() => setIsPending(false), 400);
    }, 280);
  };

  const handleChange = (v: string) => {
    setValue(v);
    push(v);
  };

  const handleClear = () => {
    setValue("");
    clearTimeout(timerRef.current);
    router.replace("/contactos", { scroll: false });
  };

  return (
    <div className="relative w-full">
      {/* Search icon */}
      <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
        {isPending ? (
          <Loader2 className="size-5 animate-spin text-brand-text/35" />
        ) : (
          <Search className="size-5 text-brand-text/35" />
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Nombre, teléfono o correo…"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        className="h-16 w-full rounded-[1.75rem] border border-border-soft bg-white pl-14 pr-14 text-base text-brand-text shadow-[0_20px_60px_rgba(20,16,35,0.10)] outline-none transition placeholder:text-brand-text/30 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 sm:text-lg"
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-4 flex items-center px-1 text-brand-text/30 transition hover:text-brand-text/70"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}
