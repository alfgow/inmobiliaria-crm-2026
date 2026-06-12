import { PropertiesMapView } from "@/features/properties/components/properties-map-view";
import { getMapProperties } from "@/features/properties/services/map.service";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const properties = await getMapProperties();
  const mapStyle = `mapbox://styles/alfgow/${process.env.NEXT_MAPBOX_STYLE ?? "cmgnbz7aw000u01ry7bnx7rzp"}`;
  const mapboxToken =
    process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  return (
    <div className="-mt-6 h-[calc(100dvh-7rem)] overflow-hidden lg:-mt-0 lg:h-[calc(100dvh-6rem)]">
      <PropertiesMapView
        properties={properties}
        mapStyle={mapStyle}
        mapboxToken={mapboxToken}
      />
    </div>
  );
}
