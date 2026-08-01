import { z } from "zod";

import { BLOG_STATUSES } from "@/features/blog/types/blog-status";

export const MAX_BLOG_IMAGES = 2;

export const blogImageInputSchema = z.object({
  id: z.string().optional(),
  s3Key: z.string().min(1),
  alt: z.string().max(200).optional().nullable(),
  orden: z.number().int().min(0).max(1),
});

export const blogInputSchema = z.object({
  titulo: z.string().trim().min(3, "El titulo debe tener al menos 3 caracteres.").max(200),
  slug: z.string().trim().max(200).optional().nullable(),
  excerpt: z.string().trim().max(320).optional().nullable(),
  contenidoHtml: z.string().trim().min(20, "El contenido debe tener al menos 20 caracteres."),
  status: z.enum(BLOG_STATUSES).default("borrador"),
  seoTitle: z.string().trim().max(200).optional().nullable(),
  seoDescription: z.string().trim().max(320).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  images: z.array(blogImageInputSchema).max(MAX_BLOG_IMAGES).default([]),
});

export type BlogInput = z.infer<typeof blogInputSchema>;
