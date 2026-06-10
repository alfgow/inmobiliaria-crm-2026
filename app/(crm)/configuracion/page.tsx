import { FeaturePage } from "@/components/dashboard/feature-page";

export default function ConfiguracionPage() {
  return (
    <FeaturePage
      eyebrow="Ajustes"
      title="Configuración del sistema"
      description="Espacio reservado para branding, permisos, integraciones y ajustes operativos."
      backHref="/"
      backLabel="Volver al dashboard"
      highlights={[
        { label: "Integraciones", value: "4" },
        { label: "Usuarios", value: "11" },
        { label: "Roles", value: "3" },
      ]}
    />
  );
}
