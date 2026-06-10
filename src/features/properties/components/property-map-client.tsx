"use client";

import loadDynamic from "next/dynamic";

const PropertyMap = loadDynamic(
  () =>
    import("@/features/properties/components/property-map").then(
      (m) => m.PropertyMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] animate-pulse rounded-2xl bg-brand-surface" />
    ),
  },
);

type Props = {
  lat: number | null;
  lng: number | null;
};

export function PropertyMapClient({ lat, lng }: Props) {
  return <PropertyMap lat={lat} lng={lng} readonly />;
}
