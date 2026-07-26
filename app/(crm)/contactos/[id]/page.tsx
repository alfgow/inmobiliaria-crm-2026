import {
    ArrowLeft,
    Bot,
    CalendarDays,
    Clock3,
    Mail,
    MessageSquareText,
    Pencil,
    Phone,
    Sparkles,
    UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import { AddCommentButton } from "@/features/contacts/components/add-comment-button";
import { BotStatusSelect } from "@/features/contacts/components/bot-status-select";
import { ContactStatusSelect } from "@/features/contacts/components/contact-status-select";
import { ContactInterestsCard } from "@/features/contacts/components/contact-interests-card";
import { ConversationMessages } from "@/features/contacts/components/conversation-messages";
import { DeleteContactButton } from "@/features/contacts/components/delete-contact-button";
import {
  getContactStatusLabel,
  isContactStatus,
} from "@/features/contacts/types/contact-status";
import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";
import { Prisma } from "../../../generated/prisma/client";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}


function formatWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.length === 10 ? `52${cleaned}` : cleaned;
  return `https://wa.me/${number}`;
}

function getInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const initials: string[] = [];
  
  for (const word of words) {
    const letterMatch = word.match(/\p{L}/u);
    if (letterMatch) {
      initials.push(letterMatch[0].toUpperCase());
    }
    if (initials.length >= 2) {
      break;
    }
  }
  
  return initials.join("") || "?";
}

type PageProps = {
  params: Promise<{ id: string }>;
};

type TimelineItem = {
  id: string;
  type: "comentario" | "ia";
  title: string;
  body: string;
  createdAt: Date | null;
  accentClass: string;
  icon: typeof MessageSquareText;
};

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;

  let contactId: bigint;

  try {
    contactId = BigInt(id);
  } catch {
    notFound();
  }

  const contactIdDecimal = new Prisma.Decimal(contactId.toString());

  const [
    contact,
    interests,
    comments,
    interactionsIa,
    conversaciones,
    totalInterests,
    totalComments,
    totalIaInteractions,
    allActiveProperties,
  ] = await Promise.all([
    prisma.contactos.findFirst({
      where: { id: contactId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        estado: true,
        fuente: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.intereses.findMany({
      where: { contacto_id: contactIdDecimal },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        inmueble_id: true,
        created_at: true,
      },
    }),
    prisma.comentarios.findMany({
      where: { contacto_id: contactIdDecimal },
      orderBy: { created_at: "desc" },
      take: 6,
      select: {
        id: true,
        comentario: true,
        created_at: true,
      },
    }),
    prisma.interacciones_ia.findMany({
      where: { contacto_id: contactIdDecimal },
      orderBy: { created_at: "desc" },
      take: 6,
      select: {
        id: true,
        payload: true,
        created_at: true,
      },
    }),
    prisma.contacto_conversaciones.findMany({
      where: { contacto_id: contactId },
      orderBy: { iniciada_at: "desc" },
      include: {
        inmuebles: { select: { id: true, titulo: true, slug: true } },
        contacto_mensajes: { orderBy: { enviado_at: "asc" } },
        regina_contextos: { select: { status: true } },
      },
    }),
    prisma.intereses.count({
      where: { contacto_id: contactIdDecimal },
    }),
    prisma.comentarios.count({
      where: { contacto_id: contactIdDecimal },
    }),
    prisma.interacciones_ia.count({
      where: { contacto_id: contactIdDecimal },
    }),
    prisma.inmuebles.findMany({
      where: { estatus_id: 1 },
      orderBy: { updated_at: "desc" },
      take: 50,
      select: {
        id: true,
        titulo: true,
        precio: true,
        direccion: true,
      },
    }),
  ]);

  if (!contact) {
    notFound();
  }

  const propertyIds = interests.map((interest) =>
    BigInt(interest.inmueble_id.toString()),
  );

  const properties =
    propertyIds.length > 0
      ? await prisma.inmuebles.findMany({
          where: { id: { in: propertyIds } },
          include: {
            inmueble_estatus: true,
          },
        })
      : [];

  const propertyMap = new Map(
    properties.map((property) => [property.id.toString(), property]),
  );

  const rawInterestImages =
    propertyIds.length > 0
      ? await prisma.inmueble_imagenes.findMany({
          where: { inmueble_id: { in: propertyIds.map((id) => id.toString()) } },
          orderBy: [{ orden: "asc" }, { id: "asc" }],
          select: { inmueble_id: true, s3_key: true },
        })
      : [];

  const seenInterestImageIds = new Set<string>();
  const coverImageMap = new Map<string, string>();
  for (const img of rawInterestImages) {
    const key = img.inmueble_id.toString();
    if (!seenInterestImageIds.has(key)) {
      seenInterestImageIds.add(key);
      coverImageMap.set(key, getPublicImageUrl(img.s3_key));
    }
  }

  const interestedProperties = interests
    .map((interest) => {
      const property = propertyMap.get(
        BigInt(interest.inmueble_id.toString()).toString(),
      );

      if (!property) {
        return null;
      }

      return {
        interestId: interest.id.toString(),
        property,
        createdAt: interest.created_at,
      };
    })
    .filter(
      (
        item,
      ): item is {
        interestId: string;
        property: (typeof properties)[number];
        createdAt: Date | null;
      } => item !== null,
    );

  const timeline: TimelineItem[] = [
    ...comments.map((comment) => ({
      id: `comentario-${comment.id.toString()}`,
      type: "comentario" as const,
      title: "Comentario registrado",
      body: comment.comentario,
      createdAt: comment.created_at,
      accentClass: "border-sky-200 bg-sky-50 text-sky-700",
      icon: MessageSquareText,
    })),
    ...interactionsIa.map((interaction) => ({
      id: `ia-${interaction.id.toString()}`,
      type: "ia" as const,
      title: "Interacción IA",
      body: interaction.payload,
      createdAt: interaction.created_at,
      accentClass: "border-violet-200 bg-violet-50 text-violet-700",
      icon: Bot,
    })),
  ].sort((left, right) => {
    const leftValue = left.createdAt?.getTime() ?? 0;
    const rightValue = right.createdAt?.getTime() ?? 0;
    return rightValue - leftValue;
  });

  const lastActivity =
    timeline[0]?.createdAt ?? contact.updated_at ?? contact.created_at;

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-6 pb-40 text-zinc-950 sm:px-6 sm:pb-32 lg:px-10 lg:pb-6">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 gap-y-3">
            <Link
              href="/contactos"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a contactos
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href={`/contactos/${id}/editar`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:text-slate-950"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>

              <DeleteContactButton
                contactId={contact.id.toString()}
                contactName={contact.nombre}
              />

              <div className="hidden rounded-full border border-white/10 bg-zinc-950 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.3em] text-zinc-300 shadow-2xl sm:block">
                Vista de contacto
              </div>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/10 text-xl font-semibold text-white">
                    {getInitials(contact.nombre)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium uppercase tracking-[0.15em] sm:tracking-[0.3em] text-zinc-400">
                      Contacto
                    </p>
                    <h1 className="mt-1 break-words text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                      {contact.nombre}
                    </h1>
                  </div>
                </div>

                <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Consulta la información del contacto, sus propiedades de
                  interés y el historial de interacciones en una sola vista.
                </p>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/90">
                    {contact.fuente ?? "Sin fuente"}
                  </span>
                  <ContactStatusSelect
                    contactId={contact.id.toString()}
                    currentStatus={isContactStatus(contact.estado) ? contact.estado : "nuevo"}
                  />
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/90">
                    {formatDate(lastActivity)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/90">
                    {totalInterests} propiedades
                  </span>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.3em] text-zinc-400">
                      Estado actual
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {getContactStatusLabel(isContactStatus(contact.estado) ? contact.estado : null)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: "Intereses", value: totalInterests },
                    { label: "Comentarios", value: totalComments },
                    { label: "IA", value: totalIaInteractions },
                    {
                      label: "Última actividad",
                      value: formatDate(lastActivity),
                      span: true,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-3 ${
                        item.span ? "col-span-2" : ""
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.28em] text-zinc-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

         
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.35em] text-slate-500">
                    Información
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    Datos del contacto
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { label: "Teléfono", value: contact.telefono, icon: Phone, whatsapp: true },
                  {
                    label: "Correo",
                    value: contact.email ?? "Sin correo registrado",
                    icon: Mail,
                  },
                  { label: "Origen", value: contact.fuente ?? "Sin fuente", icon: Sparkles },
                  {
                    label: "Estado",
                    value: getContactStatusLabel(isContactStatus(contact.estado) ? contact.estado : null),
                    icon: UserRound,
                  },
                  {
                    label: "Creación",
                    value: formatDate(contact.created_at),
                    icon: CalendarDays,
                  },
                  {
                    label: "Actualización",
                    value: formatDate(contact.updated_at),
                    icon: Clock3,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.3em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 break-words text-base font-medium text-slate-950">
                        {item.value}
                      </p>
                    </div>
                    {"whatsapp" in item && item.whatsapp && (
                      <a
                        href={formatWhatsAppUrl(item.value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Enviar mensaje por WhatsApp"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-sm transition hover:bg-[#1ebe5d] hover:shadow-[0_4px_16px_rgba(37,211,102,0.4)]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Conversaciones del bot ── */}
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.35em] text-slate-500">
                    Bot WhatsApp
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    Conversaciones
                  </h2>
                </div>
                <span className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {conversaciones.length}{" "}
                  {conversaciones.length === 1 ? "conversación" : "conversaciones"}
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {conversaciones.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                    No hay conversaciones con el bot registradas.
                  </div>
                ) : (
                  conversaciones.map((conv) => (
                    <div
                      key={conv.id.toString()}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      {/* Cabecera de la conversación */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Canal */}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#128C3F]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-3 w-3"
                              aria-hidden="true"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            {conv.canal}
                          </span>

                          {/* ID de WhatsApp */}
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-600">
                            {conv.wa_id}
                          </span>

                          {/* Inmueble vinculado */}
                          {conv.inmuebles && (
                            <Link
                              href={`/inmuebles/${conv.inmuebles.slug}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                            >
                              <Sparkles className="h-3 w-3" />
                              {conv.inmuebles.titulo}
                            </Link>
                          )}
                        </div>

                        {/* Estado del bot en regina_contextos */}
                        <BotStatusSelect
                          waId={conv.wa_id}
                          contactoId={id}
                          currentStatus={conv.regina_contextos?.status ?? "activo"}
                        />
                      </div>

                      {/* Fechas */}
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span>
                          <span className="font-medium text-slate-700">Iniciada:</span>{" "}
                          {formatDate(conv.iniciada_at)}
                        </span>
                        {conv.ultimo_mensaje_at && (
                          <span>
                            <span className="font-medium text-slate-700">
                              Último mensaje:
                            </span>{" "}
                            {formatDate(conv.ultimo_mensaje_at)}
                          </span>
                        )}
                        <span>
                          <span className="font-medium text-slate-700">Mensajes:</span>{" "}
                          {conv.contacto_mensajes.length}
                        </span>
                      </div>

                      {/* Mensajes */}
                      <div className="mt-4">
                        <ConversationMessages
                          messages={conv.contacto_mensajes.map((m) => ({
                            id: m.id.toString(),
                            rol: m.rol,
                            mensaje: m.mensaje,
                            enviado_at: m.enviado_at.toISOString(),
                          }))}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <ContactInterestsCard
              contactId={contact.id.toString()}
              initialInterests={interestedProperties.map(
                ({ interestId, property, createdAt }) => {
                  const p = property as typeof property & {
                    tipo?: unknown;
                    operacion?: unknown;
                  };
                  return {
                    interestId,
                    inmuebleId: property.id.toString(),
                    titulo: property.titulo,
                    direccion: property.direccion,
                    precio: property.precio.toString(),
                    tipo: String(p.tipo ?? "—"),
                    operacion: String(p.operacion ?? "—"),
                    estatus: property.inmueble_estatus.nombre,
                    metros: property.metros_cuadrados?.toString() ?? "0",
                    createdAt: createdAt?.toISOString() ?? null,
                    coverImageUrl:
                      coverImageMap.get(property.id.toString()) ?? null,
                  };
                },
              )}
              availableProperties={allActiveProperties.map((p) => ({
                id: p.id.toString(),
                titulo: p.titulo,
                precio: p.precio.toString(),
                direccion: p.direccion,
              }))}
            />
       

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.35em] text-slate-500">
                  Interacciones
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Historial de conversación
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {timeline.length > 0 ? (
                timeline.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${item.accentClass}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950">
                              {item.title}
                            </p>
                            <p className="mt-2 break-words text-sm leading-7 text-slate-600">
                              {item.body}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
                  No hay interacciones registradas todavía.
                </div>
              )}
            </div>
          </section>
        </div>
      </AnimatedDashboardBackground>

      <AddCommentButton contactId={contact.id.toString()} />
    </main>
  );
}
