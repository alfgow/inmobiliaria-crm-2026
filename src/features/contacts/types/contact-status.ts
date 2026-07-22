export const CONTACT_STATUS_VALUES = [
  "nuevo",
  "en_contacto",
  "en_contacto_bot",
  "rechazado",
  "bloqueado",
  "blocked",
] as const;

export type ContactStatus = (typeof CONTACT_STATUS_VALUES)[number];

export const DEFAULT_CONTACT_STATUS: ContactStatus = "nuevo";

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  nuevo: "Nuevo",
  en_contacto: "En contacto",
  en_contacto_bot: "En contacto (bot)",
  rechazado: "Rechazado",
  bloqueado: "Bloqueado",
  // "blocked" es un duplicado legacy de "bloqueado" (datos de antes de
  // traducir los estados) — misma etiqueta, mismo badge.
  blocked: "Bloqueado",
};

// Subconjunto que un usuario puede elegir manualmente desde el selector de
// estado. "en_contacto_bot" lo asigna la integración del bot de WhatsApp y
// "blocked" es el duplicado legacy de "bloqueado" — ninguno de los dos debe
// elegirse a mano, solo se muestran donde ya existan (badge, detalle).
const SELECTABLE_CONTACT_STATUS_VALUES = [
  "nuevo",
  "en_contacto",
  "rechazado",
  "bloqueado",
] as const satisfies readonly ContactStatus[];

export const CONTACT_STATUS_OPTIONS = SELECTABLE_CONTACT_STATUS_VALUES.map((value) => ({
  value,
  label: CONTACT_STATUS_LABELS[value],
}));

export function isContactStatus(value: unknown): value is ContactStatus {
  return (
    typeof value === "string" &&
    CONTACT_STATUS_VALUES.includes(value as ContactStatus)
  );
}

export function getContactStatusLabel(status: ContactStatus | null | undefined) {
  return status ? CONTACT_STATUS_LABELS[status] : "Sin estado";
}

export function contactStatusBadgeClass(status: ContactStatus | null | undefined) {
  switch (status) {
    case "en_contacto":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "en_contacto_bot":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "rechazado":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "bloqueado":
    case "blocked":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "nuevo":
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}
