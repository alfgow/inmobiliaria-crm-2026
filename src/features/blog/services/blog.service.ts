import sanitizeHtml from "sanitize-html";

import { Prisma } from "../../../../app/generated/prisma/client";
import { blogInputSchema, MAX_BLOG_IMAGES, type BlogInput } from "@/features/blog/schemas/blog.schema";
import { isBlogStatus, type BlogStatus } from "@/features/blog/types/blog-status";
import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";

export type BlogImageRecord = {
  id: bigint;
  blog_id: bigint;
  s3_key: string;
  url: string | null;
  alt: string | null;
  orden: bigint | null;
};

export type BlogRecord = {
  id: bigint;
  autor_id: Prisma.Decimal;
  titulo: string;
  slug: string;
  excerpt: string | null;
  contenido: string;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: Date | null;
  created_by_api_key_id: bigint | null;
  created_at: Date | null;
  updated_at: Date | null;
  blog_images?: BlogImageRecord[];
};

type BlogImageWriter = Pick<typeof prisma, "blog_images">;

const LEGACY_BLOG_BUCKET = process.env.AWS_LEGACY_BLOG_BUCKET ?? "as-s3-blog-images";
const LEGACY_BLOG_REGION = process.env.AWS_LEGACY_BLOG_REGION ?? "mx-central-1";

function getBlogImageUrl(s3Key: string, storedUrl?: string | null) {
  if (s3Key.startsWith("inmuebles/blogs/")) {
    return storedUrl || getPublicImageUrl(s3Key);
  }

  return `https://${LEGACY_BLOG_BUCKET}.s3.${LEGACY_BLOG_REGION}.amazonaws.com/${encodeURI(s3Key)}`;
}

export const blogSelect = {
  id: true,
  autor_id: true,
  titulo: true,
  slug: true,
  excerpt: true,
  contenido: true,
  status: true,
  seo_title: true,
  seo_description: true,
  published_at: true,
  created_by_api_key_id: true,
  created_at: true,
  updated_at: true,
  blog_images: {
    orderBy: [{ orden: "asc" as const }, { id: "asc" as const }],
    select: {
      id: true,
      blog_id: true,
      s3_key: true,
      url: true,
      alt: true,
      orden: true,
    },
  },
};

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 180);
}

export async function ensureUniqueBlogSlug(title: string, requestedSlug?: string | null, currentId?: bigint) {
  const base = toSlug(requestedSlug || title) || "blog";
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.blogs.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

export function sanitizeBlogHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  }).trim();
}

export function parseBlogPayload(input: unknown, allowedExistingKeys: ReadonlySet<string> = new Set()) {
  const parsed = blogInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const cleanHtml = sanitizeBlogHtml(parsed.data.contenidoHtml);
  if (cleanHtml.length < 20) {
    return {
      ok: false as const,
      error: "El contenido no tiene suficiente texto valido.",
    };
  }

  const invalidKey = parsed.data.images.find(
    (image) => !image.s3Key.startsWith("inmuebles/blogs/") && !allowedExistingKeys.has(image.s3Key),
  );
  if (invalidKey) {
    return {
      ok: false as const,
      error: "Las imagenes del blog deben vivir bajo inmuebles/blogs/.",
    };
  }

  return {
    ok: true as const,
    data: {
      ...parsed.data,
      contenidoHtml: cleanHtml,
      images: parsed.data.images.slice(0, MAX_BLOG_IMAGES),
    },
  };
}

export function resolvePublishedAt(status: BlogStatus, value?: string | null) {
  if (status === "publicado") {
    return value ? new Date(value) : new Date();
  }

  return null;
}

export function serializeBlog(blog: BlogRecord) {
  const status = isBlogStatus(blog.status) ? blog.status : "borrador";

  return {
    id: blog.id.toString(),
    slug: blog.slug,
    titulo: blog.titulo,
    excerpt: blog.excerpt,
    contenidoHtml: blog.contenido,
    status,
    seo: {
      title: blog.seo_title,
      description: blog.seo_description,
    },
    imagenes: (blog.blog_images ?? []).map((image) => ({
      id: image.id.toString(),
      s3Key: image.s3_key,
      url: getBlogImageUrl(image.s3_key, image.url),
      alt: image.alt,
      orden: Number(image.orden ?? 0),
    })),
    fechas: {
      creado: blog.created_at?.toISOString() ?? null,
      actualizado: blog.updated_at?.toISOString() ?? null,
      publicado: blog.published_at?.toISOString() ?? null,
    },
    links: {
      self: `/api/v1/blogs/${blog.slug}`,
    },
  };
}

export async function upsertBlogImages(
  blogId: bigint,
  images: BlogInput["images"],
  tx: BlogImageWriter = prisma,
  existingUrls: ReadonlyMap<string, string | null> = new Map(),
) {
  const previousImages = await tx.blog_images.findMany({
    where: { blog_id: blogId },
    select: { s3_key: true },
  });
  const nextKeys = new Set(images.map((image) => image.s3Key));
  const removedKeys = previousImages
    .map((image) => image.s3_key)
    .filter((s3Key) => !nextKeys.has(s3Key));

  await tx.blog_images.deleteMany({ where: { blog_id: blogId } });

  if (images.length === 0) {
    return removedKeys;
  }

  await tx.blog_images.createMany({
    data: images.map((image, index) => ({
      blog_id: blogId,
      disk: "s3",
      s3_key: image.s3Key,
      url: getBlogImageUrl(image.s3Key, existingUrls.get(image.s3Key)),
      alt: image.alt || null,
      orden: image.orden ?? index,
      updated_at: new Date(),
    })),
  });

  return removedKeys;
}
