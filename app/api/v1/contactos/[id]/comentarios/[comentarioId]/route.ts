import { NextRequest, NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import {
  commentSelect,
  parseCommentPayload,
  parseContactId,
  parseResourceId,
  readJsonBody,
  serializeComment,
  toDecimalId,
} from "@/features/contacts/services/contact-api.service";

export const dynamic = "force-dynamic";

type CommentRouteContext = {
  params: Promise<{ id: string; comentarioId: string }>;
};

export async function GET(
  request: NextRequest,
  context: CommentRouteContext,
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
    const comment = await prisma.comentarios.findFirst({
      where: {
        id: parsed.commentId,
        contacto_id: toDecimalId(parsed.contactId),
      },
      select: commentSelect,
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentario no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: serializeComment(comment) });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("GET /api/v1/contactos/[id]/comentarios/[comentarioId] failed:", error);
    return NextResponse.json(
      { error: "No fue posible consultar el comentario." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: CommentRouteContext,
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

  const parsed = parseCommentPayload(payload.data);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status ?? 400 });
  }

  try {
    const currentComment = await prisma.comentarios.findFirst({
      where: {
        id: routeParams.commentId,
        contacto_id: toDecimalId(routeParams.contactId),
      },
      select: { id: true },
    });

    if (!currentComment) {
      return NextResponse.json(
        { error: "Comentario no encontrado." },
        { status: 404 },
      );
    }

    const comment = await prisma.comentarios.update({
      where: { id: routeParams.commentId },
      data: { comentario: parsed.data },
      select: commentSelect,
    });

    return NextResponse.json({ data: serializeComment(comment) });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("PATCH /api/v1/contactos/[id]/comentarios/[comentarioId] failed:", error);
    return NextResponse.json(
      { error: "No fue posible actualizar el comentario." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: CommentRouteContext,
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
    const currentComment = await prisma.comentarios.findFirst({
      where: {
        id: parsed.commentId,
        contacto_id: toDecimalId(parsed.contactId),
      },
      select: { id: true },
    });

    if (!currentComment) {
      return NextResponse.json(
        { error: "Comentario no encontrado." },
        { status: 404 },
      );
    }

    await prisma.comentarios.delete({ where: { id: parsed.commentId } });

    return NextResponse.json({
      data: { id: parsed.commentId.toString() },
      message: "Comentario eliminado.",
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no esta disponible." },
        { status: 503 },
      );
    }

    console.error("DELETE /api/v1/contactos/[id]/comentarios/[comentarioId] failed:", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el comentario." },
      { status: 500 },
    );
  }
}

async function parseRouteParams(context: CommentRouteContext) {
  const { id, comentarioId } = await context.params;
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

  const parsedCommentId = parseResourceId(comentarioId, "comentarioId");

  if (!parsedCommentId.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: parsedCommentId.error },
        { status: parsedCommentId.status ?? 400 },
      ),
    };
  }

  return {
    ok: true as const,
    contactId: parsedContactId.data,
    commentId: parsedCommentId.data,
  };
}
