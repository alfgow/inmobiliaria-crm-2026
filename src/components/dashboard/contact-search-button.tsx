"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ContactSearchResponse = {
  results: Array<{
    id: string;
    nombre: string;
    email: string | null;
    telefono: string;
    fuente: string | null;
    createdAt: string | null;
  }>;
};

type SearchState = "idle" | "loading" | "success" | "empty" | "error";

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ContactResultCard({
  contact,
}: {
  contact: ContactSearchResponse["results"][number];
}) {
  return (
    <Link
      href={`/contactos/${contact.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-950">
            {contact.nombre}
          </p>
          <p className="mt-1 text-sm text-slate-600">{contact.telefono}</p>
          {contact.email ? (
            <p className="mt-1 text-sm text-slate-500">{contact.email}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Fuente
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {contact.fuente ?? "Sin dato"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{formatDate(contact.createdAt)}</p>
      <span className="mt-3 inline-flex text-sm font-medium text-slate-900 transition group-hover:text-sky-700">
        Ver contacto →
      </span>
    </Link>
  );
}

export function ContactSearchButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactSearchResponse["results"]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [message, setMessage] = useState(
    "Ingresa teléfono, nombre o correo para revisar si ya existe.",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const showIntroCentered = state === "idle" && results.length === 0 && !errorMessage;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  const openModal = () => {
    setIsOpen(true);
    setQuery("");
    setResults([]);
    setState("idle");
    setMessage("Ingresa teléfono, nombre o correo para revisar si ya existe.");
    setErrorMessage("");
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const searchContacts = async () => {
    const rawQuery = query.trim();

    if (!rawQuery) {
      setErrorMessage("Escribe un teléfono, nombre o correo.");
      inputRef.current?.focus();
      return;
    }

    setErrorMessage("");
    setState("loading");

    try {
      const response = await fetch(
        `/api/contactos/search?q=${encodeURIComponent(rawQuery)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        setState("error");
        setMessage("No pudimos buscar. Intenta de nuevo en unos segundos.");
        setResults([]);
        return;
      }

      const data = (await response.json()) as ContactSearchResponse;
      setResults(data.results);
      setState(data.results.length > 0 ? "success" : "empty");
      setMessage(
        data.results.length > 0
          ? `Encontramos ${data.results.length} coincidencia(s).`
          : "Puedes intentar con otro teléfono, nombre o correo.",
      );
    } catch {
      setState("error");
      setMessage("No pudimos buscar. Intenta de nuevo en unos segundos.");
      setResults([]);
    }
  };

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6"
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-2xl overflow-visible rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.22)]">
        <button
          type="button"
          onClick={closeModal}
          aria-label="Cerrar modal"
          className="absolute -right-3 -top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_16px_34px_rgba(220,38,38,0.36)] transition hover:bg-red-700 sm:-right-5 sm:-top-5"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        <div className="border-b border-slate-200 px-6 py-5 text-center sm:px-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            Centro de operaciones
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Buscar contacto
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Ingresa teléfono, nombre o correo para revisar si ya existe.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="space-y-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void searchContacts();
                }
              }}
              type="text"
              placeholder="Teléfono, nombre o correo"
              className="w-full rounded-2xl border border-sky-300 bg-slate-50 px-4 py-3 text-center text-slate-900 placeholder:text-center placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
            <p className={`text-sm text-red-500 ${errorMessage ? "" : "hidden"}`}>
              {errorMessage}
            </p>
          </div>

          <p className={`text-sm text-slate-600 ${showIntroCentered ? "text-center" : ""}`}>
            {message}
          </p>

          <div className="max-h-[18rem] space-y-3 overflow-y-auto pr-1">
            {state === "loading" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                Buscando contacto...
              </div>
            ) : null}

            {state === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                {message}
              </div>
            ) : null}

            {results.map((contact) => (
              <ContactResultCard key={contact.id} contact={contact} />
            ))}

            {state === "empty" ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                <p>No encontramos coincidencias.</p>
                <Link
                  href={`/contactos/nuevo?telefono=${encodeURIComponent(query.trim())}`}
                  className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
                >
                  Registrar nuevo contacto
                </Link>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={() => void searchContacts()}
              className="min-w-[8.5rem] rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)] transition hover:bg-emerald-700"
            >
              {state === "loading" ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="group rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-left transition hover:-translate-y-1 hover:bg-white/[0.1]"
      >
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-zinc-950">
          +
        </div>

        <h2 className="text-xl font-semibold">Nuevo Contacto</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Registra un prospecto, cliente o interesado.
        </p>

        <span className="mt-6 inline-flex text-sm font-medium text-white/80 group-hover:text-white">
          Buscar contacto →
        </span>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(modal, document.body)
        : null}
    </>
  );
}
