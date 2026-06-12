import { PropertiesMapView } from "@/features/properties/components/properties-map-view";
import { getMapProperties } from "@/features/properties/services/map.service";

export default async function MapaPage() {
  const properties = await getMapProperties();
  const mapStyle = `mapbox://styles/alfgow/${process.env.NEXT_MAPBOX_STYLE ?? "cmgnbz7aw000u01ry7bnx7rzp"}`;

  return (
    <div className="px-4 pb-6 pt-4 lg:px-8 lg:pb-8 lg:pt-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={{ height: "calc(100dvh - 10rem)" }}>
        <PropertiesMapView properties={properties} mapStyle={mapStyle} />
      </div>
    </div>
  );
}
