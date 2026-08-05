export const BLOG_STATUSES = ["borrador", "publicado", "programado", "archivado"] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

export function isBlogStatus(value: string): value is BlogStatus {
  return BLOG_STATUSES.includes(value as BlogStatus);
}

export function getBlogStatusLabel(status: BlogStatus | string) {
  switch (status) {
    case "publicado":
      return "Publicado";
    case "programado":
      return "Programado";
    case "archivado":
      return "Archivado";
    default:
      return "Borrador";
  }
}

export function blogStatusBadgeClass(status: BlogStatus | string) {
  switch (status) {
    case "publicado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "programado":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "archivado":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}
