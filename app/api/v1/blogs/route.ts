import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "../../../generated/prisma/client";
import { blogInputSchema } from "@/features/blog/schemas/blog.schema";
import {
  blogSelect,
  ensureUniqueBlogSlug,
  parseBlogPayload,
  resolvePublishedAt,
  serializeBlog,
  upsertBlogImages,
} from "@/features/blog/services/blog.service";
import { isBlogStatus } from "@/features/blog/types/blog-status";
import { authenticateApiRequest } from "@/lib/api-auth";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parsePositiveInt(value: string | null, fallback: number) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
}

async function readJsonBody(request: NextRequest) {
  try {
    return { ok: true as const, data: await request.json() };
  } catch {
    return { ok: false as const, error: "El body debe ser JSON valido." };
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const perPage = Math.min(parsePositiveInt(searchParams.get("perPage"), 20), 100);
  const query = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  if (status && !isBlogStatus(status)) {
    return NextResponse.json(
      { error: "status debe ser uno de: borrador, publicado, programado, archivado." },
      { status: 400 },
    );
  }

  const where: Prisma.blogsWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (query.length >= 2) {
    where.OR = [
      { titulo: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
      { contenido: { contains: query, mode: "insensitive" } },
    ];
  }

  try {
    const [blogs, total] = await Promise.all([
      prisma.blogs.findMany({
        where,
        orderBy: [{ published_at: "desc" }, { updated_at: "desc" }, { created_at: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: blogSelect,
      }),
      prisma.blogs.count({ where }),
    ]);

    return NextResponse.json({
      data: blogs.map(serializeBlog),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: "La base de datos no esta disponible." }, { status: 503 });
    }

    console.error("GET /api/v1/blogs failed:", error);
    return NextResponse.json({ error: "No fue posible consultar los blogs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  const payload = await readJsonBody(request);
  if (!payload.ok) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  const normalized = blogInputSchema.safeParse(payload.data);
  const parsed = parseBlogPayload(normalized.success ? normalized.data : payload.data);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const slug = await ensureUniqueBlogSlug(parsed.data.titulo, parsed.data.slug);
    const blog = await prisma.$transaction(async (tx) => {
      const created = await tx.blogs.create({
        data: {
          autor_id: new Prisma.Decimal(auth.apiKey.userId),
          titulo: parsed.data.titulo,
          slug,
          excerpt: parsed.data.excerpt || null,
          contenido: parsed.data.contenidoHtml,
          status: parsed.data.status,
          seo_title: parsed.data.seoTitle || null,
          seo_description: parsed.data.seoDescription || null,
          published_at: resolvePublishedAt(parsed.data.status, parsed.data.publishedAt),
          created_by_api_key_id: BigInt(auth.apiKey.id),
          updated_at: new Date(),
        },
        select: { id: true },
      });

      await upsertBlogImages(created.id, parsed.data.images, tx);
      return tx.blogs.findUniqueOrThrow({ where: { id: created.id }, select: blogSelect });
    });

    return NextResponse.json({ data: serializeBlog(blog) }, { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: "La base de datos no esta disponible." }, { status: 503 });
    }

    console.error("POST /api/v1/blogs failed:", error);
    return NextResponse.json({ error: "No fue posible crear el blog." }, { status: 500 });
  }
}
