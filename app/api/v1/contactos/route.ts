import { NextRequest, NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import {
  contactSelect,
  fetchContactDetail,
  findContactByNormalizedPhone,
  findMissingPropertyIds,
  getPrismaErrorCode,
  parseCreateContactPayload,
  parsePositiveInt,
  readJsonBody,
  searchContactsWithCount,
  serializeContact,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";
import { isContactStatus, type ContactStatus } from "@/features/contacts/types/contact-status";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const perPage = Math.min(parsePositiveInt(searchParams.get("perPage"), 20), 100);
  const query = searchParams.get("q")?.trim() ?? "";
  const fuente = searchParams.get("fuente")?.trim() ?? "";
  const estado = searchParams.get("estado")?.trim().toLowerCase() ?? "";

  if (estado && !isContactStatus(estado)) {
    return NextResponse.json(
      { error: "estado debe ser uno de: nuevo, en_contacto, rechazado, bloqueado." },
      { status: 400 },
    );
  }

  try {
    const { contacts, total } = await searchContactsWithCount({
      query: query.length >= 2 ? query : undefined,
      fuente: fuente || undefined,
      estado: estado ? (estado as ContactStatus) : undefined,
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    return NextResponse.json({
      data: contacts.map((contact) => serializeContact(contact)),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/contactos failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar los contactos." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const payload = await readJsonBody(request);

  if (!payload.ok) {
    return NextResponse.json(
      { error: payload.error },
      { status: payload.status ?? 400 },
    );
  }

  const parsed = parseCreateContactPayload(payload.data);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status ?? 400 });
  }

  try {
    const missingPropertyIds = await findMissingPropertyIds(parsed.data.intereses);

    if (missingPropertyIds.length > 0) {
      return NextResponse.json(
        {
          error: "Uno o mas inmuebles no existen.",
          details: { inmuebleIds: missingPropertyIds },
        },
        { status: 404 },
      );
    }

    const existingContact = await findContactByNormalizedPhone(parsed.data.telefono);

    if (existingContact) {
      return NextResponse.json(
        { error: "Ya existe un contacto registrado con ese telefono." },
        { status: 409 },
      );
    }

    const contact = await prisma.$transaction(async (tx) => {
      const created = await tx.contactos.create({
        data: {
          nombre: parsed.data.nombre,
          telefono: parsed.data.telefono,
          email: parsed.data.email,
          estado: parsed.data.estado,
          fuente: parsed.data.fuente ?? "Web",
        },
        select: contactSelect,
      });

      if (parsed.data.intereses.length > 0) {
        await tx.intereses.createMany({
          data: parsed.data.intereses.map((inmuebleId) => ({
            contacto_id: toDecimalId(created.id),
            inmueble_id: toDecimalId(inmuebleId),
          })),
          skipDuplicates: true,
        });
      }

      if (parsed.data.comentarios.length > 0) {
        await tx.comentarios.createMany({
          data: parsed.data.comentarios.map((comentario) => ({
            contacto_id: toDecimalId(created.id),
            comentario,
          })),
        });
      }

      return created;
    });

    const detail = await fetchContactDetail(contact.id);

    return NextResponse.json(
      { data: detail ?? serializeContact({ ...contact, estado: isContactStatus(contact.estado) ? contact.estado : null }) },
      { status: 201 },
    );
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un contacto registrado con ese telefono." },
        { status: 409 },
      );
    }

    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("POST /api/v1/contactos failed:", error);
    return NextResponse.json(
      { error: "No fue posible crear el contacto." },
      { status: 500 },
    );
  }
}
