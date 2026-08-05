import { notFound } from "next/navigation";

import { BlogForm } from "@/features/blog/components/blog-form";
import { PageShell } from "@/components/dashboard/page-shell";
import { blogSelect, serializeBlog } from "@/features/blog/services/blog.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditBlogPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await prisma.blogs.findUnique({
    where: { slug },
    select: blogSelect,
  });

  if (!blog) {
    notFound();
  }

  const serialized = serializeBlog(blog);

  return (
    <PageShell
      eyebrow="Editar blog"
      title={serialized.titulo}
      description="Actualiza contenido, estado editorial, imagenes y metadatos SEO."
    >
      <BlogForm mode="edit" blog={serialized} />
    </PageShell>
  );
}
