import { FeaturePage } from "@/components/dashboard/feature-page";

export default function MapaPage() {
  return (
    <FeaturePage
      eyebrow="Mapa"
      title="Vista geoespacial del inventario"
      description="Aquí podrás cruzar inmuebles, leads y zonas de oportunidad en una vista más visual."
      backHref="/"
      backLabel="Volver al dashboard"
      highlights={[
        { label: "Zonas activas", value: "12" },
        { label: "Puntos calientes", value: "7" },
        { label: "Inmuebles visibles", value: "84" },
      ]}
    />
  );
}
