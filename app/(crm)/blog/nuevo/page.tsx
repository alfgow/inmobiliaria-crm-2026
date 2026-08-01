import { BlogForm } from "@/features/blog/components/blog-form";
import { BlogPageShell } from "@/features/blog/components/blog-page-shell";

export default function NewBlogPage() {
  return (
    <BlogPageShell
      eyebrow="Nuevo blog"
      title="Crear articulo"
      description="Redacta contenido editorial, prepara SEO y agrega hasta dos imagenes."
    >
      <BlogForm mode="create" />
    </BlogPageShell>
  );
}
