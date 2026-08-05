import { BlogForm } from "@/features/blog/components/blog-form";
import { PageShell } from "@/components/dashboard/page-shell";

export default function NewBlogPage() {
  return (
    <PageShell
      eyebrow="Nuevo blog"
      title="Crear articulo"
      description="Redacta contenido editorial, prepara SEO y agrega hasta dos imagenes."
    >
      <BlogForm mode="create" />
    </PageShell>
  );
}
