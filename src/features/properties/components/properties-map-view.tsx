"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import type { MapProperty } from "../types/map";

const COLOR_AVAILABLE = "#d2ff1e";
const COLOR_UNAVAILABLE = "#7c3aed";

const PRICE_FMT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function buildPopupHtml(p: Record<string, unknown>): string {
  const price = PRICE_FMT.format(p.precio as number);
  const tipo = (p.tipo as string).replace(/_/g, " ");
  const operacion = (p.operacion as string).replace(/_/g, " ");
  const location = [p.colonia, p.municipio].filter(Boolean).join(", ");
  const dotColor = p.available ? COLOR_AVAILABLE : COLOR_UNAVAILABLE;
  const dotBorder = p.available ? "#1a1a1a" : "#fff";

  return `
    <div class="crm-popup-inner">
      <p class="crm-popup-title">${p.titulo}</p>
      <p class="crm-popup-price">${price}</p>
      <div class="crm-popup-chips">
        <span class="crm-chip">${tipo}</span>
        <span class="crm-chip">${operacion}</span>
      </div>
      <p class="crm-popup-address">${p.direccion}${location ? ` · ${location}` : ""}</p>
      <p class="crm-popup-status">
        <span class="crm-popup-dot" style="background:${dotColor};border-color:${dotBorder}"></span>
        ${p.estatus}
      </p>
    </div>
  `;
}

type Props = {
  properties: MapProperty[];
  mapStyle: string;
};

export function PropertiesMapView({ properties, mapStyle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [showAvailable, setShowAvailable] = useState(true);
  const [showUnavailable, setShowUnavailable] = useState(true);

  const available = properties.filter((p) => p.available);
  const unavailable = properties.filter((p) => !p.available);

  function toggleLayer(layerId: string, visible: boolean) {
    const map = mapRef.current;
    if (!map || !map.getLayer(layerId)) return;
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }

  useEffect(() => {
    if (!containerRef.current || !properties.length) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

      const lngs = properties.map((p) => p.lng);
      const lats = properties.map((p) => p.lat);
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [centerLng, centerLat],
        zoom: 11,
        attributionControl: false,
      });

      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "bottom-right",
      );

      map.on("load", () => {
        if (cancelled) return;

        const geojson: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: properties.map((p) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [p.lng, p.lat] },
            properties: {
              id: p.id,
              titulo: p.titulo,
              precio: p.precio,
              direccion: p.direccion,
              colonia: p.colonia ?? "",
              municipio: p.municipio ?? "",
              tipo: p.tipo,
              operacion: p.operacion,
              estatus: p.estatus,
              available: p.available,
            },
          })),
        };

        map.addSource("properties", { type: "geojson", data: geojson });

        map.addLayer({
          id: "properties-available",
          type: "circle",
          source: "properties",
          filter: ["==", ["get", "available"], true],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 5, 15, 13],
            "circle-color": COLOR_AVAILABLE,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#1a1a1a",
            "circle-opacity": 0.95,
          },
        });

        map.addLayer({
          id: "properties-unavailable",
          type: "circle",
          source: "properties",
          filter: ["==", ["get", "available"], false],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 5, 15, 13],
            "circle-color": COLOR_UNAVAILABLE,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.88,
          },
        });

        const popup = new mapboxgl.Popup({
          closeButton: false,
          maxWidth: "290px",
          className: "crm-popup",
        });

        const handleClick = (e: any) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const coords = feature.geometry.coordinates.slice() as [number, number];
          popup.setLngLat(coords).setHTML(buildPopupHtml(feature.properties)).addTo(map);
        };

        map.on("click", "properties-available", handleClick);
        map.on("click", "properties-unavailable", handleClick);
        map.on("mouseenter", "properties-available", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseenter", "properties-unavailable", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "properties-available", () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseleave", "properties-unavailable", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["properties-available", "properties-unavailable"],
          });
          if (!features.length) popup.remove();
        });
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Stats panel */}
      <div className="absolute left-4 top-4 rounded-xl border border-white/30 bg-white/90 px-5 py-4 shadow-lg backdrop-blur-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Inmuebles en mapa
        </p>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
            <p className="text-[11px] text-slate-500">Total</p>
          </div>
          <div className="w-px bg-slate-100" />
          <div>
            <p
              className="text-2xl font-bold"
              style={{ color: COLOR_AVAILABLE, WebkitTextStroke: "1px #2c2c2c" }}
            >
              {available.length}
            </p>
            <p className="text-[11px] text-slate-500">Disponibles</p>
          </div>
          <div className="w-px bg-slate-100" />
          <div>
            <p className="text-2xl font-bold" style={{ color: COLOR_UNAVAILABLE }}>
              {unavailable.length}
            </p>
            <p className="text-[11px] text-slate-500">No disponibles</p>
          </div>
        </div>
      </div>

      {/* Legend + filter */}
      <div className="absolute bottom-10 left-4 rounded-xl border border-white/30 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Filtrar
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => {
              const next = !showAvailable;
              setShowAvailable(next);
              toggleLayer("properties-available", next);
            }}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 transition-opacity hover:bg-slate-50"
            style={{ opacity: showAvailable ? 1 : 0.4 }}
          >
            <span
              className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2"
              style={{ background: COLOR_AVAILABLE, borderColor: "#1a1a1a" }}
            />
            Disponibles
            <span className="ml-auto text-slate-400">{available.length}</span>
          </button>
          <button
            onClick={() => {
              const next = !showUnavailable;
              setShowUnavailable(next);
              toggleLayer("properties-unavailable", next);
            }}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 transition-opacity hover:bg-slate-50"
            style={{ opacity: showUnavailable ? 1 : 0.4 }}
          >
            <span
              className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2"
              style={{
                background: COLOR_UNAVAILABLE,
                borderColor: "#ffffff",
                boxShadow: "0 0 0 1px #7c3aed",
              }}
            />
            No disponibles
            <span className="ml-auto text-slate-400">{unavailable.length}</span>
          </button>
        </div>
      </div>

      {!properties.length && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border bg-white/90 px-8 py-6 text-center shadow-lg backdrop-blur-sm">
            <p className="text-sm font-medium text-slate-700">
              Ningún inmueble tiene coordenadas registradas.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Edita un inmueble para fijar su ubicación en el mapa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
