import { NextRequest, NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import {
  fetchInterestForContact,
  getPrismaErrorCode,
  interestSelect,
  parseContactId,
  parseInterestPayload,
  parseResourceId,
  propertyExists,
  readJsonBody,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";

export const dynamic = "force-dynamic";

type InterestRouteContext = {
  params: Promise<{ id: string; interesId: string }>;
};

export async function GET(
  request: NextRequest,
  context: InterestRouteContext,
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseRouteParams(context);

  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const interest = await fetchInterestForContact(parsed.contactId, parsed.interestId);

    if (!interest) {
      return NextResponse.json(
        { error: "Interes no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: interest });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/contactos/[id]/intereses/[interesId] failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar el interes." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: InterestRouteContext,
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const routeParams = await parseRouteParams(context);

  if (!routeParams.ok) {
    return routeParams.response;
  }

  const payload = await readJsonBody(request);

  if (!payload.ok) {
    return NextResponse.json(
      { error: payload.error },
      { status: payload.status ?? 400 },
    );
  }

  const parsed = parseInterestPayload(payload.data);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status ?? 400 });
  }

  try {
    const [currentInterest, propertyIsValid] = await Promise.all([
      prisma.intereses.findFirst({
        where: {
          id: routeParams.interestId,
          contacto_id: toDecimalId(routeParams.contactId),
        },
        select: { id: true },
      }),
      propertyExists(BigInt(parsed.data)),
    ]);

    if (!currentInterest) {
      return NextResponse.json(
        { error: "Interes no encontrado." },
        { status: 404 },
      );
    }

    if (!propertyIsValid) {
      return NextResponse.json(
        { error: "Inmueble no encontrado." },
        { status: 404 },
      );
    }

    const updated = await prisma.intereses.update({
      where: { id: routeParams.interestId },
      data: { inmueble_id: toDecimalId(parsed.data) },
      select: interestSelect,
    });
    const detail = await fetchInterestForContact(routeParams.contactId, updated.id);

    return NextResponse.json({ data: detail });
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === "P2002") {
      return NextResponse.json(
        { error: "Este inmueble ya esta registrado como interes del contacto." },
        { status: 409 },
      );
    }

    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("PATCH /api/v1/contactos/[id]/intereses/[interesId] failed:", error);
    return NextResponse.json(
      { error: "No fue posible actualizar el interes." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: InterestRouteContext,
) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseRouteParams(context);

  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const currentInterest = await prisma.intereses.findFirst({
      where: {
        id: parsed.interestId,
        contacto_id: toDecimalId(parsed.contactId),
      },
      select: { id: true },
    });

    if (!currentInterest) {
      return NextResponse.json(
        { error: "Interes no encontrado." },
        { status: 404 },
      );
    }

    await prisma.intereses.delete({ where: { id: parsed.interestId } });

    return NextResponse.json({
      data: { id: parsed.interestId.toString() },
      message: "Interes eliminado.",
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("DELETE /api/v1/contactos/[id]/intereses/[interesId] failed:", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el interes." },
      { status: 500 },
    );
  }
}

async function parseRouteParams(context: InterestRouteContext) {
  const { id, interesId } = await context.params;
  const parsedContactId = parseContactId(id);

  if (!parsedContactId.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: parsedContactId.error },
        { status: parsedContactId.status ?? 400 },
      ),
    };
  }

  const parsedInterestId = parseResourceId(interesId, "interesId");

  if (!parsedInterestId.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: parsedInterestId.error },
        { status: parsedInterestId.status ?? 400 },
      ),
    };
  }

  return {
    ok: true as const,
    contactId: parsedContactId.data,
    interestId: parsedInterestId.data,
  };
}
