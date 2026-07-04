"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateContactStatus } from "@/features/contacts/actions/updateContactStatus";
import {
  CONTACT_STATUS_OPTIONS,
  contactStatusBadgeClass,
  type ContactStatus,
} from "@/features/contacts/types/contact-status";

type ContactStatusSelectProps = {
  contactId: string;
  currentStatus: ContactStatus;
};

export function ContactStatusSelect({
  contactId,
  currentStatus,
}: ContactStatusSelectProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ContactStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(nextStatus: ContactStatus) {
    if (nextStatus === selectedStatus) {
      setOpen(false);
      return;
    }

    const previousStatus = selectedStatus;
    setSelectedStatus(nextStatus);
    setOpen(false);
    setError(null);

    startTransition(async () => {
      const result = await updateContactStatus(contactId, nextStatus);

      if (!result.success) {
        setSelectedStatus(previousStatus);
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  const selectedOption = CONTACT_STATUS_OPTIONS.find(
    (option) => option.value === selectedStatus,
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !isPending && setOpen((value) => !value)}
        disabled={isPending}
        aria-expanded={open}
        title="Cambiar estado"
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-70 ${contactStatusBadgeClass(
          selectedStatus,
        )}`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {selectedOption?.label ?? selectedStatus}
      </button>

      {error && (
        <p className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow-lg">
          {error}
        </p>
      )}

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
          <p className="border-b border-slate-100 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            Cambiar estado
          </p>
          <div className="py-1.5">
            {CONTACT_STATUS_OPTIONS.map((option) => {
              const isActive = option.value === selectedStatus;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                    isActive ? "bg-slate-50 text-slate-950" : "text-slate-600"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full border ${contactStatusBadgeClass(
                      option.value,
                    )}`}
                  />
                  <span className="flex-1 font-medium">{option.label}</span>
                  {isActive && <Check className="h-4 w-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
