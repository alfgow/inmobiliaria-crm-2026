"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { Prisma } from "../../../../app/generated/prisma/client";
import {
  ensureUniqueBlogSlug,
  parseBlogPayload,
  resolvePublishedAt,
  upsertBlogImages,
} from "@/features/blog/services/blog.service";
import { isBlogStatus } from "@/features/blog/types/blog-status";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/s3";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return token ? verifyToken(token) : null;
}

function revalidateBlogPaths(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/blog/nuevo");
  if (slug) {
    revalidatePath(`/blog/${slug}/editar`);
  }
}

export async function createBlog(input: unknown) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Tu sesion expiro. Vuelve a iniciar sesion." };
  }

  const parsed = parseBlogPayload(input);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const now = new Date();
  const status = parsed.data.status;

  try {
    const slug = await ensureUniqueBlogSlug(parsed.data.titulo, parsed.data.slug);
    const blog = await prisma.$transaction(async (tx) => {
      const created = await tx.blogs.create({
        data: {
          autor_id: new Prisma.Decimal(user.id),
          titulo: parsed.data.titulo,
          slug,
          excerpt: parsed.data.excerpt || null,
          contenido: parsed.data.contenidoHtml,
          status,
          seo_title: parsed.data.seoTitle || null,
          seo_description: parsed.data.seoDescription || null,
          published_at: resolvePublishedAt(status, parsed.data.publishedAt),
          updated_at: now,
        },
        select: { id: true, slug: true },
      });

      await upsertBlogImages(created.id, parsed.data.images, tx);
      return created;
    });

    revalidateBlogPaths(blog.slug);
    return { success: true, id: blog.id.toString(), slug: blog.slug };
  } catch (error) {
    console.error("createBlog error:", error);
    return { error: "No fue posible crear el blog." };
  }
}

export async function updateBlog(slug: string, input: unknown) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Tu sesion expiro. Vuelve a iniciar sesion." };
  }

  const current = await prisma.blogs.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      blog_images: { select: { s3_key: true, url: true } },
    },
  });

  if (!current) {
    return { error: "Blog no encontrado." };
  }

  const existingKeys = new Set(current.blog_images.map((image) => image.s3_key));
  const parsed = parseBlogPayload(input, existingKeys);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const now = new Date();
  const status = parsed.data.status;

  try {
    const nextSlug = await ensureUniqueBlogSlug(parsed.data.titulo, parsed.data.slug || slug, current.id);

    const removedKeys = await prisma.$transaction(async (tx) => {
      await tx.blogs.update({
        where: { id: current.id },
        data: {
          titulo: parsed.data.titulo,
          slug: nextSlug,
          excerpt: parsed.data.excerpt || null,
          contenido: parsed.data.contenidoHtml,
          status,
          seo_title: parsed.data.seoTitle || null,
          seo_description: parsed.data.seoDescription || null,
          published_at: resolvePublishedAt(status, parsed.data.publishedAt),
          updated_at: now,
        },
      });

      const existingUrls = new Map(
        current.blog_images.map((image) => [image.s3_key, image.url] as const),
      );
      return upsertBlogImages(current.id, parsed.data.images, tx, existingUrls);
    });

    await Promise.allSettled(removedKeys.map((s3Key) => deleteObject(s3Key)));
    revalidateBlogPaths(slug);
    revalidateBlogPaths(nextSlug);
    return { success: true, slug: nextSlug };
  } catch (error) {
    console.error("updateBlog error:", error);
    return { error: "No fue posible guardar el blog." };
  }
}

export async function deleteBlog(slug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Tu sesion expiro. Vuelve a iniciar sesion." };
  }

  try {
    const blog = await prisma.blogs.findUnique({
      where: { slug },
      select: {
        id: true,
        blog_images: { select: { s3_key: true } },
      },
    });

    if (!blog) {
      return { error: "Blog no encontrado." };
    }

    await prisma.blogs.delete({ where: { id: blog.id } });

    await Promise.allSettled(blog.blog_images.map((image) => deleteObject(image.s3_key)));
    revalidateBlogPaths(slug);
    return { success: true };
  } catch (error) {
    console.error("deleteBlog error:", error);
    return { error: "No fue posible eliminar el blog." };
  }
}

export async function updateBlogStatus(slug: string, status: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Tu sesion expiro. Vuelve a iniciar sesion." };
  }

  if (!isBlogStatus(status)) {
    return { error: "Estado invalido." };
  }

  try {
    await prisma.blogs.update({
      where: { slug },
      data: {
        status,
        published_at: status === "publicado" ? new Date() : null,
        updated_at: new Date(),
      },
    });

    revalidateBlogPaths(slug);
    return { success: true };
  } catch (error) {
    console.error("updateBlogStatus error:", error);
    return { error: "No fue posible actualizar el estado." };
  }
}
