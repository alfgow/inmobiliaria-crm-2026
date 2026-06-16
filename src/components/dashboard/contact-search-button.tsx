"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Plus, X } from "lucide-react";

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

type ContactSearchModalContextValue = {
  open: () => void;
};

const ContactSearchModalContext =
  createContext<ContactSearchModalContextValue | null>(null);

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
  onClose,
}: {
  contact: ContactSearchResponse["results"][number];
  onClose: () => void;
}) {
  return (
    <Link
      href={`/contactos/${contact.id}`}
      onClick={onClose}
      className="group block rounded-2xl border border-border-soft bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-secondary/20 hover:shadow-[0_18px_40px_rgba(44,44,44,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-[#2c2c2c]">
            {contact.nombre}
          </p>
          <p className="mt-1 text-sm text-[#5c5c5c]">{contact.telefono}</p>
          {contact.email ? (
            <p className="mt-1 text-sm text-[#7a7a7a]">{contact.email}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8a8a8a]">
            Fuente
          </p>
          <p className="mt-1 text-sm font-medium text-[#4b4b4b]">
            {contact.fuente ?? "Sin dato"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#8a8a8a]">
        {formatDate(contact.createdAt)}
      </p>
      <span className="mt-3 inline-flex text-sm font-medium text-brand-secondary transition group-hover:text-brand-secondary">
        Ver contacto →
      </span>
    </Link>
  );
}

function ContactSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactSearchResponse["results"]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [message, setMessage] = useState(
    "Ingresa teléfono, nombre o correo para revisar si ya existe.",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const showIntroCentered =
    state === "idle" && results.length === 0 && !errorMessage;

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
      <div className="absolute inset-0 bg-[#2c2c2c]/55 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-2xl overflow-visible rounded-[2.5rem] border border-border-soft bg-white shadow-[0_35px_90px_rgba(44,44,44,0.22)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute -right-3 -top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-error text-white shadow-[0_16px_34px_rgba(220,38,38,0.36)] transition hover:brightness-95 sm:-right-5 sm:-top-5"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        <div className="border-b border-border-soft px-6 py-5 text-center sm:px-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#6b7280]">
            Centro de operaciones
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#2c2c2c] sm:text-3xl">
            Buscar contacto
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#5c5c5c] sm:text-base">
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
              className="w-full rounded-2xl border border-border-soft bg-surface-2 px-4 py-3 text-center text-[#2c2c2c] placeholder:text-center placeholder:text-[#8a8a8a] outline-none transition focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20"
            />
            <p className={`text-sm text-error ${errorMessage ? "" : "hidden"}`}>
              {errorMessage}
            </p>
          </div>

          <p
            className={`text-sm text-[#5c5c5c] ${showIntroCentered ? "text-center" : ""}`}
          >
            {message}
          </p>

          <div className="max-h-[18rem] space-y-3 overflow-y-auto pr-1">
            {state === "loading" ? (
              <div className="rounded-2xl border border-border-soft bg-surface-2 px-4 py-5 text-sm text-[#5c5c5c]">
                Buscando contacto...
              </div>
            ) : null}

            {state === "error" ? (
              <div className="rounded-2xl border border-error bg-error-soft px-4 py-5 text-sm text-error">
                {message}
              </div>
            ) : null}

            {results.map((contact) => (
              <ContactResultCard key={contact.id} contact={contact} onClose={onClose} />
            ))}

            {state === "empty" ? (
              <div className="rounded-2xl border border-dashed border-border-soft bg-surface-2 px-4 py-5 text-sm text-[#5c5c5c]">
                <p>No encontramos coincidencias.</p>
                <Link
                  href={`/contactos/nuevo?telefono=${encodeURIComponent(query.trim())}`}
                  onClick={onClose}
                  className="mt-4 inline-flex rounded-2xl bg-brand-primary px-4 py-2 font-semibold text-[#2c2c2c] transition hover:brightness-95"
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
              className="min-w-[8.5rem] rounded-2xl bg-brand-secondary px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.22)] transition hover:brightness-95"
            >
              {state === "loading" ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return modal;
}

export function ContactSearchModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const open = () => {
    setVersion((current) => current + 1);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <ContactSearchModalContext.Provider value={{ open }}>
      {children}
      <ContactSearchModal
        key={version}
        isOpen={isOpen}
        onClose={close}
      />
    </ContactSearchModalContext.Provider>
  );
}

function useContactSearchModal() {
  const context = useContext(ContactSearchModalContext);

  if (!context) {
    throw new Error(
      "ContactSearchButton must be used within ContactSearchModalProvider.",
    );
  }

  return context;
}

type ContactSearchButtonProps = {
  variant?: "card" | "sidebar" | "dock";
};

export function ContactSearchButton({
  variant = "card",
}: ContactSearchButtonProps) {
  const { open } = useContactSearchModal();

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={open}
        className="group mt-auto flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-4 py-3 text-sm font-semibold text-[#2c2c2c] transition hover:-translate-y-0.5 hover:brightness-95"
      >
        <Plus className="h-4 w-4 transition group-hover:rotate-90" />
        Nuevo contacto
      </button>
    );
  }

  if (variant === "dock") {
    return (
      <button
        type="button"
        onClick={open}
        className="flex h-[4.4rem] flex-col items-center justify-center rounded-[1.2rem] border border-brand-secondary/20 bg-brand-primary px-2 py-1 text-[10px] font-medium text-[#2c2c2c] shadow-sm transition active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" />
        <span className="sr-only">Nuevo contacto</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className="group flex w-full items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:bg-white/15"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-2xl text-[#2c2c2c]">
        +
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-white">Nuevo contacto</h2>
        <p className="mt-1 text-sm leading-6 text-slate-200">
          Registra un prospecto, cliente o interesado.
        </p>
      </div>

      <span className="text-sm font-medium text-slate-200 transition group-hover:text-white">
        Buscar →
      </span>
    </button>
  );
}
