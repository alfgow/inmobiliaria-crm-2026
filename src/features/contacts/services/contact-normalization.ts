export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function escapeLikePattern(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
