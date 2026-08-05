import { NextRequest, NextResponse } from "next/server";

import {
  blogSelect,
  ensureUniqueBlogSlug,
  parseBlogPayload,
  resolvePublishedAt,
  serializeBlog,
  upsertBlogImages,
} from "@/features/blog/services/blog.service";
import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/s3";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

async function readJsonBody(request: NextRequest) {
  try {
    return { ok: true as const, data: await request.json() };
  } catch {
    return { ok: false as const, error: "El body debe ser JSON valido." };
  }
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  const { slug } = await params;

  try {
    const blog = await prisma.blogs.findUnique({
      where: { slug },
      select: blogSelect,
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ data: serializeBlog(blog) });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: "La base de datos no esta disponible." }, { status: 503 });
    }

    console.error("GET /api/v1/blogs/[slug] failed:", error);
    return NextResponse.json({ error: "No fue posible consultar el blog." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const payload = await readJsonBody(request);
  if (!payload.ok) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  const parsed = parseBlogPayload(payload.data);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const current = await prisma.blogs.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Blog no encontrado." }, { status: 404 });
    }

    const nextSlug = await ensureUniqueBlogSlug(parsed.data.titulo, parsed.data.slug || slug, current.id);
    const { blog, removedKeys } = await prisma.$transaction(async (tx) => {
      await tx.blogs.update({
        where: { id: current.id },
        data: {
          titulo: parsed.data.titulo,
          slug: nextSlug,
          excerpt: parsed.data.excerpt || null,
          contenido: parsed.data.contenidoHtml,
          status: parsed.data.status,
          seo_title: parsed.data.seoTitle || null,
          seo_description: parsed.data.seoDescription || null,
          published_at: resolvePublishedAt(parsed.data.status, parsed.data.publishedAt),
          updated_at: new Date(),
        },
      });

      const removedKeys = await upsertBlogImages(current.id, parsed.data.images, tx);
      const blog = await tx.blogs.findUniqueOrThrow({ where: { id: current.id }, select: blogSelect });
      return { blog, removedKeys };
    });

    await Promise.allSettled(removedKeys.map((s3Key) => deleteObject(s3Key)));
    return NextResponse.json({ data: serializeBlog(blog) });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: "La base de datos no esta disponible." }, { status: 503 });
    }

    console.error("PATCH /api/v1/blogs/[slug] failed:", error);
    return NextResponse.json({ error: "No fue posible actualizar el blog." }, { status: 500 });
  }
}
