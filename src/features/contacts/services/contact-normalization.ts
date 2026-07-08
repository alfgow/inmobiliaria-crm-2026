type SearchableContact = {
  nombre: string;
  email: string | null;
  telefono: string;
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function contactMatchesSearch(contact: SearchableContact, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const phoneQuery = normalizePhoneNumber(query);

  if (!normalizedQuery && !phoneQuery) {
    return false;
  }

  const nameMatches = normalizeSearchText(contact.nombre).includes(normalizedQuery);
  const emailMatches = contact.email
    ? normalizeSearchText(contact.email).includes(normalizedQuery)
    : false;
  const phoneMatches = phoneQuery
    ? normalizePhoneNumber(contact.telefono).includes(phoneQuery)
    : false;

  return nameMatches || emailMatches || phoneMatches;
}
