"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import {
  DashboardMobileDock,
  DashboardNavbar,
} from "@/components/dashboard/dashboard-navbar";

const propertyTypes = [
  "Casa",
  "Departamento",
  "Penthouse",
  "Terreno",
  "Local comercial",
  "Oficina",
  "Bodega",
  "Consultorio",
  "Villa",
];

const operationTypes = ["Venta", "Renta", "Preventa", "Traspaso"];
const currencies = ["MXN", "USD", "EUR"];

const statesMx = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "México",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

const amenitiesCatalog = [
  "Alberca",
  "Gimnasio",
  "Roof Garden",
  "Seguridad 24/7",
  "Elevador",
  "Salón de usos múltiples",
  "Área infantil",
  "Cancha",
  "Bodega",
  "Balcón",
  "Terraza",
];

const requirementExamples = [
  "Comprobar ingresos 3x renta",
  "Fiador con inmueble",
  "Póliza jurídica",
  "Identificación oficial",
];

const restrictionExamples = [
  "No mascotas",
  "No estudiantes",
  "No Airbnb",
  "No fumar",
];

const internalStatuses = [
  "Disponible",
  "Reservado",
  "En negociación",
  "Rentado",
  "Vendido",
  "Pausado",
];

const advisors = [
  "Equipo Polanco",
  "Ana Martínez",
  "Luis Hernández",
  "Mariana Soto",
  "Javier Ortega",
];

const inputClass =
  "w-full rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

const textareaClass = `${inputClass} min-h-[120px] resize-none`;
const selectClass = `${inputClass} appearance-none`;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function SectionCard({
  index,
  title,
  subtitle,
  accentClass,
  children,
}: {
  index: string;
  title: string;
  subtitle: string;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.62)_100%)]" />
      <div className="relative">
        <div className="mb-6 flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] text-sm font-semibold ${accentClass}`}
          >
            {index}
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          {label}
        </label>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition ${
        checked
          ? "border-sky-300 bg-sky-50 text-slate-950 shadow-[0_16px_32px_rgba(14,165,233,0.12)]"
          : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300"
      }`}
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <span
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-sky-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function ChipButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-slate-900 bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
          : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
      }`}
    >
      {label}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UploadDropzone({
  title,
  description,
  multiple,
  fileNames,
  onChange,
}: {
  title: string;
  description: string;
  multiple?: boolean;
  fileNames: string[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white/90 p-6 transition hover:border-sky-300 hover:bg-sky-50/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <PlusIcon />
        </div>
      </div>

      <div className="mt-4">
        {fileNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fileNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            PNG · JPG · WEBP
          </p>
        )}
      </div>

      <input
        type="file"
        className="sr-only"
        accept="image/*"
        multiple={multiple}
        onChange={onChange}
      />
    </label>
  );
}

function ListCollection({
  items,
  emptyLabel,
  toneClass,
  onRemove,
}: {
  items: string[];
  emptyLabel: string;
  toneClass: string;
  onRemove: (index: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${toneClass}`} />
            <span className="text-sm text-slate-700">{item}</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-slate-400 transition hover:text-rose-500"
            aria-label={`Eliminar ${item}`}
          >
            <XIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function NewPropertyPage() {
  const [title, setTitle] = useState("");
  const [mainPhotoNames, setMainPhotoNames] = useState<string[]>([]);
  const [galleryNames, setGalleryNames] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Seguridad 24/7",
    "Elevador",
  ]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [requirementDraft, setRequirementDraft] = useState("");
  const [restrictionDraft, setRestrictionDraft] = useState("");
  const [tags, setTags] = useState<string[]>([
    "premium",
    "polanco",
    "listo-para-publicar",
  ]);
  const [tagDraft, setTagDraft] = useState("");
  const [maintenanceIncluded, setMaintenanceIncluded] = useState(false);
  const [sharedCommission, setSharedCommission] = useState(true);
  const [hasElevator, setHasElevator] = useState(true);
  const [isFurnished, setIsFurnished] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [featured, setFeatured] = useState(true);
  const [visible, setVisible] = useState(true);

  const slug = useMemo(() => slugify(title), [title]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity],
    );
  };

  const addUniqueItem = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    clear: () => void,
  ) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    setter((current) =>
      current.includes(normalized) ? current : [...current, normalized],
    );
    clear();
  };

  const removeAt = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
  ) => {
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const setFileNames = (
    event: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const files = Array.from(event.target.files ?? []).map((file) => file.name);
    setter(files);
  };

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden bg-slate-50 px-4 py-6 pb-28 text-slate-950 sm:px-6 lg:px-10 lg:pb-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 lg:flex-row lg:items-start">
          <div className="hidden lg:block lg:shrink-0">
            <DashboardNavbar />
          </div>

          <div className="min-w-0 flex-1">
            <form
              onSubmit={(event) => event.preventDefault()}
              className="space-y-6"
            >
              <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 px-6 py-8 text-white shadow-2xl sm:px-8 sm:py-10">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-4xl">
                    <nav className="mb-5 flex items-center gap-2 text-xs text-zinc-500">
                      <Link href="/" className="transition hover:text-zinc-300">
                        Dashboard
                      </Link>
                      <span>/</span>
                      <Link
                        href="/inmuebles"
                        className="transition hover:text-zinc-300"
                      >
                        Inmuebles
                      </Link>
                      <span>/</span>
                      <span className="text-zinc-300">Nuevo</span>
                    </nav>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
                      Captura inicial
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                      Nuevo inmueble
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                      Primera versión visual del formulario para registrar
                      propiedades. La experiencia ya está lista para captura y
                      revisión interna; la conexión con Prisma puede agregarse
                      después sin rehacer la UI.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:w-[460px]">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                        Secciones
                      </p>
                      <p className="mt-2 text-3xl font-semibold">09</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                        Amenidades
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {selectedAmenities.length}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                        Tags
                      </p>
                      <p className="mt-2 text-3xl font-semibold">{tags.length}</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                  <SectionCard
                    index="01"
                    title="Información principal"
                    subtitle="Nombre comercial, slug visual y clasificación base del inmueble."
                    accentClass="bg-sky-100 text-sky-700"
                  >
                    <div className="grid gap-5">
                      <Field label="Título">
                        <input
                          type="text"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Ej. Penthouse con terraza privada en Polanco"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Slug automático" hint="Solo lectura visual">
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-xs text-slate-400">
                            /inmuebles/
                          </span>
                          <input
                            type="text"
                            readOnly
                            value={slug}
                            placeholder="se-genera-desde-el-titulo"
                            className={`${inputClass} cursor-default bg-slate-50 pl-[6.25rem] font-mono text-xs text-slate-500`}
                          />
                        </div>
                      </Field>

                      <Field label="Descripción">
                        <textarea
                          placeholder="Describe la experiencia, atributos diferenciales, distribución, acabados, entorno y beneficios del inmueble."
                          className={textareaClass}
                        />
                      </Field>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Tipo de inmueble">
                          <select className={selectClass} defaultValue="">
                            <option value="" disabled>
                              Seleccionar tipo
                            </option>
                            {propertyTypes.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Operación">
                          <select className={selectClass} defaultValue="">
                            <option value="" disabled>
                              Seleccionar operación
                            </option>
                            {operationTypes.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="02"
                    title="Precio"
                    subtitle="Valor comercial, moneda y reglas económicas del listing."
                    accentClass="bg-emerald-100 text-emerald-700"
                  >
                    <div className="grid gap-5">
                      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
                        <Field label="Precio">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Moneda">
                          <select className={selectClass} defaultValue="MXN">
                            {currencies.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ToggleCard
                          label="Mantenimiento incluido"
                          description="Marca si la cuota ya está integrada en el precio publicado."
                          checked={maintenanceIncluded}
                          onChange={setMaintenanceIncluded}
                        />
                        <ToggleCard
                          label="Comisión compartida"
                          description="Activa si el cierre contempla co-broker o reparto con otro asesor."
                          checked={sharedCommission}
                          onChange={setSharedCommission}
                        />
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Monto mantenimiento">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            disabled={!maintenanceIncluded}
                            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                          />
                        </Field>

                        <Field label="Porcentaje comisión">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="0"
                            disabled={!sharedCommission}
                            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                          />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="03"
                    title="Ubicación"
                    subtitle="Dirección operativa, referencia geográfica y punto exacto para mapa."
                    accentClass="bg-violet-100 text-violet-700"
                  >
                    <div className="grid gap-5">
                      <Field label="Dirección">
                        <input
                          type="text"
                          placeholder="Calle, número exterior, interior y referencias"
                          className={inputClass}
                        />
                      </Field>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Colonia">
                          <input
                            type="text"
                            placeholder="Ej. Polanco IV Sección"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Municipio">
                          <input
                            type="text"
                            placeholder="Ej. Miguel Hidalgo"
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
                        <Field label="Estado">
                          <select className={selectClass} defaultValue="">
                            <option value="" disabled>
                              Seleccionar estado
                            </option>
                            {statesMx.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Código postal">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="11560"
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Latitud">
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="19.432608"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Longitud">
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="-99.133209"
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="Google Maps URL">
                        <input
                          type="url"
                          placeholder="https://maps.google.com/?q=..."
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="04"
                    title="Características"
                    subtitle="Distribución, superficies y banderas operativas del inmueble."
                    accentClass="bg-amber-100 text-amber-700"
                  >
                    <div className="grid gap-5">
                      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <Field label="Habitaciones">
                          <input
                            type="number"
                            min="0"
                            placeholder="3"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Baños">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="2.5"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Estacionamientos">
                          <input
                            type="number"
                            min="0"
                            placeholder="2"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Metros cuadrados">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="185"
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="Superficie construida">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="165"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Superficie terreno">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="220"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Año de construcción">
                          <input
                            type="number"
                            min="1900"
                            max="2100"
                            placeholder="2021"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Nivel">
                          <input
                            type="number"
                            min="0"
                            placeholder="12"
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <ToggleCard
                          label="Elevador"
                          description="El inmueble o desarrollo cuenta con elevador."
                          checked={hasElevator}
                          onChange={setHasElevator}
                        />
                        <ToggleCard
                          label="Amueblado"
                          description="Se entrega o renta con mobiliario incluido."
                          checked={isFurnished}
                          onChange={setIsFurnished}
                        />
                        <ToggleCard
                          label="Mascotas permitidas"
                          description="Acepta mascotas bajo lineamientos del propietario."
                          checked={petsAllowed}
                          onChange={setPetsAllowed}
                        />
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Snapshot
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            Ideal para capturar atributos que después alimenten
                            filtros, cards y SEO.
                          </p>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="05"
                    title="Multimedia"
                    subtitle="Recursos visuales listos para portal, marketing y revisión interna."
                    accentClass="bg-rose-100 text-rose-700"
                  >
                    <div className="grid gap-5">
                      <UploadDropzone
                        title="Fotografía principal"
                        description="Sube la imagen hero de la propiedad. Se muestra como ejemplo visual, sin persistencia."
                        fileNames={mainPhotoNames}
                        onChange={(event) => setFileNames(event, setMainPhotoNames)}
                      />

                      <UploadDropzone
                        title="Galería"
                        description="Puedes seleccionar varias imágenes para simular el flujo de carga del inventario."
                        multiple
                        fileNames={galleryNames}
                        onChange={(event) => setFileNames(event, setGalleryNames)}
                      />

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Video URL">
                          <input
                            type="url"
                            placeholder="https://youtube.com/..."
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Tour virtual URL">
                          <input
                            type="url"
                            placeholder="https://matterport.com/..."
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="06"
                    title="Amenidades"
                    subtitle="Selecciona con chips las amenidades que harán más valioso el listing."
                    accentClass="bg-teal-100 text-teal-700"
                  >
                    <div className="flex flex-wrap gap-3">
                      {amenitiesCatalog.map((item) => (
                        <ChipButton
                          key={item}
                          label={item}
                          active={selectedAmenities.includes(item)}
                          onClick={() => toggleAmenity(item)}
                        />
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="07"
                    title="Requisitos y Restricciones"
                    subtitle='Representación visual del JSONB `{"requisitos":[],"restricciones":[]}`.'
                    accentClass="bg-orange-100 text-orange-700"
                  >
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            Requisitos
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Agrega condiciones para el expediente o aprobación.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {requirementExamples.map((item) => (
                            <ChipButton
                              key={item}
                              label={item}
                              active={requirements.includes(item)}
                              onClick={() =>
                                addUniqueItem(
                                  item,
                                  setRequirements,
                                  () => undefined,
                                )
                              }
                            />
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={requirementDraft}
                            onChange={(event) =>
                              setRequirementDraft(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addUniqueItem(
                                  requirementDraft,
                                  setRequirements,
                                  () => setRequirementDraft(""),
                                );
                              }
                            }}
                            placeholder="Agregar requisito"
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              addUniqueItem(
                                requirementDraft,
                                setRequirements,
                                () => setRequirementDraft(""),
                              )
                            }
                            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(14,165,233,0.24)] transition hover:bg-sky-600"
                          >
                            <PlusIcon />
                            Agregar requisito
                          </button>
                        </div>

                        <ListCollection
                          items={requirements}
                          emptyLabel="Sin requisitos agregados."
                          toneClass="bg-sky-400"
                          onRemove={(index) => removeAt(setRequirements, index)}
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            Restricciones
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Define límites claros para la operación o el perfil
                            del prospecto.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {restrictionExamples.map((item) => (
                            <ChipButton
                              key={item}
                              label={item}
                              active={restrictions.includes(item)}
                              onClick={() =>
                                addUniqueItem(
                                  item,
                                  setRestrictions,
                                  () => undefined,
                                )
                              }
                            />
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={restrictionDraft}
                            onChange={(event) =>
                              setRestrictionDraft(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addUniqueItem(
                                  restrictionDraft,
                                  setRestrictions,
                                  () => setRestrictionDraft(""),
                                );
                              }
                            }}
                            placeholder="Agregar restricción"
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              addUniqueItem(
                                restrictionDraft,
                                setRestrictions,
                                () => setRestrictionDraft(""),
                              )
                            }
                            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(249,115,22,0.24)] transition hover:bg-orange-600"
                          >
                            <PlusIcon />
                            Agregar restricción
                          </button>
                        </div>

                        <ListCollection
                          items={restrictions}
                          emptyLabel="Sin restricciones agregadas."
                          toneClass="bg-orange-400"
                          onRemove={(index) => removeAt(setRestrictions, index)}
                        />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="08"
                    title="SEO y publicación"
                    subtitle="Configuración editorial y de visibilidad para salida pública."
                    accentClass="bg-indigo-100 text-indigo-700"
                  >
                    <div className="grid gap-5">
                      <Field label="SEO title">
                        <input
                          type="text"
                          placeholder="Título optimizado para buscadores"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="SEO description" hint="Máximo sugerido 160 caracteres">
                        <textarea
                          placeholder="Resumen breve y persuasivo para snippets y tarjetas sociales."
                          className={`${textareaClass} min-h-[110px]`}
                        />
                      </Field>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ToggleCard
                          label="Destacado"
                          description="Resalta la propiedad en colecciones premium o carruseles."
                          checked={featured}
                          onChange={setFeatured}
                        />
                        <ToggleCard
                          label="Visible"
                          description="Indica si la propiedad está lista para mostrarse en el portal."
                          checked={visible}
                          onChange={setVisible}
                        />
                      </div>

                      <Field label="Tags">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={tagDraft}
                            onChange={(event) => setTagDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addUniqueItem(tagDraft, setTags, () => setTagDraft(""));
                              }
                            }}
                            placeholder="Agregar tag"
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              addUniqueItem(tagDraft, setTags, () => setTagDraft(""))
                            }
                            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-500 px-4 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(99,102,241,0.24)] transition hover:bg-indigo-600"
                          >
                            <PlusIcon />
                            Agregar
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {tags.map((item, index) => (
                            <span
                              key={`${item}-${index}`}
                              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => removeAt(setTags, index)}
                                className="text-indigo-400 transition hover:text-indigo-700"
                                aria-label={`Eliminar tag ${item}`}
                              >
                                <XIcon />
                              </button>
                            </span>
                          ))}
                        </div>
                      </Field>

                      <Field label="Published at">
                        <input type="datetime-local" className={inputClass} />
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard
                    index="09"
                    title="Control interno"
                    subtitle="Datos de operación internos para organización del equipo comercial."
                    accentClass="bg-slate-100 text-slate-700"
                  >
                    <div className="grid gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Asesor responsable">
                          <select className={selectClass} defaultValue="">
                            <option value="" disabled>
                              Seleccionar asesor
                            </option>
                            {advisors.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Estado del inmueble">
                          <select className={selectClass} defaultValue="">
                            <option value="" disabled>
                              Seleccionar estado
                            </option>
                            {internalStatuses.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <Field label="Comentarios internos">
                        <textarea
                          placeholder="Notas privadas para seguimiento, negociación, documentación o estrategia de publicación."
                          className={textareaClass}
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Link
                      href="/inmuebles"
                      className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                    >
                      Cancelar
                    </Link>
                    <button
                      type="submit"
                      className="rounded-2xl bg-slate-950 px-8 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Guardar inmueble
                    </button>
                  </div>
                </div>

                <aside className="hidden 2xl:block">
                  <div className="sticky top-6 space-y-6">
                    <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        Vista rápida
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                        Resumen del inmueble
                      </h2>

                      <div className="mt-6 space-y-4">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            Título
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {title || "Aún sin título"}
                          </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            Slug
                          </p>
                          <p className="mt-2 break-all font-mono text-xs text-slate-600">
                            /inmuebles/{slug || "pendiente"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              Amenidades
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                              {selectedAmenities.length}
                            </p>
                          </div>
                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              Multimedia
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                              {mainPhotoNames.length + galleryNames.length}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            JSONB preview
                          </p>
                          <pre className="mt-3 overflow-x-auto rounded-[1.25rem] bg-slate-950 p-4 text-xs leading-6 text-slate-200">
{`{
  "requisitos": ${JSON.stringify(requirements)},
  "restricciones": ${JSON.stringify(restrictions)}
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          </div>
        </div>
      </AnimatedDashboardBackground>

      <DashboardMobileDock />
    </main>
  );
}
