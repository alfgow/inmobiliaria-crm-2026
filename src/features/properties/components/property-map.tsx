"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";

type Props = {
  lat: number | null;
  lng: number | null;
  geocoding?: boolean;
  onPinMove?: (lat: number, lng: number) => void;
  readonly?: boolean;
  mapboxToken: string;
};

const CDMX: [number, number] = [-99.1332, 19.4326];

function isFiniteCoordinate(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function PropertyMap({
  lat,
  lng,
  geocoding,
  onPinMove,
  readonly = false,
  mapboxToken,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPinMoveRef = useRef(onPinMove);
  const token = mapboxToken.trim();

  useEffect(() => {
    onPinMoveRef.current = onPinMove;
  }, [onPinMove]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!token) return;

    const center: [number, number] =
      isFiniteCoordinate(lat) && isFiniteCoordinate(lng) ? [lng, lat] : CDMX;

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/alfgow/cmgnbz7aw000u01ry7bnx7rzp",
        center,
        zoom: isFiniteCoordinate(lat) && isFiniteCoordinate(lng) ? 15 : 11,
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
  }, [lat, lng, readonly, token]);

  useEffect(() => {
    if (!markerRef.current || !isFiniteCoordinate(lat) || !isFiniteCoordinate(lng)) return;
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

      {!token && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 px-6 text-center backdrop-blur-sm">
          <div className="max-w-sm rounded-xl border border-slate-200 bg-white/95 px-6 py-5 shadow-lg">
            <p className="text-sm font-medium text-slate-700">
              Falta configurar el token de Mapbox.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Define <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> en <code>.env.local</code> para desarrollo o en <code>.env</code> para producción.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
