export const CONTACT_STATUS_VALUES = [
  "nuevo",
  "en_contacto",
  "rechazado",
  "bloqueado",
] as const;

export type ContactStatus = (typeof CONTACT_STATUS_VALUES)[number];

export const DEFAULT_CONTACT_STATUS: ContactStatus = "nuevo";

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  nuevo: "Nuevo",
  en_contacto: "En contacto",
  rechazado: "Rechazado",
  bloqueado: "Bloqueado",
};

export const CONTACT_STATUS_OPTIONS = CONTACT_STATUS_VALUES.map((value) => ({
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
    case "rechazado":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "bloqueado":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "nuevo":
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}
