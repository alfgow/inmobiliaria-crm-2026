"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";

type Props = {
  lat: number | null;
  lng: number | null;
  geocoding?: boolean;
  onPinMove?: (lat: number, lng: number) => void;
  readonly?: boolean;
};

const CDMX: [number, number] = [-99.1332, 19.4326];

export function PropertyMap({ lat, lng, geocoding, onPinMove, readonly = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onPinMoveRef = useRef(onPinMove);
  onPinMoveRef.current = onPinMove;

  useEffect(() => {
    if (!containerRef.current) return;

    const center: [number, number] =
      lat !== null && lng !== null ? [lng, lat] : CDMX;

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/alfgow/cmgnbz7aw000u01ry7bnx7rzp",
        center,
        zoom: lat !== null ? 15 : 11,
        attributionControl: false,
      });

      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "bottom-right",
      );

      const marker = new mapboxgl.Marker({ draggable: !readonly, color: "#7c3aed" })
        .setLngLat(center)
        .addTo(map);

      if (!readonly) {
        marker.on("dragend", () => {
          const pos = marker.getLngLat();
          onPinMoveRef.current?.(pos.lat, pos.lng);
        });
      }

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!markerRef.current || lat === null || lng === null) return;
    markerRef.current.setLngLat([lng, lat]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
  }, [lat, lng]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} className="h-[280px] w-full" />

      {geocoding && (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
          Localizando...
        </div>
      )}

      {!readonly && (
        <div className="absolute bottom-10 left-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] text-slate-500 shadow-sm backdrop-blur-sm">
          Arrastra el pin para ajustar la posición exacta
        </div>
      )}
    </div>
  );
}
