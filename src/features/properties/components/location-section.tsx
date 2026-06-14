"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { ColoniaRow } from "@/actions/codigos-postales";
import { searchByColonia, searchByCp } from "@/actions/codigos-postales";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LocationValue = {
  address: string;
  colonia: string;
  municipio: string;
  estado: string;
  cp: string;
  lat: string;
  lng: string;
};

function parseCoordinate(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// ── Lazy map (no SSR) ─────────────────────────────────────────────────────────

const PropertyMap = dynamic(
  () =>
    import("./property-map").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full animate-pulse rounded-xl bg-slate-100" />
    ),
  },
);

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Sep() {
  return <hr className="border-slate-100" />;
}

function AutocompleteField({
  label,
  value,
  onChange,
  suggestions,
  showDropdown,
  onFocus,
  onBlur,
  onSelect,
  loading,
  placeholder,
  hint,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: ColoniaRow[];
  showDropdown: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: (r: ColoniaRow) => void;
  loading?: boolean;
  placeholder?: string;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={() => setTimeout(onBlur, 150)}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className={inputBase}
          autoComplete="off"
        />

        {loading && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-200 border-t-slate-600" />
          </div>
        )}

        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li
                key={`${s.colonia}-${s.cp}-${i}`}
                onMouseDown={() => onSelect(s)}
                className="cursor-pointer px-4 py-2.5 transition hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-900">{s.colonia}</p>
                <p className="text-xs text-slate-500">
                  {s.municipio}, {s.estado}
                  <span className="ml-1.5 font-mono text-slate-400">
                    CP {s.cp}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LocationSection({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const [coloniaSuggs, setColoniaSuggs] = useState<ColoniaRow[]>([]);
  const [cpSuggs, setCpSuggs] = useState<ColoniaRow[]>([]);
  const [showColoniaDD, setShowColoniaDD] = useState(false);
  const [showCpDD, setShowCpDD] = useState(false);
  const [coloniaLoading, setColoniaLoading] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Stable refs — always hold the latest value/onChange without being in effect deps
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const set = (partial: Partial<LocationValue>) =>
    onChangeRef.current({ ...valueRef.current, ...partial });

  // ── Colonia autocomplete ────────────────────────────────────────────────────

  const coloniaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleColoniaChange = (q: string) => {
    set({ colonia: q });
    if (coloniaTimer.current) clearTimeout(coloniaTimer.current);
    if (q.length < 3) {
      setColoniaSuggs([]);
      setShowColoniaDD(false);
      return;
    }
    setColoniaLoading(true);
    coloniaTimer.current = setTimeout(async () => {
      const results = await searchByColonia(q);
      setColoniaSuggs(results);
      setShowColoniaDD(results.length > 0);
      setColoniaLoading(false);
    }, 300);
  };

  const selectColonia = (r: ColoniaRow) => {
    onChangeRef.current({
      ...valueRef.current,
      colonia: r.colonia,
      municipio: r.municipio,
      estado: r.estado,
      cp: r.cp,
    });
    setShowColoniaDD(false);
    setColoniaSuggs([]);
  };

  // ── Código postal autocomplete ──────────────────────────────────────────────

  const cpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCpChange = (q: string) => {
    set({ cp: q });
    if (cpTimer.current) clearTimeout(cpTimer.current);
    if (q.length !== 5) {
      setCpSuggs([]);
      setShowCpDD(false);
      return;
    }
    setCpLoading(true);
    cpTimer.current = setTimeout(async () => {
      const results = await searchByCp(q);
      setCpSuggs(results);
      setShowCpDD(results.length > 0);
      setCpLoading(false);
    }, 300);
  };

  const selectCp = (r: ColoniaRow) => {
    onChangeRef.current({
      ...valueRef.current,
      colonia: r.colonia,
      municipio: r.municipio,
      estado: r.estado,
      cp: r.cp,
    });
    setShowCpDD(false);
    setCpSuggs([]);
  };

  // ── Geocoding ───────────────────────────────────────────────────────────────

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

    geocodeTimer.current = setTimeout(async () => {
      const { address, colonia, municipio, estado } = valueRef.current;
      const parts = [address, colonia, municipio, estado].filter(Boolean);
      if (parts.length < 2) return;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;

      setGeocoding(true);
      try {
        const query = [...parts, "México"].join(", ");
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=MX&access_token=${token}&limit=1`,
        );
        const data = (await res.json()) as {
          features?: Array<{ center: [number, number] }>;
        };
        if (data.features?.[0]) {
          const [lng, lat] = data.features[0].center;
          onChangeRef.current({
            ...valueRef.current,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
          });
        }
      } catch {
        // silent – geocoding is a convenience, not critical
      } finally {
        setGeocoding(false);
      }
    }, 1200);

    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
  }, [value.address, value.colonia, value.municipio, value.estado]);

  // ── Pin drag ────────────────────────────────────────────────────────────────

  const handlePinMove = (lat: number, lng: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    onChangeRef.current({
      ...valueRef.current,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const parsedLat = parseCoordinate(value.lat);
  const parsedLng = parseCoordinate(value.lng);
  const hasCoords = parsedLat !== null && parsedLng !== null;

  return (
    <div className="space-y-4 px-6 py-6 sm:px-10 lg:px-16">
      <Field label="Dirección">
        <input
          type="text"
          value={value.address}
          onChange={(e) => set({ address: e.target.value })}
          placeholder="Calle, número exterior, interior y referencias"
          className={inputBase}
          autoComplete="off"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <AutocompleteField
          label="Colonia"
          value={value.colonia}
          onChange={handleColoniaChange}
          suggestions={coloniaSuggs}
          showDropdown={showColoniaDD}
          onFocus={() => coloniaSuggs.length > 0 && setShowColoniaDD(true)}
          onBlur={() => setShowColoniaDD(false)}
          onSelect={selectColonia}
          loading={coloniaLoading}
          placeholder="Ej. Polanco IV Sección"
        />

        <AutocompleteField
          label="Código postal"
          value={value.cp}
          onChange={handleCpChange}
          suggestions={cpSuggs}
          showDropdown={showCpDD}
          onFocus={() => cpSuggs.length > 0 && setShowCpDD(true)}
          onBlur={() => setShowCpDD(false)}
          onSelect={selectCp}
          loading={cpLoading}
          placeholder="11560"
          inputMode="numeric"
          maxLength={5}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Municipio / Alcaldía">
          <input
            type="text"
            value={value.municipio}
            onChange={(e) => set({ municipio: e.target.value })}
            placeholder="Ej. Miguel Hidalgo"
            className={inputBase}
          />
        </Field>
        <Field label="Estado">
          <input
            type="text"
            value={value.estado}
            onChange={(e) => set({ estado: e.target.value })}
            placeholder="Ej. Ciudad de México"
            className={inputBase}
          />
        </Field>
      </div>

      <Sep />

      {/* Map */}
      <div>
        <PropertyMap
          lat={parsedLat}
          lng={parsedLng}
          geocoding={geocoding}
          onPinMove={handlePinMove}
        />
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Latitud"
          hint={hasCoords ? undefined : "Automática desde dirección"}
        >
          <input
            type="number"
            step="0.000001"
            value={value.lat}
            onChange={(e) => set({ lat: e.target.value })}
            placeholder="19.432608"
            className={`${inputBase} font-mono text-xs`}
          />
        </Field>
        <Field label="Longitud">
          <input
            type="number"
            step="0.000001"
            value={value.lng}
            onChange={(e) => set({ lng: e.target.value })}
            placeholder="-99.133209"
            className={`${inputBase} font-mono text-xs`}
          />
        </Field>
      </div>
    </div>
  );
}
