"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

import { LocationSection, type LocationValue } from "@/features/properties/components/location-section";
import { createProperty } from "@/features/properties/actions/create-property";
import { addPropertyImage } from "@/features/properties/actions/manage-images";
import { applyWatermark } from "@/lib/watermark";

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
};

export interface StatusOption {
  id: number;
  nombre: string;
  color: string | null;
}

export interface AdvisorOption {
  id: string;
  nombre: string;
}

export interface NewPropertyFormProps {
  statuses: StatusOption[];
  advisors: AdvisorOption[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const propertyTypes = [
  "Casa", "Departamento", "Penthouse", "Terreno", "Local comercial",
  "Oficina", "Bodega", "Consultorio", "Villa",
];

const amenitiesCatalog = [
  "Alberca", "Gimnasio", "Roof Garden", "Seguridad 24/7", "Elevador",
  "Salón de usos múltiples", "Área infantil", "Cancha", "Bodega", "Balcón", "Terraza",
];

const requirementExamples = ["Fiador con inmueble", "Identificación oficial"];
const restrictionExamples = ["No mascotas", "No estudiantes", "No Airbnb", "No fumar"];

const steps = [
  { label: "Operación",        description: "¿Cuál es el tipo de operación del inmueble?" },
  { label: "General",          description: "Nombre comercial, tipo de inmueble y precio." },
  { label: "Ubicación",        description: "Dirección, colonia y posición exacta en el mapa." },
  { label: "Características",  description: "Distribución, superficies y condiciones del inmueble." },
  { label: "Multimedia",       description: "Fotografías, galería y recursos de recorrido virtual." },
  { label: "Amenidades",       description: "Servicios y amenidades disponibles en el desarrollo." },
  { label: "Requisitos",       description: "Condiciones del expediente y restricciones al prospecto." },
  { label: "Publicación",      description: "Metadatos SEO, visibilidad y fecha de publicación." },
  { label: "Control",          description: "Asignación, estatus operativo y notas del equipo." },
];

const operationOptions = [
  {
    value: "Venta",
    label: "Venta",
    description: "Transferencia definitiva de la propiedad al comprador.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 21v-8h6v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "Renta",
    label: "Renta",
    description: "Arrendamiento mensual con contrato e inquilino.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle cx="8.5" cy="13" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13 13h7.5M17.5 13v2.5M20 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "Preventa",
    label: "Preventa",
    description: "Propiedad en desarrollo o en planos.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7.5v4.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "Traspaso",
    label: "Traspaso",
    description: "Cesión de derechos o contrato de arrendamiento.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path d="M7 17V5m0 0L4 8m3-3l3 3M17 7v12m0 0l3-3m-3 3l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ── Base styles ───────────────────────────────────────────────────────────────

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
const textareaBase = `${inputBase} min-h-[96px] resize-none`;
const selectBase = `${inputBase} cursor-pointer appearance-none`;

// ── Utilities ─────────────────────────────────────────────────────────────────

const polizaTable: Array<{ max: number; price: number }> = [
  { max: 10000, price: 3700 }, { max: 15000, price: 4300 }, { max: 20000, price: 4500 },
  { max: 25000, price: 5200 }, { max: 30000, price: 5500 }, { max: 35000, price: 8100 },
  { max: 40000, price: 9300 }, { max: 45000, price: 10000 }, { max: 50000, price: 12000 },
];

function calcPolizaPrice(rent: number): number {
  const row = polizaTable.find((r) => rent <= r.max);
  return row ? row.price : rent * 0.25;
}

function formatCurrency(amount: number, curr: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: curr, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function parseNumericValue(value: string) {
  const n = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseCoordinate(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrencyInput(value: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", maximumFractionDigits: 0,
  }).format(parseNumericValue(value));
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function Pad({ children }: { children: ReactNode }) {
  return (
    <div className="px-6 py-6 sm:px-10 lg:px-16">
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ children, cols }: { children: ReactNode; cols?: string }) {
  return <div className={`grid gap-4 ${cols ?? "md:grid-cols-2"}`}>{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
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

function Sep() { return <hr className="border-slate-100" />; }

function NotebookMoneyField({ label, value, onChange, disabled }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <div className="rounded-[1.35rem] border border-border-soft bg-brand-surface/60 px-4 py-3 shadow-[0_12px_30px_rgba(20,16,35,0.04)]">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/35">
              Escribe el monto
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={formatCurrencyInput(value)}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              style={{ fontFamily: "var(--font-shadows-into-light), cursive" }}
              className={`w-full border-0 bg-transparent p-0 text-3xl leading-none tracking-[0.02em] text-foreground outline-none placeholder:text-foreground/15 ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
            />
          </div>
          <div className="shrink-0 rounded-full border border-border-soft bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground/70 shadow-sm">
            MXN
          </div>
        </div>
      </div>
    </Field>
  );
}

// ── Photo sub-components ──────────────────────────────────────────────────────

function SortablePhotoTile({ photo, index, onRemove, className, imageClassName, titleClassName }: {
  photo: UploadedPhoto; index: number; onRemove: (id: string) => void;
  className?: string; imageClassName?: string; titleClassName?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative overflow-hidden rounded-[1.35rem] border border-border-soft bg-white shadow-[0_12px_30px_rgba(20,16,35,0.06)] transition ${
        isDragging ? "z-20 scale-[1.02] shadow-[0_20px_50px_rgba(20,16,35,0.12)]" : ""
      } ${className ?? ""}`}
    >
      <div className={`relative overflow-hidden bg-brand-surface ${imageClassName ?? "aspect-[4/3]"}`}>
        <Image src={photo.previewUrl} alt={photo.name} fill sizes="(max-width: 1280px) 50vw, 33vw" unoptimized className="object-cover" />
        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/70 shadow-sm">
          {index === 0 ? "Portada" : `#${index + 1}`}
        </div>
        <button type="button" onClick={() => onRemove(photo.id)} aria-label={`Eliminar ${photo.name}`}
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-foreground/60 shadow-sm transition hover:text-rose-500">
          <Trash2 className="size-4" />
        </button>
        <button type="button" aria-label={`Mover ${photo.name}`} {...attributes} {...listeners}
          className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-foreground/60 shadow-sm transition hover:text-foreground">
          <GripVertical className="size-4" />
        </button>
      </div>
      <div className="space-y-1.5 px-3 py-3">
        <p className={`truncate text-sm font-medium text-foreground ${titleClassName ?? ""}`}>{photo.name}</p>
        <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/35">Arrastra para reordenar</p>
      </div>
    </article>
  );
}

function PhotoGalleryField({ photos, onChange }: {
  photos: UploadedPhoto[]; onChange: Dispatch<SetStateAction<UploadedPhoto[]>>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const latestPhotosRef = useRef(photos);
  useEffect(() => { latestPhotosRef.current = photos; }, [photos]);
  useEffect(() => () => { latestPhotosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)); }, []);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    const next = await Promise.all(
      acceptedFiles.map(async (file) => {
        const watermarked = await applyWatermark(file);
        return { id: crypto.randomUUID(), file: watermarked, name: file.name, previewUrl: URL.createObjectURL(watermarked) };
      }),
    );
    onChange((cur) => [...cur, ...next]);
  }, [onChange]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ accept: { "image/*": [] }, multiple: true, onDrop: handleDrop });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange((cur) => arrayMove(cur, oldIndex, newIndex));
  }, [onChange, photos]);

  const removePhoto = useCallback((id: string) => {
    onChange((cur) => cur.filter((p) => { if (p.id === id) { URL.revokeObjectURL(p.previewUrl); return false; } return true; }));
  }, [onChange]);

  const clearPhotos = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    onChange([]);
  }, [onChange, photos]);

  const coverPhoto = photos[0] ?? null;
  const secondaryPhotos = photos.slice(1);

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`cursor-pointer rounded-[1.75rem] border-2 border-dashed bg-brand-surface/60 p-5 transition sm:p-6 ${isDragActive ? "border-brand-secondary bg-brand-secondary/8" : "border-border-soft hover:border-brand-secondary/40 hover:bg-brand-surface"}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border-soft bg-white shadow-sm">
              <Upload className="size-5 text-foreground/50" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Sube todas las imágenes de un jalón</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/55">
                Arrastra las fotos aquí o haz clic para seleccionarlas. Después podrás moverlas para acomodar el orden.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-border-soft bg-white px-4 py-2 text-sm font-medium text-foreground/65 shadow-sm">
              {photos.length} {photos.length === 1 ? "imagen" : "imágenes"}
            </div>
            <button type="button" onClick={open} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              <ImagePlus className="size-4" />Seleccionar imágenes
            </button>
            {photos.length > 0 && (
              <button type="button" onClick={clearPhotos} className="inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-white px-4 text-sm font-medium text-foreground/70 transition hover:border-rose-400 hover:text-rose-500">
                <Trash2 className="size-4" />Limpiar todo
              </button>
            )}
          </div>
        </div>
      </div>

      {photos.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              {coverPhoto && (
                <SortablePhotoTile photo={coverPhoto} index={0} onRemove={removePhoto} className="xl:row-span-2" imageClassName="aspect-[16/11] xl:aspect-[4/3]" titleClassName="text-base" />
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {secondaryPhotos.map((p, i) => (
                  <SortablePhotoTile key={p.id} photo={p} index={i + 1} onRemove={removePhoto} />
                ))}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="rounded-[1.35rem] border border-dashed border-border-soft bg-white px-4 py-3 text-sm text-foreground/45">PNG · JPG · WEBP</p>
      )}
    </div>
  );
}

// ── Shared widgets ────────────────────────────────────────────────────────────

function Stepper({ label, value, onChange, min = 0, max = 50, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <div className="mb-1.5"><span className="text-sm font-medium text-foreground/65">{label}</span></div>
      <div className="flex h-12 items-center rounded-[1.15rem] border border-border-soft bg-brand-surface/70 shadow-[0_10px_24px_rgba(20,16,35,0.05)]">
        <button type="button" onClick={() => onChange(Math.max(min, +((value - step).toFixed(1))))} disabled={value <= min}
          className="flex h-full w-11 items-center justify-center text-xl font-light text-foreground/30 transition hover:text-foreground/70 disabled:opacity-25">−</button>
        <span className="flex-1 text-center text-lg font-semibold tabular-nums text-foreground">
          {value % 1 === 0 ? value : value.toFixed(1)}
        </span>
        <button type="button" onClick={() => onChange(Math.min(max, +((value + step).toFixed(1))))} disabled={value >= max}
          className="flex h-full w-11 items-center justify-center text-xl font-light text-foreground/30 transition hover:text-foreground/70 disabled:opacity-25">+</button>
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition ${checked ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"}`}>
      <div>
        <p className={`text-sm font-medium ${checked ? "text-white" : "text-slate-900"}`}>{label}</p>
        <p className={`mt-0.5 text-xs leading-5 ${checked ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
      </div>
      <div className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-white/20" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </div>
    </button>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-slate-800 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>
      {active && (
        <svg viewBox="0 0 12 10" fill="none" className="h-3 w-3 shrink-0">
          <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

function TagBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Eliminar ${label}`} className="text-slate-400 transition hover:text-slate-700">
        <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

function ItemList({ items, emptyLabel, onRemove }: { items: string[]; emptyLabel: string; onRemove: (i: number) => void }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={`${item}-${i}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            <span className="text-sm text-slate-700">{item}</span>
          </div>
          <button type="button" onClick={() => onRemove(i)} aria-label="Eliminar" className="text-slate-300 transition hover:text-red-500">
            <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function AddRow({ value, onChange, onKeyDown, onAdd, placeholder }: {
  value: string; onChange: (v: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onAdd: () => void; placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} className={`${inputBase} flex-1`} />
      <button type="button" onClick={onAdd} aria-label="Agregar"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-900 hover:bg-slate-900 hover:text-white">
        <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NewPropertyForm({ statuses, advisors }: NewPropertyFormProps) {
  const router = useRouter();

  // Wizard
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Step 0 – Operación
  const [operation, setOperation] = useState("");

  // Step 1 – General
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState(propertyTypes[0]);
  const [price, setPrice] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [maintenanceIncluded, setMaintenanceIncluded] = useState(false);

  // Step 2 – Ubicación
  const [locationValue, setLocationValue] = useState<LocationValue>({
    address: "", colonia: "", municipio: "", estado: "", cp: "", lat: "", lng: "",
  });

  // Step 3 – Características
  const [rooms, setRooms] = useState(0);
  const [baths, setBaths] = useState(0);
  const [parkings, setParkings] = useState(0);
  const [metrosCuadrados, setMetrosCuadrados] = useState("");
  const [superficieConstruida, setSuperficieConstruida] = useState("");
  const [superficieTerreno, setSuperficieTerreno] = useState("");
  const [anioConstruccion, setAnioConstruccion] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const [isFurnished, setIsFurnished] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);

  // Step 4 – Multimedia
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [tourVirtualUrl, setTourVirtualUrl] = useState("");

  // Step 5 – Amenidades
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Step 6 – Requisitos
  const [requirements, setRequirements] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [reqDraft, setReqDraft] = useState("");
  const [restrDraft, setRestrDraft] = useState("");

  // Step 7 – Publicación
  const [seoDesc, setSeoDesc] = useState("");
  const [featured, setFeatured] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  // Step 8 – Control
  const [selectedStatusId, setSelectedStatusId] = useState<number>(statuses[0]?.id ?? 1);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<string | null>(null);

  // Derived — póliza / ingresos para renta
  const requiredIncome = useMemo(() => {
    const p = parseNumericValue(price);
    return operation === "Renta" && p > 0 ? p * 3 : null;
  }, [operation, price]);

  const incomeChipLabel = requiredIncome !== null
    ? `Comprobar ingresos ${formatCurrency(requiredIncome, "MXN")}`
    : "Comprobar ingresos 3× renta";

  const polizaPrice = useMemo(() => {
    const p = parseNumericValue(price);
    return operation === "Renta" && p > 0 ? calcPolizaPrice(p) : null;
  }, [operation, price]);

  const polizaChipLabel = polizaPrice !== null
    ? `Póliza jurídica ${formatCurrency(polizaPrice, "MXN")}`
    : "Póliza jurídica";

  const normalizedRequirements = useMemo(
    () => requirements.map((r) =>
      r.startsWith("Póliza jurídica") && polizaChipLabel !== "Póliza jurídica" ? polizaChipLabel : r,
    ),
    [requirements, polizaChipLabel],
  );

  // Helpers
  const toggleAmenity = (a: string) =>
    setSelectedAmenities((cur) => cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]);

  const addUnique = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    clear: () => void,
  ) => {
    const v = value.trim();
    if (!v) return;
    setter((cur) => cur.includes(v) ? cur : [...cur, v]);
    clear();
  };

  const removeAt = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) =>
    setter((cur) => cur.filter((_, i) => i !== index));

  const onEnter = (
    draft: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    clear: () => void,
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addUnique(draft, setter, clear); }
  };

  const goTo = (to: number) => {
    if (to === step || transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setStep(to); setTransitioning(false); }, 150);
  };

  const next = () => goTo(Math.min(step + 1, steps.length - 1));
  const prev = () => goTo(Math.max(step - 1, 0));

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      setSubmitError("El título del inmueble es requerido.");
      goTo(1);
      return;
    }
    if (!operation) {
      setSubmitError("Selecciona el tipo de operación.");
      goTo(0);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitPhase("Creando inmueble…");

    try {
      const createResult = await createProperty({
        titulo: titulo.trim(),
        descripcion: null,
        precio: parseNumericValue(price),
        tipo,
        operacion: operation,
        estatus_id: selectedStatusId,
        habitaciones: rooms,
        banos: baths,
        estacionamientos: parkings,
        metros_cuadrados: metrosCuadrados ? parseFloat(metrosCuadrados) : null,
        superficie_construida: superficieConstruida ? parseFloat(superficieConstruida) : null,
        superficie_terreno: superficieTerreno ? parseFloat(superficieTerreno) : null,
        anio_construccion: anioConstruccion ? parseInt(anioConstruccion, 10) : null,
        direccion: locationValue.address,
        colonia: locationValue.colonia || null,
        municipio: locationValue.municipio || null,
        estado: locationValue.estado || null,
        codigo_postal: locationValue.cp || null,
        latitud: parseCoordinate(locationValue.lat),
        longitud: parseCoordinate(locationValue.lng),
        video_url: videoUrl || null,
        tour_virtual_url: tourVirtualUrl || null,
        amenidades: selectedAmenities,
        requisitos: requirements,
        restricciones: restrictions,
        tags,
        destacado: featured,
        visible,
        seo_description: seoDesc || null,
        asesor_id: selectedAdvisorId ? parseFloat(selectedAdvisorId) : null,
      });

      if (!createResult.success || !createResult.slug || !createResult.id) {
        setSubmitError(createResult.error ?? "Error al crear el inmueble.");
        setIsSubmitting(false);
        setSubmitPhase(null);
        return;
      }

      const { slug, id: propertyId } = createResult;

      for (let i = 0; i < photos.length; i++) {
        setSubmitPhase(`Subiendo imagen ${i + 1} de ${photos.length}…`);
        const photo = photos[i];
        const uid = crypto.randomUUID();
        const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const s3Key = `inmuebles/${propertyId}/${uid}.${ext}`;

        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: s3Key, contentType: photo.file.type }),
        });
        if (!presignRes.ok) throw new Error(`Error al preparar la subida de imagen ${i + 1}`);
        const { url: uploadUrl } = (await presignRes.json()) as { url: string };

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: photo.file,
          headers: { "Content-Type": photo.file.type },
        });
        if (!uploadRes.ok) throw new Error(`Error al subir imagen ${i + 1}`);

        await addPropertyImage(propertyId, s3Key, i, slug);
      }

      router.push(`/inmuebles/${slug}`);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Error inesperado al guardar.");
      setIsSubmitting(false);
      setSubmitPhase(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="new-property-form space-y-6">

        {/* Progress — desktop */}
        <div className="relative hidden py-4 sm:block">
          <div className="step-progress-track h-3.5 w-full shadow-[0_10px_30px_rgba(124,58,237,0.12)]" aria-hidden="true">
            <div className="step-progress-track-fill h-full transition-all duration-300 ease-out" style={{ width: `${((step + 1) / steps.length) * 100}%` }}>
              <span className="step-progress-track-cap" />
            </div>
          </div>
        </div>

        {/* Progress — mobile */}
        <div className="sm:hidden">
          <div className="mb-2 flex items-center justify-between text-xs text-foreground/55">
            <span className="font-medium text-foreground/80">{steps[step].label}</span>
            <span>{step + 1} / {steps.length}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
            <div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className={`transition-opacity duration-[150ms] ${transitioning ? "opacity-0" : "opacity-100"}`}>

          {/* Title */}
          <div className="mx-auto mb-5 w-full max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Nuevo inmueble</h2>
            <p className="mt-2 text-sm text-foreground/55">Completa la información para registrar el inmueble en el inventario.</p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border-soft bg-white shadow-[0_24px_70px_rgba(20,16,35,0.08)]">

            {/* 0 · Operación */}
            {step === 0 && (
              <div className="px-5 py-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="mx-auto mb-8 max-w-2xl text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-foreground/45">Operación</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">¿Cuál es el tipo de operación del inmueble?</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {operationOptions.map((op) => (
                    <button key={op.value} type="button"
                      onClick={() => { setOperation(op.value); goTo(1); }}
                      className={`group flex flex-col items-start gap-5 rounded-2xl border p-6 text-left transition-all duration-150 sm:p-8 ${
                        operation === op.value
                          ? "border-foreground bg-foreground text-white shadow-lg shadow-slate-200"
                          : "border-border-soft bg-white hover:border-brand-secondary"
                      }`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                        operation === op.value
                          ? "bg-white/10 text-white"
                          : "bg-surface-1 text-foreground/70 group-hover:bg-brand-secondary group-hover:text-white"
                      }`}>{op.icon}</div>
                      <div>
                        <p className={`text-base font-semibold ${operation === op.value ? "text-white" : "text-foreground"}`}>{op.label}</p>
                        <p className={`mt-1 text-sm leading-snug ${operation === op.value ? "text-white/70" : "text-foreground/60"}`}>{op.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1 · General */}
            {step === 1 && (
              <div className="px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="mx-auto mb-6 max-w-2xl text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-foreground/45">General</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Define la ficha básica del inmueble</h3>
                </div>
                <div className="mx-auto grid max-w-5xl gap-4">
                  <Field label="Título del inmueble">
                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título comercial del inmueble" className={`${inputBase} h-11`} />
                  </Field>
                  <Field label="Tipo de inmueble">
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${selectBase} h-11`}>
                      {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <NotebookMoneyField label="Precio" value={price} onChange={setPrice} />
                    <Field label="Mantenimiento">
                      <div className="rounded-[1.35rem] border border-border-soft bg-brand-surface/60 px-4 py-3 shadow-[0_12px_30px_rgba(20,16,35,0.04)]">
                        <div className="flex items-end gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/35">Escribe el monto</span>
                            <input type="text" inputMode="decimal"
                              placeholder={maintenanceIncluded ? "$0" : "Sin mantenimiento"}
                              value={maintenanceIncluded ? formatCurrencyInput(maintenance) : ""}
                              onChange={(e) => setMaintenance(e.target.value)}
                              disabled={!maintenanceIncluded}
                              style={{ fontFamily: "var(--font-shadows-into-light), cursive" }}
                              className={`w-full border-0 bg-transparent p-0 text-3xl leading-none tracking-[0.02em] text-foreground outline-none placeholder:text-foreground/15 ${maintenanceIncluded ? "" : "cursor-not-allowed opacity-35"}`}
                            />
                          </div>
                          <button type="button" role="switch" aria-checked={maintenanceIncluded}
                            onClick={() => setMaintenanceIncluded(!maintenanceIncluded)}
                            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${maintenanceIncluded ? "bg-foreground" : "bg-slate-200 hover:bg-slate-300"}`}>
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${maintenanceIncluded ? "left-[17px]" : "left-0.5"}`} />
                          </button>
                        </div>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* 2 · Ubicación */}
            {step === 2 && <LocationSection value={locationValue} onChange={setLocationValue} />}

            {/* 3 · Características */}
            {step === 3 && (
              <Pad>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Stepper label="Habitaciones" value={rooms} onChange={setRooms} max={20} />
                  <Stepper label="Baños" value={baths} onChange={setBaths} max={20} step={0.5} />
                  <Stepper label="Estacionamientos" value={parkings} onChange={setParkings} max={20} />
                </div>
                <Sep />
                <Row cols="sm:grid-cols-2 xl:grid-cols-4">
                  <Field label="m² totales">
                    <input type="number" min="0" step="0.01" placeholder="185" value={metrosCuadrados} onChange={(e) => setMetrosCuadrados(e.target.value)} className={inputBase} />
                  </Field>
                  <Field label="Sup. construida (m²)">
                    <input type="number" min="0" step="0.01" placeholder="165" value={superficieConstruida} onChange={(e) => setSuperficieConstruida(e.target.value)} className={inputBase} />
                  </Field>
                  <Field label="Sup. terreno (m²)">
                    <input type="number" min="0" step="0.01" placeholder="220" value={superficieTerreno} onChange={(e) => setSuperficieTerreno(e.target.value)} className={inputBase} />
                  </Field>
                  <Field label="Año de construcción">
                    <input type="number" min="1900" max="2100" placeholder="2021" value={anioConstruccion} onChange={(e) => setAnioConstruccion(e.target.value)} className={inputBase} />
                  </Field>
                </Row>
                <Sep />
                <Row cols="md:grid-cols-3">
                  <Toggle label="Elevador" description="El desarrollo cuenta con elevador." checked={hasElevator} onChange={setHasElevator} />
                  <Toggle label="Amueblado" description="Se entrega con mobiliario incluido." checked={isFurnished} onChange={setIsFurnished} />
                  <Toggle label="Mascotas" description="Acepta mascotas bajo lineamientos del propietario." checked={petsAllowed} onChange={setPetsAllowed} />
                </Row>
              </Pad>
            )}

            {/* 4 · Multimedia */}
            {step === 4 && (
              <Pad>
                <PhotoGalleryField photos={photos} onChange={setPhotos} />
                <Sep />
                <Row>
                  <Field label="Video URL">
                    <input type="url" placeholder="https://youtube.com/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputBase} />
                  </Field>
                  <Field label="Tour virtual URL">
                    <input type="url" placeholder="https://matterport.com/..." value={tourVirtualUrl} onChange={(e) => setTourVirtualUrl(e.target.value)} className={inputBase} />
                  </Field>
                </Row>
              </Pad>
            )}

            {/* 5 · Amenidades */}
            {step === 5 && (
              <div className="px-6 py-6 sm:px-10 lg:px-16">
                <div className="flex flex-wrap gap-2">
                  {amenitiesCatalog.map((a) => (
                    <Chip key={a} label={a} active={selectedAmenities.includes(a)} onClick={() => toggleAmenity(a)} />
                  ))}
                </div>
                {selectedAmenities.length > 0 && (
                  <p className="mt-3 text-xs text-slate-400">
                    {selectedAmenities.length} amenidad{selectedAmenities.length !== 1 ? "es" : ""} seleccionada{selectedAmenities.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            {/* 6 · Requisitos */}
            {step === 6 && (
              <div className="divide-y divide-slate-100">
                <div className="space-y-4 px-6 py-6 sm:px-10 lg:px-16">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Requisitos</p>
                    <p className="mt-0.5 text-xs text-slate-500">Condiciones para aprobación del expediente.</p>
                  </div>
                  {requiredIncome !== null && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                      <div className="mb-2.5 flex items-center gap-2">
                        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-slate-500">
                          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
                          <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-xs font-semibold text-slate-700">Cálculos automáticos para renta</p>
                      </div>
                      <div className="space-y-2 pl-5">
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-xs text-slate-500">Ingresos mínimos (3×)</p>
                          <p className="text-xs font-semibold text-slate-900">{formatCurrency(requiredIncome, "MXN")}</p>
                        </div>
                        {polizaPrice !== null && (
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="text-xs text-slate-500">
                              Póliza jurídica sin IVA
                              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-medium text-emerald-700">auto</span>
                            </p>
                            <p className="text-xs font-semibold text-slate-900">{formatCurrency(polizaPrice, "MXN")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Chip label={incomeChipLabel} active={normalizedRequirements.some((r) => r.startsWith("Comprobar ingresos"))}
                      onClick={() => setRequirements((cur) => [...cur.filter((r) => !r.startsWith("Comprobar ingresos")), incomeChipLabel])} />
                    <Chip label={polizaChipLabel} active={normalizedRequirements.some((r) => r.startsWith("Póliza jurídica"))}
                      onClick={() => setRequirements((cur) => [...cur.filter((r) => !r.startsWith("Póliza jurídica")), polizaChipLabel])} />
                    {requirementExamples.map((ex) => (
                      <Chip key={ex} label={ex} active={normalizedRequirements.includes(ex)} onClick={() => addUnique(ex, setRequirements, () => {})} />
                    ))}
                  </div>
                  <AddRow value={reqDraft} onChange={setReqDraft} onKeyDown={onEnter(reqDraft, setRequirements, () => setReqDraft(""))} onAdd={() => addUnique(reqDraft, setRequirements, () => setReqDraft(""))} placeholder="Agregar requisito personalizado" />
                  <ItemList items={normalizedRequirements} emptyLabel="Sin requisitos agregados." onRemove={(i) => removeAt(setRequirements, i)} />
                </div>
                <div className="space-y-4 px-6 py-6 sm:px-10 lg:px-16">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Restricciones</p>
                    <p className="mt-0.5 text-xs text-slate-500">Límites para el uso o el perfil del prospecto.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {restrictionExamples.map((ex) => (
                      <Chip key={ex} label={ex} active={restrictions.includes(ex)} onClick={() => addUnique(ex, setRestrictions, () => {})} />
                    ))}
                  </div>
                  <AddRow value={restrDraft} onChange={setRestrDraft} onKeyDown={onEnter(restrDraft, setRestrictions, () => setRestrDraft(""))} onAdd={() => addUnique(restrDraft, setRestrictions, () => setRestrDraft(""))} placeholder="Agregar restricción personalizada" />
                  <ItemList items={restrictions} emptyLabel="Sin restricciones agregadas." onRemove={(i) => removeAt(setRestrictions, i)} />
                </div>
              </div>
            )}

            {/* 7 · Publicación */}
            {step === 7 && (
              <Pad>
                <Field label="SEO description" hint={`${seoDesc.length}/160`}>
                  <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={200}
                    placeholder="Resumen breve y persuasivo para snippets y redes sociales."
                    className={`${textareaBase} min-h-[84px]`} />
                </Field>
                <Sep />
                <Row>
                  <Toggle label="Destacado" description="Aparece en colecciones premium y carruseles." checked={featured} onChange={setFeatured} />
                  <Toggle label="Visible en portal" description="El inmueble es público para los visitantes." checked={visible} onChange={setVisible} />
                </Row>
                <Sep />
                <Field label="Tags">
                  <AddRow value={tagDraft} onChange={setTagDraft} onKeyDown={onEnter(tagDraft, setTags, () => setTagDraft(""))} onAdd={() => addUnique(tagDraft, setTags, () => setTagDraft(""))} placeholder="Agregar tag y presiona Enter" />
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag, i) => <TagBadge key={`${tag}-${i}`} label={tag} onRemove={() => removeAt(setTags, i)} />)}
                    </div>
                  )}
                </Field>
              </Pad>
            )}

            {/* 8 · Control */}
            {step === 8 && (
              <Pad>
                <Row>
                  <Field label="Asesor responsable">
                    <select value={selectedAdvisorId} onChange={(e) => setSelectedAdvisorId(e.target.value)} className={selectBase}>
                      <option value="">Sin asignar</option>
                      {advisors.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </Field>
                  <Field label="Estatus">
                    <select value={selectedStatusId} onChange={(e) => setSelectedStatusId(Number(e.target.value))} className={selectBase}>
                      {statuses.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </Field>
                </Row>
              </Pad>
            )}

          </div>
        </div>

        {/* Navigation */}
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 pt-2">
          {submitError && (
            <p className="w-full rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{submitError}</p>
          )}
          <div className="flex w-full items-center justify-between">
            <button type="button" onClick={prev} disabled={step === 0 || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-brand-secondary hover:text-brand-secondary disabled:pointer-events-none disabled:opacity-40">
              <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Anterior
            </button>

            {step < steps.length - 1 ? (
              <button type="button" onClick={next} disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-foreground shadow-[0_16px_35px_rgba(210,255,30,0.35)] transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-60">
                Siguiente
                <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-foreground shadow-[0_16px_35px_rgba(210,255,30,0.35)] transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-60">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {submitPhase ?? "Guardando…"}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Guardar inmueble
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
