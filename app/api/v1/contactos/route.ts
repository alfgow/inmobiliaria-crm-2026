import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "../../../generated/prisma/client";
import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import {
  contactSelect,
  fetchContactDetail,
  findMissingPropertyIds,
  getPrismaErrorCode,
  parseCreateContactPayload,
  parsePositiveInt,
  readJsonBody,
  serializeContact,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";
import { isContactStatus } from "@/features/contacts/types/contact-status";

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
  const where: Prisma.contactosWhereInput = {};

  if (query.length >= 2) {
    where.OR = [
      { nombre: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { telefono: { contains: query, mode: "insensitive" } },
    ];
  }

  if (fuente) {
    where.fuente = { equals: fuente, mode: "insensitive" };
  }

  if (estado) {
    if (!isContactStatus(estado)) {
      return NextResponse.json(
        { error: "estado debe ser uno de: nuevo, en_contacto, rechazado, bloqueado." },
        { status: 400 },
      );
    }

    where.estado = estado;
  }

  try {
    const [contacts, total] = await Promise.all([
      prisma.contactos.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: contactSelect,
      }),
      prisma.contactos.count({ where }),
    ]);

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
      { data: detail ?? serializeContact(contact) },
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
