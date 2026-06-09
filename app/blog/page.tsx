import { FeaturePage } from "@/components/dashboard/feature-page";

export default function BlogPage() {
  return (
    <FeaturePage
      eyebrow="Blog"
      title="Contenido y posicionamiento"
      description="Administración editorial para artículos, guías y páginas de captación."
      backHref="/"
      backLabel="Volver al dashboard"
      highlights={[
        { label: "Borradores", value: "8" },
        { label: "Publicados", value: "21" },
        { label: "Pendientes", value: "5" },
      ]}
    />
  );
}
