import { BarChart3, Clock3, FileText, Send } from "lucide-react";

import { BlogPageShell } from "@/features/blog/components/blog-page-shell";
import { BlogTable, type BlogListItem } from "@/features/blog/components/blog-table";
import { blogSelect, serializeBlog } from "@/features/blog/services/blog.service";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function metricCard(label: string, value: number, icon: React.ReactNode) {
  return (
    <div className="rounded-[1.5rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)]">
      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-brand-primary/40 text-brand-text">
        {icon}
      </div>
      <p className="text-2xl font-semibold text-brand-text">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text/40">{label}</p>
    </div>
  );
}

export default async function BlogPage() {
  let blogs: BlogListItem[] = [];
  let metrics = {
    total: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
  };
  let databaseUnavailable = false;

  try {
    const [rawBlogs, total, published, drafts, scheduled] = await Promise.all([
      prisma.blogs.findMany({
        orderBy: [{ updated_at: "desc" }, { created_at: "desc" }],
        take: 200,
        select: blogSelect,
      }),
      prisma.blogs.count(),
      prisma.blogs.count({ where: { status: "publicado" } }),
      prisma.blogs.count({ where: { status: "borrador" } }),
      prisma.blogs.count({ where: { status: "programado" } }),
    ]);

    blogs = rawBlogs.map(serializeBlog);
    metrics = { total, published, drafts, scheduled };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    databaseUnavailable = true;
  }

  return (
    <BlogPageShell
      eyebrow="Blog"
      title="Contenido y posicionamiento"
      description="Administra articulos, guias y contenido SEO con estado editorial, imagenes y API para agentes AI."
      actionHref="/blog/nuevo"
      actionLabel="Nuevo articulo"
    >
      {databaseUnavailable ? (
        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          La base de datos no responde en este momento. Verifica PostgreSQL o `DATABASE_URL`.
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCard("Total", metrics.total, <BarChart3 className="size-5" />)}
            {metricCard("Publicados", metrics.published, <Send className="size-5" />)}
            {metricCard("Borradores", metrics.drafts, <FileText className="size-5" />)}
            {metricCard("Programados", metrics.scheduled, <Clock3 className="size-5" />)}
          </section>
          <BlogTable blogs={blogs} />
        </>
      )}
    </BlogPageShell>
  );
}
