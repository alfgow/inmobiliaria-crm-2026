import Link from "next/link";
import { Search } from "lucide-react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { ContactsSearchInput } from "@/features/contacts/components/contacts-search-input";
import { contactMatchesSearch } from "@/features/contacts/services/contact-normalization";
import {
  contactStatusBadgeClass,
  getContactStatusLabel,
} from "@/features/contacts/types/contact-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(value);
}

// Strip emojis/symbols and return the first proper letter
function getInitial(nombre: string) {
  const match = nombre.match(/\p{L}/u);
  return match ? match[0].toUpperCase() : "#";
}

function avatarGradient(nombre: string) {
  const gradients = [
    "from-violet-500 to-indigo-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-600",
    "from-orange-400 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-slate-500 to-slate-700",
    "from-fuchsia-500 to-purple-600",
  ];
  const initial = getInitial(nombre);
  return gradients[initial.charCodeAt(0) % gradients.length];
}

function sourceBadgeCls(fuente: string | null) {
  switch ((fuente ?? "").toLowerCase()) {
    case "facebook":   return "border-blue-100 bg-blue-50 text-blue-600";
    case "instagram":  return "border-pink-100 bg-pink-50 text-pink-600";
    case "web":        return "border-emerald-100 bg-emerald-50 text-emerald-600";
    case "referido":   return "border-amber-100 bg-amber-50 text-amber-600";
    default:           return "border-border-soft bg-brand-surface text-brand-text/50";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function ContactsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const hasQuery = query.length >= 2;

  const contacts = hasQuery
    ? (
        await prisma.contactos.findMany({
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true,
            fuente: true,
            created_at: true,
          },
        })
      )
        .filter((contact) => contactMatchesSearch(contact, query))
        .slice(0, 60)
    : [];

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-brand-base px-4 py-8 text-brand-text sm:px-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-8">

          {/* ── Search area ── */}
          <div className="w-full max-w-2xl">
            {/* Back link */}
            <div className="mb-8 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-white/80 px-4 py-2 text-xs font-medium text-brand-text/55 shadow-sm backdrop-blur-sm transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                ← Dashboard
              </Link>
            </div>

            {/* Title */}
            <div className="mb-6 text-center">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-text/35">
                Contactos
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-brand-text sm:text-4xl">
                Directorio
              </h1>
            </div>

            {/* Input */}
            <ContactsSearchInput initialQuery={query} />

            {/* Hint */}
            <p className="mt-3 text-center text-xs text-brand-text/35">
              {hasQuery
                ? contacts.length === 0
                  ? null
                  : `${contacts.length} resultado${contacts.length !== 1 ? "s" : ""} para "${query}"`
                : "Busca por nombre, teléfono o correo electrónico"}
            </p>
          </div>

          {/* ── Results ── */}
          {hasQuery ? (
            contacts.length > 0 ? (
              <div className="w-full">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {contacts.map((contact) => {
                    const initial = getInitial(contact.nombre);
                    const date = formatDate(contact.created_at);
                    return (
                      <Link
                        key={contact.id.toString()}
                        href={`/contactos/${contact.id.toString()}`}
                        className="group flex flex-col rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(20,16,35,0.07)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-brand-secondary/30 hover:shadow-[0_22px_55px_rgba(20,16,35,0.12)]"
                      >
                        {/* Header: avatar + name/phone only (badge moved to footer) */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white shadow-sm ${avatarGradient(contact.nombre)}`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-brand-text">
                              {contact.nombre}
                            </p>
                            <p className="truncate text-xs text-brand-text/50">
                              {contact.telefono}
                            </p>
                          </div>
                        </div>

                        {/* Email */}
                        {contact.email && (
                          <p className="mt-3 truncate text-xs text-brand-text/45">
                            {contact.email}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-soft pt-3">
                          <span className="text-[10px] text-brand-text/35">
                            {date ?? "Sin fecha"}
                          </span>
                          <div className="flex items-center gap-2">
                            {contact.fuente && (
                              <span
                                className={`max-w-[100px] truncate rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] ${sourceBadgeCls(contact.fuente)}`}
                              >
                                {contact.fuente}
                              </span>
                            )}
                            <span
                              className={`max-w-[110px] truncate rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${contactStatusBadgeClass(contact.estado)}`}
                            >
                              {getContactStatusLabel(contact.estado)}
                            </span>
                            <span className="shrink-0 text-[11px] font-medium text-brand-text/45 transition group-hover:text-brand-secondary">
                              Ver →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* No results */
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-border-soft bg-white shadow-sm">
                  <Search className="size-6 text-brand-text/25" />
                </div>
                <p className="text-base font-medium text-brand-text/60">
                  Sin resultados para&nbsp;
                  <span className="font-semibold text-brand-text">&quot;{query}&quot;</span>
                </p>
                <p className="max-w-xs text-sm text-brand-text/40">
                  Intenta con el nombre completo, número de teléfono o correo exacto.
                </p>
              </div>
            )
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="relative flex size-20 items-center justify-center rounded-3xl border border-border-soft bg-white shadow-[0_16px_40px_rgba(20,16,35,0.08)]">
                <Search className="size-8 text-brand-text/20" />
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-brand-text shadow-sm">
                  +
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="text-lg font-semibold text-brand-text/60">
                  Escribe para buscar
                </p>
                <p className="max-w-xs text-sm text-brand-text/35">
                  Nombre, teléfono o correo electrónico — mínimo 2 caracteres.
                </p>
              </div>
            </div>
          )}
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}
