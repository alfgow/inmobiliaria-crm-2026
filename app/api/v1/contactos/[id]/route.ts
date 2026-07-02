import { NextRequest, NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import {
  contactExists,
  contactSelect,
  fetchContactDetail,
  getPrismaErrorCode,
  parseContactId,
  parseUpdateContactPayload,
  readJsonBody,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";

export const dynamic = "force-dynamic";

type ContactRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: ContactRouteContext,
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsedId = parseContactId(id);

  if (!parsedId.ok) {
    return NextResponse.json(
      { error: parsedId.error },
      { status: parsedId.status ?? 400 },
    );
  }

  try {
    const contact = await fetchContactDetail(parsedId.data);

    if (!contact) {
      return NextResponse.json(
        { error: "Contacto no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: contact });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/contactos/[id] failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar el contacto." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: ContactRouteContext,
) {
  return updateContact(request, context, true);
}

export async function PATCH(
  request: NextRequest,
  context: ContactRouteContext,
) {
  return updateContact(request, context, false);
}

export async function DELETE(
  request: NextRequest,
  context: ContactRouteContext,
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsedId = parseContactId(id);

  if (!parsedId.ok) {
    return NextResponse.json(
      { error: parsedId.error },
      { status: parsedId.status ?? 400 },
    );
  }

  try {
    const exists = await contactExists(parsedId.data);

    if (!exists) {
      return NextResponse.json(
        { error: "Contacto no encontrado." },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.intereses.deleteMany({ where: { contacto_id: toDecimalId(parsedId.data) } }),
      prisma.comentarios.deleteMany({ where: { contacto_id: toDecimalId(parsedId.data) } }),
      prisma.interacciones_ia.deleteMany({ where: { contacto_id: toDecimalId(parsedId.data) } }),
      prisma.contactos.delete({ where: { id: parsedId.data } }),
    ]);

    return NextResponse.json({
      data: { id: parsedId.data.toString() },
      message: "Contacto eliminado.",
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("DELETE /api/v1/contactos/[id] failed:", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el contacto." },
      { status: 500 },
    );
  }
}

async function updateContact(
  request: NextRequest,
  context: ContactRouteContext,
  requireFullPayload: boolean,
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsedId = parseContactId(id);

  if (!parsedId.ok) {
    return NextResponse.json(
      { error: parsedId.error },
      { status: parsedId.status ?? 400 },
    );
  }

  const payload = await readJsonBody(request);

  if (!payload.ok) {
    return NextResponse.json(
      { error: payload.error },
      { status: payload.status ?? 400 },
    );
  }

  const parsed = parseUpdateContactPayload(payload.data, requireFullPayload);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status ?? 400 });
  }

  try {
    const updated = await prisma.contactos.update({
      where: { id: parsedId.data },
      data: {
        ...parsed.data,
        updated_at: new Date(),
      },
      select: contactSelect,
    });
    const detail = await fetchContactDetail(updated.id);

    return NextResponse.json({ data: detail });
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === "P2002") {
      return NextResponse.json(
        { error: "El telefono ya esta registrado en otro contacto." },
        { status: 409 },
      );
    }

    if (code === "P2025") {
      return NextResponse.json(
        { error: "Contacto no encontrado." },
        { status: 404 },
      );
    }

    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("PATCH /api/v1/contactos/[id] failed:", error);
    return NextResponse.json(
      { error: "No fue posible actualizar el contacto." },
      { status: 500 },
    );
  }
}
