"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Save, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { createBlog, deleteBlog, updateBlog } from "@/features/blog/actions/manage-blog";
import { BlogEditor } from "@/features/blog/components/blog-editor";
import { blogInputSchema, MAX_BLOG_IMAGES, type BlogInput } from "@/features/blog/schemas/blog.schema";
import { BLOG_STATUSES, getBlogStatusLabel } from "@/features/blog/types/blog-status";

type BlogFormValues = z.input<typeof blogInputSchema>;

type ExistingImage = {
  id?: string;
  s3Key: string;
  url: string;
  alt?: string | null;
  orden: number;
};

type PendingImage = {
  uid: string;
  file: File;
  previewUrl: string;
  alt: string;
};

type Props = {
  mode: "create" | "edit";
  blog?: {
    id: string;
    slug: string;
    titulo: string;
    excerpt: string | null;
    contenidoHtml: string;
    status: string;
    seo: { title: string | null; description: string | null };
    imagenes: ExistingImage[];
    fechas: { publicado: string | null };
  };
};

function getExtension(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext && /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
}

async function uploadBlogImage(blogId: string, image: PendingImage, orden: number) {
  const s3Key = `inmuebles/blogs/${blogId}/${image.uid}.${getExtension(image.file)}`;
  const formData = new FormData();
  formData.append("key", s3Key);
  formData.append("contentType", image.file.type || "image/jpeg");
  formData.append("file", image.file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`No fue posible subir la imagen ${orden + 1}.`);
  }

  return {
    s3Key,
    alt: image.alt || null,
    orden,
  };
}

export function BlogForm({ mode, blog }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(blog?.imagenes ?? []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!previewImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImage(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [previewImage]);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogInputSchema),
    defaultValues: {
      titulo: blog?.titulo ?? "",
      slug: blog?.slug ?? "",
      excerpt: blog?.excerpt ?? "",
      contenidoHtml: blog?.contenidoHtml ?? "<p></p>",
      status: (blog?.status as BlogInput["status"]) ?? "borrador",
      seoTitle: blog?.seo.title ?? "",
      seoDescription: blog?.seo.description ?? "",
      publishedAt: blog?.fechas.publicado ?? null,
      images: [],
    },
  });
  const contentHtml = useWatch({ control: form.control, name: "contenidoHtml" }) ?? "";

  const totalImages = existingImages.length + pendingImages.length;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const available = MAX_BLOG_IMAGES - totalImages;
    if (available <= 0) {
      setError("Cada blog puede tener maximo 2 imagenes.");
      return;
    }

    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, available)
      .map((file) => ({
        uid: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        alt: "",
      }));

    setPendingImages((current) => [...current, ...next]);
  };

  const removePendingImage = (uid: string) => {
    setPendingImages((current) => {
      const image = current.find((item) => item.uid === uid);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.uid !== uid);
    });
  };

  const removeExistingImage = (s3Key: string) => {
    setExistingImages((current) => current.filter((image) => image.s3Key !== s3Key));
  };

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      try {
        const existingPayload = existingImages.map((image, index) => ({
          s3Key: image.s3Key,
          alt: image.alt ?? null,
          orden: index,
        }));

        if (mode === "create") {
          const firstResult = await createBlog({ ...values, images: [] });
          if (firstResult.error || !firstResult.id || !firstResult.slug) {
            setError(firstResult.error ?? "No fue posible crear el blog.");
            return;
          }

          const uploadedImages = await Promise.all(
            pendingImages.map((image, index) => uploadBlogImage(firstResult.id!, image, index)),
          );
          const finalResult = await updateBlog(firstResult.slug, {
            ...values,
            slug: firstResult.slug,
            images: uploadedImages,
          });

          if (finalResult.error) {
            setError(finalResult.error);
            return;
          }

          router.push("/blog");
          router.refresh();
          return;
        }

        if (!blog) return;

        const uploadedImages = await Promise.all(
          pendingImages.map((image, index) => uploadBlogImage(blog.id, image, existingPayload.length + index)),
        );
        const result = await updateBlog(blog.slug, {
          ...values,
          images: [...existingPayload, ...uploadedImages].slice(0, MAX_BLOG_IMAGES),
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        router.push("/blog");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "No fue posible guardar el blog.");
      }
    });
  });

  const handleDelete = () => {
    if (!blog || !window.confirm("Eliminar este blog de forma permanente?")) return;
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteBlog(blog.slug);
      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
        return;
      }
      router.push("/blog");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5 rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)] sm:p-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45" htmlFor="titulo">
            Titulo
          </label>
          <input
            id="titulo"
            className="w-full rounded-2xl border border-border-soft bg-white px-4 py-3 text-lg font-semibold outline-none transition focus:border-brand-secondary"
            {...form.register("titulo")}
          />
          {form.formState.errors.titulo && <p className="text-xs text-error">{form.formState.errors.titulo.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45" htmlFor="excerpt">
            Extracto
          </label>
          <textarea
            id="excerpt"
            rows={3}
            className="w-full resize-none rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-secondary"
            {...form.register("excerpt")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45">
            Contenido
          </label>
          <BlogEditor
            value={contentHtml}
            onChange={(value) => form.setValue("contenidoHtml", value, { shouldDirty: true, shouldValidate: true })}
          />
          {form.formState.errors.contenidoHtml && <p className="text-xs text-error">{form.formState.errors.contenidoHtml.message}</p>}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45" htmlFor="status">
                Estado
              </label>
              <select
                id="status"
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand-secondary"
                {...form.register("status")}
              >
                {BLOG_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getBlogStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45" htmlFor="slug">
                Slug
              </label>
              <input
                id="slug"
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand-secondary"
                {...form.register("slug")}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-text px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar blog
            </button>

            {mode === "edit" && (
              <button
                type="button"
                disabled={isPending || isDeleting}
                onClick={handleDelete}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="size-4" />
                Eliminar
              </button>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-brand-text">Imagenes</h2>
              <p className="text-xs text-brand-text/45">{totalImages}/{MAX_BLOG_IMAGES}</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={totalImages >= MAX_BLOG_IMAGES}
              className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-brand-text transition hover:border-brand-secondary disabled:opacity-50"
            >
              <Upload className="size-4" />
              Subir
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleFiles(event.target.files)} />
          </div>

          <div className="grid gap-3">
            {existingImages.map((image) => (
              <div key={image.s3Key} className="overflow-hidden rounded-2xl border border-border-soft bg-brand-surface">
                <button
                  type="button"
                  onClick={() => setPreviewImage({ url: image.url, alt: image.alt ?? "Imagen de blog" })}
                  className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden"
                  aria-label="Ver imagen en tamaño grande"
                >
                  <Image src={image.url} alt={image.alt ?? "Imagen de blog"} fill className="object-cover" />
                </button>
                <div className="flex items-center justify-between gap-2 p-3">
                  <input
                    value={image.alt ?? ""}
                    onChange={(event) =>
                      setExistingImages((current) =>
                        current.map((item) => (item.s3Key === image.s3Key ? { ...item, alt: event.target.value } : item)),
                      )
                    }
                    placeholder="Alt text"
                    className="min-w-0 flex-1 rounded-lg border border-border-soft bg-white px-2 py-1 text-xs outline-none focus:border-brand-secondary"
                  />
                  <button type="button" onClick={() => removeExistingImage(image.s3Key)} className="inline-flex size-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50" title="Quitar">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}

            {pendingImages.map((image) => (
              <div key={image.uid} className="overflow-hidden rounded-2xl border border-border-soft bg-brand-surface">
                <button
                  type="button"
                  onClick={() => setPreviewImage({ url: image.previewUrl, alt: image.alt || image.file.name })}
                  className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden"
                  aria-label="Ver imagen en tamaño grande"
                >
                  <Image src={image.previewUrl} alt={image.file.name} fill className="object-cover" unoptimized />
                </button>
                <div className="flex items-center justify-between gap-2 p-3">
                  <input
                    value={image.alt}
                    onChange={(event) =>
                      setPendingImages((current) =>
                        current.map((item) => (item.uid === image.uid ? { ...item, alt: event.target.value } : item)),
                      )
                    }
                    placeholder="Alt text"
                    className="min-w-0 flex-1 rounded-lg border border-border-soft bg-white px-2 py-1 text-xs outline-none focus:border-brand-secondary"
                  />
                  <button type="button" onClick={() => removePendingImage(image.uid)} className="inline-flex size-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50" title="Quitar">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}

            {totalImages === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-soft bg-brand-surface/70 text-sm font-medium text-brand-text/45 transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                <ImagePlus className="size-7" />
                Agregar imagen
              </button>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45" htmlFor="seoTitle">
                SEO title
              </label>
              <input id="seoTitle" className="w-full rounded-xl border border-border-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand-secondary" {...form.register("seoTitle")} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text/45" htmlFor="seoDescription">
                SEO description
              </label>
              <textarea id="seoDescription" rows={3} className="w-full resize-none rounded-xl border border-border-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand-secondary" {...form.register("seoDescription")} />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </aside>

      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de la imagen"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewImage(null);
          }}
        >
          <div className="relative h-[min(80vh,900px)] w-full max-w-6xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <Image
              src={previewImage.url}
              alt={previewImage.alt}
              fill
              sizes="(max-width: 768px) 100vw, 90vw"
              className="object-contain"
              unoptimized={previewImage.url.startsWith("blob:")}
              priority
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Cerrar vista ampliada"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
