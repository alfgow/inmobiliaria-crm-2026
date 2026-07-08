import { Prisma } from "../../../../app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONTACT_STATUS,
  type ContactStatus,
  isContactStatus,
} from "@/features/contacts/types/contact-status";
import { normalizePhoneNumber } from "@/features/contacts/services/contact-normalization";

type JsonRecord = Record<string, unknown>;

type DecimalLike = {
  toString(): string;
};

type ContactRecord = {
  id: bigint;
  nombre: string;
  email: string | null;
  telefono: string;
  estado: ContactStatus;
  fuente: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type CommentRecord = {
  id: bigint;
  comentario: string;
  created_at: Date | null;
};

type InterestRecord = {
  id: bigint;
  inmueble_id: DecimalLike;
  created_at: Date | null;
};

type PropertyRecord = {
  id: bigint;
  slug: string;
  titulo: string;
  precio: DecimalLike;
  direccion: string;
  visible: boolean;
  inmueble_estatus: {
    nombre: string;
    color: string | null;
  };
};

export type ContactCreateData = {
  nombre: string;
  telefono: string;
  email: string | null;
  estado: ContactStatus;
  fuente: string | null;
  intereses: string[];
  comentarios: string[];
};

export type ContactUpdateData = {
  nombre?: string;
  telefono?: string;
  email?: string | null;
  estado?: ContactStatus;
  fuente?: string | null;
};

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export const contactSelect = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  estado: true,
  fuente: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.contactosSelect;

export const commentSelect = {
  id: true,
  comentario: true,
  created_at: true,
} satisfies Prisma.comentariosSelect;

export const interestSelect = {
  id: true,
  inmueble_id: true,
  created_at: true,
} satisfies Prisma.interesesSelect;

const propertySelect = {
  id: true,
  slug: true,
  titulo: true,
  precio: true,
  direccion: true,
  visible: true,
  inmueble_estatus: {
    select: {
      nombre: true,
      color: true,
    },
  },
} satisfies Prisma.inmueblesSelect;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown, fieldName: string): ValidationResult<string | null> {
  if (value === undefined || value === null) {
    return { ok: true, data: null };
  }

  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} debe ser texto.` };
  }

  const trimmed = value.trim();
  return { ok: true, data: trimmed || null };
}

function requiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} es requerido.` };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: `${fieldName} es requerido.` };
  }

  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `${fieldName} no puede superar ${maxLength} caracteres.`,
    };
  }

  return { ok: true, data: trimmed };
}

function validateEmail(email: string | null): ValidationResult<string | null> {
  if (!email) {
    return { ok: true, data: null };
  }

  if (email.length > 150) {
    return {
      ok: false,
      error: "email no puede superar 150 caracteres.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "email no tiene un formato válido." };
  }

  return { ok: true, data: email };
}

function validateFuente(fuente: string | null): ValidationResult<string | null> {
  if (!fuente) {
    return { ok: true, data: null };
  }

  if (fuente.length > 50) {
    return {
      ok: false,
      error: "fuente no puede superar 50 caracteres.",
    };
  }

  return { ok: true, data: fuente };
}

function validatePhoneNumber(phone: string): ValidationResult<string> {
  const normalized = normalizePhoneNumber(phone);

  if (!normalized) {
    return { ok: false, error: "telefono es requerido." };
  }

  if (normalized.length > 20) {
    return { ok: false, error: "telefono no puede superar 20 digitos." };
  }

  return { ok: true, data: normalized };
}

function parseContactStatusValue(value: unknown): ValidationResult<ContactStatus> {
  if (typeof value !== "string") {
    return { ok: false, error: "estado debe ser texto." };
  }

  const normalized = value.trim().toLowerCase();

  if (!isContactStatus(normalized)) {
    return {
      ok: false,
      error: "estado debe ser uno de: nuevo, en_contacto, rechazado, bloqueado.",
    };
  }

  return { ok: true, data: normalized };
}

function parseIdValue(value: unknown, fieldName: string): ValidationResult<string> {
  const text =
    typeof value === "number" && Number.isSafeInteger(value)
      ? value.toString()
      : typeof value === "bigint"
        ? value.toString()
        : typeof value === "string"
          ? value.trim()
          : "";

  if (!/^[1-9]\d*$/.test(text)) {
    return { ok: false, error: `${fieldName} debe ser un ID positivo.` };
  }

  return { ok: true, data: text };
}

function getInterestIdFromItem(item: unknown): unknown {
  if (!isRecord(item)) {
    return item;
  }

  return item.inmuebleId ?? item.inmueble_id;
}

function parseInterestIds(body: JsonRecord): ValidationResult<string[]> {
  const values: unknown[] = [];

  if (body.inmuebleId !== undefined || body.inmueble_id !== undefined) {
    values.push(body.inmuebleId ?? body.inmueble_id);
  }

  if (body.intereses !== undefined) {
    if (!Array.isArray(body.intereses)) {
      return { ok: false, error: "intereses debe ser una lista." };
    }

    values.push(...body.intereses.map(getInterestIdFromItem));
  }

  const ids = new Set<string>();

  for (const value of values) {
    const parsed = parseIdValue(value, "inmuebleId");

    if (!parsed.ok) {
      return parsed;
    }

    ids.add(parsed.data);
  }

  return { ok: true, data: Array.from(ids) };
}

function getCommentTextFromItem(item: unknown): unknown {
  if (!isRecord(item)) {
    return item;
  }

  return item.comentario;
}

function parseComments(body: JsonRecord): ValidationResult<string[]> {
  const values: unknown[] = [];

  if (body.comentario !== undefined) {
    values.push(body.comentario);
  }

  if (body.comentarios !== undefined) {
    if (!Array.isArray(body.comentarios)) {
      return { ok: false, error: "comentarios debe ser una lista." };
    }

    values.push(...body.comentarios.map(getCommentTextFromItem));
  }

  const comments: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") {
      return { ok: false, error: "comentario debe ser texto." };
    }

    const text = value.trim();

    if (!text) {
      continue;
    }

    if (text.length > 2000) {
      return {
        ok: false,
        error: "comentario no puede superar 2000 caracteres.",
      };
    }

    comments.push(text);
  }

  return { ok: true, data: comments };
}

export async function readJsonBody(request: Request): Promise<ValidationResult<unknown>> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      error: "El cuerpo de la petición debe ser JSON válido.",
      status: 400,
    };
  }
}

export function parsePositiveInt(value: string | null, fallback: number) {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
}

export function parseContactId(value: string): ValidationResult<bigint> {
  const parsed = parseIdValue(value, "id");

  if (!parsed.ok) {
    return { ok: false, error: "ID de contacto inválido.", status: 400 };
  }

  return { ok: true, data: BigInt(parsed.data) };
}

export function parseResourceId(
  value: string,
  resourceName: string,
): ValidationResult<bigint> {
  const parsed = parseIdValue(value, resourceName);

  if (!parsed.ok) {
    return { ok: false, error: `${resourceName} inválido.`, status: 400 };
  }

  return { ok: true, data: BigInt(parsed.data) };
}

export function toDecimalId(value: bigint | string) {
  return new Prisma.Decimal(value.toString());
}

export function parseCreateContactPayload(
  payload: unknown,
): ValidationResult<ContactCreateData> {
  if (!isRecord(payload)) {
    return { ok: false, error: "El cuerpo de la petición debe ser un objeto." };
  }

  const nombre = requiredString(payload.nombre, "nombre", 100);
  if (!nombre.ok) return nombre;

  const telefono = requiredString(payload.telefono, "telefono", 50);
  if (!telefono.ok) return telefono;

  const normalizedPhone = validatePhoneNumber(telefono.data);
  if (!normalizedPhone.ok) return normalizedPhone;

  const rawEmail = optionalString(payload.email, "email");
  if (!rawEmail.ok) return rawEmail;

  const email = validateEmail(rawEmail.data);
  if (!email.ok) return email;

  const rawFuente = optionalString(payload.fuente, "fuente");
  if (!rawFuente.ok) return rawFuente;

  const fuente = validateFuente(rawFuente.data);
  if (!fuente.ok) return fuente;

  const estado =
    payload.estado === undefined || payload.estado === null || payload.estado === ""
      ? { ok: true as const, data: DEFAULT_CONTACT_STATUS }
      : parseContactStatusValue(payload.estado);
  if (!estado.ok) return estado;

  const intereses = parseInterestIds(payload);
  if (!intereses.ok) return intereses;

  const comentarios = parseComments(payload);
  if (!comentarios.ok) return comentarios;

  return {
    ok: true,
    data: {
      nombre: nombre.data,
      telefono: normalizedPhone.data,
      email: email.data,
      estado: estado.data,
      fuente: fuente.data,
      intereses: intereses.data,
      comentarios: comentarios.data,
    },
  };
}

export function parseUpdateContactPayload(
  payload: unknown,
  requireFullPayload = false,
): ValidationResult<ContactUpdateData> {
  if (!isRecord(payload)) {
    return { ok: false, error: "El cuerpo de la petición debe ser un objeto." };
  }

  const data: ContactUpdateData = {};

  if (payload.nombre !== undefined || requireFullPayload) {
    const nombre = requiredString(payload.nombre, "nombre", 100);
    if (!nombre.ok) return nombre;
    data.nombre = nombre.data;
  }

  if (payload.telefono !== undefined || requireFullPayload) {
    const telefono = requiredString(payload.telefono, "telefono", 50);
    if (!telefono.ok) return telefono;

    const normalizedPhone = validatePhoneNumber(telefono.data);
    if (!normalizedPhone.ok) return normalizedPhone;
    data.telefono = normalizedPhone.data;
  }

  if (payload.email !== undefined || requireFullPayload) {
    const rawEmail = optionalString(payload.email, "email");
    if (!rawEmail.ok) return rawEmail;

    const email = validateEmail(rawEmail.data);
    if (!email.ok) return email;
    data.email = email.data;
  }

  if (payload.estado !== undefined) {
    const estado = parseContactStatusValue(payload.estado);
    if (!estado.ok) return estado;
    data.estado = estado.data;
  }

  if (payload.fuente !== undefined || requireFullPayload) {
    const rawFuente = optionalString(payload.fuente, "fuente");
    if (!rawFuente.ok) return rawFuente;

    const fuente = validateFuente(rawFuente.data);
    if (!fuente.ok) return fuente;
    data.fuente = fuente.data;
  }

  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      error: "Debes enviar al menos un campo para actualizar.",
    };
  }

  return { ok: true, data };
}

export function parseInterestPayload(payload: unknown): ValidationResult<string> {
  if (!isRecord(payload)) {
    return { ok: false, error: "El cuerpo de la petición debe ser un objeto." };
  }

  const parsed = parseIdValue(payload.inmuebleId ?? payload.inmueble_id, "inmuebleId");

  if (!parsed.ok) {
    return parsed;
  }

  return { ok: true, data: parsed.data };
}

export function parseCommentPayload(payload: unknown): ValidationResult<string> {
  if (!isRecord(payload)) {
    return { ok: false, error: "El cuerpo de la petición debe ser un objeto." };
  }

  if (typeof payload.comentario !== "string") {
    return { ok: false, error: "comentario es requerido." };
  }

  const comentario = payload.comentario.trim();

  if (!comentario) {
    return { ok: false, error: "comentario no puede estar vacío." };
  }

  if (comentario.length > 2000) {
    return { ok: false, error: "comentario no puede superar 2000 caracteres." };
  }

  return { ok: true, data: comentario };
}

export function serializeContact(
  contact: ContactRecord,
  details?: {
    intereses?: ReturnType<typeof serializeInterest>[];
    comentarios?: ReturnType<typeof serializeComment>[];
  },
) {
  return {
    id: contact.id.toString(),
    nombre: contact.nombre,
    email: contact.email,
    telefono: contact.telefono,
    estado: contact.estado,
    fuente: contact.fuente,
    fechas: {
      creado: contact.created_at?.toISOString() ?? null,
      actualizado: contact.updated_at?.toISOString() ?? null,
    },
    ...(details?.intereses ? { intereses: details.intereses } : {}),
    ...(details?.comentarios ? { comentarios: details.comentarios } : {}),
    links: {
      self: `/api/v1/contactos/${contact.id.toString()}`,
      intereses: `/api/v1/contactos/${contact.id.toString()}/intereses`,
      comentarios: `/api/v1/contactos/${contact.id.toString()}/comentarios`,
    },
  };
}

export function serializeComment(comment: CommentRecord) {
  return {
    id: comment.id.toString(),
    comentario: comment.comentario,
    fechaCreacion: comment.created_at?.toISOString() ?? null,
  };
}

export function serializeInterest(
  interest: InterestRecord,
  property?: PropertyRecord | null,
) {
  return {
    id: interest.id.toString(),
    inmuebleId: interest.inmueble_id.toString(),
    fechaCreacion: interest.created_at?.toISOString() ?? null,
    inmueble: property
      ? {
          id: property.id.toString(),
          slug: property.slug,
          titulo: property.titulo,
          direccion: property.direccion,
          precio: {
            monto: property.precio.toString(),
            moneda: "MXN",
          },
          visible: property.visible,
          estatus: {
            nombre: property.inmueble_estatus.nombre,
            color: property.inmueble_estatus.color,
          },
        }
      : null,
  };
}

export async function fetchContactDetail(contactId: bigint) {
  const contactoDecimal = toDecimalId(contactId);

  const [contact, interests, comments] = await Promise.all([
    prisma.contactos.findUnique({
      where: { id: contactId },
      select: contactSelect,
    }),
    prisma.intereses.findMany({
      where: { contacto_id: contactoDecimal },
      orderBy: { created_at: "desc" },
      select: interestSelect,
    }),
    prisma.comentarios.findMany({
      where: { contacto_id: contactoDecimal },
      orderBy: { created_at: "desc" },
      select: commentSelect,
    }),
  ]);

  if (!contact) {
    return null;
  }

  const propertyMap = await fetchPropertyMap(
    interests.map((interest) => interest.inmueble_id.toString()),
  );

  return serializeContact(contact, {
    intereses: interests.map((interest) =>
      serializeInterest(interest, propertyMap.get(interest.inmueble_id.toString()) ?? null),
    ),
    comentarios: comments.map(serializeComment),
  });
}

export async function fetchContactInterests(contactId: bigint) {
  const interests = await prisma.intereses.findMany({
    where: { contacto_id: toDecimalId(contactId) },
    orderBy: { created_at: "desc" },
    select: interestSelect,
  });

  const propertyMap = await fetchPropertyMap(
    interests.map((interest) => interest.inmueble_id.toString()),
  );

  return interests.map((interest) =>
    serializeInterest(interest, propertyMap.get(interest.inmueble_id.toString()) ?? null),
  );
}

export async function fetchContactComments(contactId: bigint) {
  const comments = await prisma.comentarios.findMany({
    where: { contacto_id: toDecimalId(contactId) },
    orderBy: { created_at: "desc" },
    select: commentSelect,
  });

  return comments.map(serializeComment);
}

export async function fetchInterestForContact(contactId: bigint, interestId: bigint) {
  const interest = await prisma.intereses.findFirst({
    where: {
      id: interestId,
      contacto_id: toDecimalId(contactId),
    },
    select: interestSelect,
  });

  if (!interest) {
    return null;
  }

  const property = await prisma.inmuebles.findUnique({
    where: { id: BigInt(interest.inmueble_id.toString()) },
    select: propertySelect,
  });

  return serializeInterest(interest, property);
}

export async function contactExists(contactId: bigint) {
  const contact = await prisma.contactos.findUnique({
    where: { id: contactId },
    select: { id: true },
  });

  return Boolean(contact);
}

export async function findContactByNormalizedPhone(
  phone: string,
  excludeContactId?: bigint,
) {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone) {
    return null;
  }

  const contacts = await prisma.contactos.findMany({
    select: { id: true, telefono: true },
  });

  return (
    contacts.find(
      (contact) =>
        contact.id !== excludeContactId &&
        normalizePhoneNumber(contact.telefono) === normalizedPhone,
    ) ?? null
  );
}

export async function propertyExists(propertyId: bigint) {
  const property = await prisma.inmuebles.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });

  return Boolean(property);
}

export async function findMissingPropertyIds(propertyIds: string[]) {
  if (propertyIds.length === 0) {
    return [];
  }

  const uniquePropertyIds = Array.from(new Set(propertyIds));
  const properties = await prisma.inmuebles.findMany({
    where: {
      id: { in: uniquePropertyIds.map((id) => BigInt(id)) },
    },
    select: { id: true },
  });
  const existingIds = new Set(properties.map((property) => property.id.toString()));

  return uniquePropertyIds.filter((id) => !existingIds.has(id));
}

async function fetchPropertyMap(propertyIds: string[]) {
  const uniquePropertyIds = Array.from(new Set(propertyIds));
  const propertyMap = new Map<string, PropertyRecord>();

  if (uniquePropertyIds.length === 0) {
    return propertyMap;
  }

  const properties = await prisma.inmuebles.findMany({
    where: {
      id: { in: uniquePropertyIds.map((id) => BigInt(id)) },
    },
    select: propertySelect,
  });

  for (const property of properties) {
    propertyMap.set(property.id.toString(), property);
  }

  return propertyMap;
}

export function getPrismaErrorCode(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    ? error.code
    : null;
}
