import { NextRequest, NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import {
  contactExists,
  fetchContactInterests,
  fetchInterestForContact,
  getPrismaErrorCode,
  interestSelect,
  parseContactId,
  parseInterestPayload,
  propertyExists,
  readJsonBody,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";

export const dynamic = "force-dynamic";

type InterestsRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: InterestsRouteContext,
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

    return NextResponse.json({ data: await fetchContactInterests(parsedId.data) });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/contactos/[id]/intereses failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar los intereses." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: InterestsRouteContext,
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

  const parsed = parseInterestPayload(payload.data);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status ?? 400 });
  }

  try {
    const [exists, propertyIsValid] = await Promise.all([
      contactExists(parsedId.data),
      propertyExists(BigInt(parsed.data)),
    ]);

    if (!exists) {
      return NextResponse.json(
        { error: "Contacto no encontrado." },
        { status: 404 },
      );
    }

    if (!propertyIsValid) {
      return NextResponse.json(
        { error: "Inmueble no encontrado." },
        { status: 404 },
      );
    }

    const interest = await prisma.intereses.create({
      data: {
        contacto_id: toDecimalId(parsedId.data),
        inmueble_id: toDecimalId(parsed.data),
      },
      select: interestSelect,
    });
    const detail = await fetchInterestForContact(parsedId.data, interest.id);

    return NextResponse.json({ data: detail }, { status: 201 });
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

    console.error("POST /api/v1/contactos/[id]/intereses failed:", error);
    return NextResponse.json(
      { error: "No fue posible agregar el interes." },
      { status: 500 },
    );
  }
}
