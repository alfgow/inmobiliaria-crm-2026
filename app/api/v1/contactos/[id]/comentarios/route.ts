import { NextRequest, NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import {
  commentSelect,
  contactExists,
  fetchContactComments,
  parseCommentPayload,
  parseContactId,
  readJsonBody,
  serializeComment,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";

export const dynamic = "force-dynamic";

type CommentsRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: CommentsRouteContext,
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

    return NextResponse.json({ data: await fetchContactComments(parsedId.data) });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/contactos/[id]/comentarios failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar los comentarios." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: CommentsRouteContext,
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

  const parsed = parseCommentPayload(payload.data);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status ?? 400 });
  }

  try {
    const exists = await contactExists(parsedId.data);

    if (!exists) {
      return NextResponse.json(
        { error: "Contacto no encontrado." },
        { status: 404 },
      );
    }

    const comment = await prisma.comentarios.create({
      data: {
        contacto_id: toDecimalId(parsedId.data),
        comentario: parsed.data,
      },
      select: commentSelect,
    });

    return NextResponse.json({ data: serializeComment(comment) }, { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("POST /api/v1/contactos/[id]/comentarios failed:", error);
    return NextResponse.json(
      { error: "No fue posible crear el comentario." },
      { status: 500 },
    );
  }
}
