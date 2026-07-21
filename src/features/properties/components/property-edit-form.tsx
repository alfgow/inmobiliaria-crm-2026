"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
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
import {
  ArrowLeft,
  Check,
  GripVertical,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { updateProperty, type PropertyUpdateData } from "@/features/properties/actions/update-property";
import {
  addPropertyImage,
  deletePropertyImage,
  reorderPropertyImages,
} from "@/features/properties/actions/manage-images";
import { DeletePropertyButton } from "@/features/properties/components/delete-property-button";
import { applyWatermark } from "@/lib/watermark";

// ── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
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

const OPERATION_TYPES = ["Venta", "Renta", "Preventa", "Traspaso"];

const AMENITIES_CATALOG = [
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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EditableImage {
  id: string;
  s3_key: string;
  url: string;
  orden: number;
}

interface UploadingImage {
  uid: string;
  name: string;
  previewUrl: string;
  state: "uploading" | "error";
  errorMsg?: string;
}

interface StatusOption {
  id: number;
  nombre: string;
  color: string | null;
}

interface AdvisorOption {
  id: string;
  nombre: string;
}

export interface PropertyEditFormProps {
  slug: string;
  propertyId: string;
  initialData: {
    titulo: string;
    descripcion: string;
    precio: string;
    tipo: string;
    operacion: string;
    estatus_id: number;
    destacado: boolean;
    visible: boolean;
    habitaciones: number;
    banos: number;
    banos_modalidad: string;
    estacionamientos: number;
    metros_cuadrados: string;
    superficie_construida: string;
    superficie_terreno: string;
    anio_construccion: string;
    direccion: string;
    colonia: string;
    municipio: string;
    estado: string;
    codigo_postal: string;
    latitud: string;
    longitud: string;
    video_url: string;
    tour_virtual_url: string;
    amenidades: string[];
    requisitos: string[];
    restricciones: string[];
    tags: string[];
    seo_description: string;
    asesor_id: string;
  };
  statuses: StatusOption[];
  advisors: AdvisorOption[];
  initialImages: EditableImage[];
}

// ── Base styles ───────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm text-brand-text outline-none transition placeholder:text-brand-text/30 focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/10";

const selectCls = `${inputCls} cursor-pointer appearance-none`;

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-6 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-8">
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">
      {children}
    </p>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label className="text-xs font-medium text-brand-text/60">{label}</label>
      {hint && <span className="text-xs text-brand-text/40">{hint}</span>}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
        checked
          ? "border-brand-text bg-brand-text"
          : "border-border-soft bg-white hover:border-border-soft/60"
      }`}
    >
      <p className={`text-sm font-medium ${checked ? "text-white" : "text-brand-text"}`}>{label}</p>
      <div
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-white/20" : "bg-border-soft"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}

function Chip({
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-brand-text bg-brand-text text-white"
          : "border-border-soft bg-white text-brand-text/60 hover:border-brand-secondary hover:text-brand-secondary"
      }`}
    >
      {active && <Check className="size-3 shrink-0" />}
      {label}
    </button>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 50,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-brand-text/60">{label}</p>
      <div className="flex h-11 items-center rounded-xl border border-border-soft bg-brand-surface/70">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, +((value - step).toFixed(1))))}
          disabled={value <= min}
          className="flex h-full w-10 items-center justify-center text-xl font-light text-brand-text/30 transition hover:text-brand-text/70 disabled:opacity-25"
        >
          −
        </button>
        <span className="flex-1 text-center text-base font-semibold tabular-nums text-brand-text">
          {value % 1 === 0 ? value : value.toFixed(1)}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, +((value + step).toFixed(1))))}
          disabled={value >= max}
          className="flex h-full w-10 items-center justify-center text-xl font-light text-brand-text/30 transition hover:text-brand-text/70 disabled:opacity-25"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ItemList({
  items,
  emptyLabel,
  onRemove,
}: {
  items: string[];
  emptyLabel: string;
  onRemove: (i: number) => void;
}) {
  if (items.length === 0)
    return (
      <p className="rounded-xl border border-dashed border-border-soft px-4 py-3 text-sm text-brand-text/40">
        {emptyLabel}
      </p>
    );
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={`${item}-${i}`}
          className="flex items-center justify-between rounded-xl border border-border-soft bg-white px-4 py-2.5 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-text/20" />
            <span className="text-sm text-brand-text/70">{item}</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-brand-text/25 transition hover:text-rose-500"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function AddItemRow({
  value,
  onChange,
  onAdd,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className={`${inputCls} flex-1`}
      />
      <button
        type="button"
        onClick={onAdd}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-white shadow-sm transition hover:border-brand-secondary hover:text-brand-secondary"
      >
        <span className="text-lg font-light leading-none">+</span>
      </button>
    </div>
  );
}

// ── Photo tile (sortable) ─────────────────────────────────────────────────────

function SortableImageTile({
  image,
  index,
  isDeleting,
  onDelete,
}: {
  image: EditableImage;
  index: number;
  isDeleting: boolean;
  onDelete: (id: string, s3Key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative overflow-hidden rounded-[1.35rem] border border-border-soft bg-white shadow-sm transition ${
        isDragging ? "z-20 scale-[1.02] shadow-lg" : ""
      } ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-surface">
        <Image
          src={image.url}
          alt={`Imagen ${index + 1}`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
          className="object-cover"
        />

        <div className="absolute left-2 top-2 rounded-full border border-white/70 bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-text/70 shadow-sm">
          {index === 0 ? "Portada" : `#${index + 1}`}
        </div>

        {isDeleting ? (
          <div className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm">
            <Loader2 className="size-4 animate-spin text-brand-text/40" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onDelete(image.id, image.s3_key)}
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-brand-text/50 shadow-sm opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}

        <button
          type="button"
          className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-brand-text/50 shadow-sm opacity-0 transition hover:text-brand-text group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
    </article>
  );
}

function UploadingImageTile({
  image,
  onDismiss,
}: {
  image: UploadingImage;
  onDismiss: (uid: string) => void;
}) {
  return (
    <article className="relative overflow-hidden rounded-[1.35rem] border border-border-soft bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-surface">
        <Image
          src={image.previewUrl}
          alt={image.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
          unoptimized
        />
        <div
          className={`absolute inset-0 flex items-center justify-center backdrop-blur-[2px] ${
            image.state === "error" ? "bg-rose-500/30" : "bg-white/20"
          }`}
        >
          {image.state === "uploading" ? (
            <Loader2 className="size-6 animate-spin text-white drop-shadow" />
          ) : (
            <button
              type="button"
              onClick={() => onDismiss(image.uid)}
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      {image.state === "error" && (
        <p className="px-3 py-2 text-xs text-rose-500">{image.errorMsg ?? "Error al subir"}</p>
      )}
    </article>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      onChange={onChange}
      onInput={(e) => {
        const el = e.currentTarget;
        el.style.height = "0px";
        el.style.height = `${el.scrollHeight}px`;
        props.onInput?.(e);
      }}
      className={`${className ?? ""} overflow-hidden`}
    />
  );
}

// ── Main form component ───────────────────────────────────────────────────────

export function PropertyEditForm({
  slug,
  propertyId,
  initialData,
  statuses,
  advisors,
  initialImages,
}: PropertyEditFormProps) {
  // ── Form state ───────────────────────────────────────────────────────────────
  const [titulo, setTitulo] = useState(initialData.titulo);
  const [descripcion, setDescripcion] = useState(initialData.descripcion);
  const [precio, setPrecio] = useState(initialData.precio);
  const [tipo, setTipo] = useState(initialData.tipo);
  const [operacion, setOperacion] = useState(initialData.operacion);
  const [estatusId, setEstatusId] = useState(initialData.estatus_id);
  const [destacado, setDestacado] = useState(initialData.destacado);
  const [visible, setVisible] = useState(initialData.visible);

  const [habitaciones, setHabitaciones] = useState(initialData.habitaciones);
  const [banos, setBanos] = useState(initialData.banos);
  const [banosModalidad, setBanosModalidad] = useState(initialData.banos_modalidad);
  const [estacionamientos, setEstacionamientos] = useState(initialData.estacionamientos);
  const [metrosCuadrados, setMetrosCuadrados] = useState(initialData.metros_cuadrados);
  const [superficieConstruida, setSuperficieConstruida] = useState(
    initialData.superficie_construida,
  );
  const [superficieTerreno, setSuperficieTerreno] = useState(initialData.superficie_terreno);
  const [anioConstruccion, setAnioConstruccion] = useState(initialData.anio_construccion);

  const [direccion, setDireccion] = useState(initialData.direccion);
  const [colonia, setColonia] = useState(initialData.colonia);
  const [municipio, setMunicipio] = useState(initialData.municipio);
  const [estado, setEstado] = useState(initialData.estado);
  const [codigoPostal, setCodigoPostal] = useState(initialData.codigo_postal);
  const [latitud, setLatitud] = useState(initialData.latitud);
  const [longitud, setLongitud] = useState(initialData.longitud);

  const [videoUrl, setVideoUrl] = useState(initialData.video_url);
  const [tourVirtualUrl, setTourVirtualUrl] = useState(initialData.tour_virtual_url);

  const [amenidades, setAmenidades] = useState<string[]>(
    Array.isArray(initialData.amenidades) ? initialData.amenidades : [],
  );
  const [requisitos, setRequisitos] = useState<string[]>(
    Array.isArray(initialData.requisitos) ? initialData.requisitos : [],
  );
  const [restricciones, setRestricciones] = useState<string[]>(
    Array.isArray(initialData.restricciones) ? initialData.restricciones : [],
  );
  const [tags, setTags] = useState<string[]>(
    Array.isArray(initialData.tags) ? initialData.tags : [],
  );
  const [tagDraft, setTagDraft] = useState("");
  const [reqDraft, setReqDraft] = useState("");
  const [restrDraft, setRestrDraft] = useState("");

  const [seoDescription, setSeoDescription] = useState(initialData.seo_description);
  const [asesorId, setAsesorId] = useState(initialData.asesor_id);

  // ── Save state ───────────────────────────────────────────────────────────────
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Photo state ──────────────────────────────────────────────────────────────
  const [images, setImages] = useState<EditableImage[]>(initialImages);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const imagePreviewUrls = useRef<string[]>([]);

  useEffect(
    () => () => {
      imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  // ── DnD sensors ──────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setSaveStatus("idle");
    setSaveError(null);

    const priceNum = parseFloat(precio.replace(/[^\d.]/g, "")) || 0;

    const payload: PropertyUpdateData = {
      titulo,
      descripcion: descripcion || null,
      precio: priceNum,
      tipo,
      operacion,
      estatus_id: estatusId,
      destacado,
      visible,
      habitaciones,
      banos,
      banos_modalidad: banosModalidad || null,
      estacionamientos,
      metros_cuadrados: metrosCuadrados ? parseFloat(metrosCuadrados) : null,
      superficie_construida: superficieConstruida ? parseFloat(superficieConstruida) : null,
      superficie_terreno: superficieTerreno ? parseFloat(superficieTerreno) : null,
      anio_construccion: anioConstruccion ? parseInt(anioConstruccion, 10) : null,
      direccion,
      colonia: colonia || null,
      municipio: municipio || null,
      estado: estado || null,
      codigo_postal: codigoPostal || null,
      latitud: parseCoordinate(latitud),
      longitud: parseCoordinate(longitud),
      video_url: videoUrl || null,
      tour_virtual_url: tourVirtualUrl || null,
      amenidades,
      requisitos,
      restricciones,
      tags,
      seo_description: seoDescription || null,
      asesor_id: asesorId ? parseFloat(asesorId) : null,
    };

    startTransition(async () => {
      const result = await updateProperty(slug, payload);
      if (result.error) {
        setSaveStatus("error");
        setSaveError(result.error);
      } else {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    });
  };

  const handleDeleteImage = useCallback(
    async (id: string, s3Key: string) => {
      setDeletingIds((prev) => new Set(prev).add(id));
      const result = await deletePropertyImage(id, s3Key, slug);
      if (result.error) {
        alert(result.error);
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setImages((prev) => prev.filter((img) => img.id !== id));
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [slug],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(images, oldIndex, newIndex).map((img, i) => ({
        ...img,
        orden: i,
      }));
      setImages(reordered);

      reorderPropertyImages(
        reordered.map((img) => ({ id: img.id, orden: img.orden })),
        slug,
      ).catch(console.error);
    },
    [images, slug],
  );

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const uid = crypto.randomUUID();
        const ext = file.name.split(".").pop() ?? "jpg";
        const s3Key = `inmuebles/${propertyId}/${uid}.${ext}`;
        const nextOrden = images.length + uploadingImages.length;

        // Show original immediately while watermark is being processed
        const tempUrl = URL.createObjectURL(file);
        imagePreviewUrls.current.push(tempUrl);
        setUploadingImages((prev) => [
          ...prev,
          { uid, name: file.name, previewUrl: tempUrl, state: "uploading" },
        ]);

        (async () => {
          try {
            const watermarkedFile = await applyWatermark(file);

            // Swap preview to watermarked version
            const watermarkedUrl = URL.createObjectURL(watermarkedFile);
            imagePreviewUrls.current.push(watermarkedUrl);
            URL.revokeObjectURL(tempUrl);
            setUploadingImages((prev) =>
              prev.map((u) => u.uid === uid ? { ...u, previewUrl: watermarkedUrl } : u),
            );

            const uploadForm = new FormData();
            uploadForm.append("key", s3Key);
            uploadForm.append("contentType", watermarkedFile.type);
            uploadForm.append("file", watermarkedFile);

            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: uploadForm,
            });
            if (!uploadRes.ok) throw new Error("Upload failed");

            const result = await addPropertyImage(propertyId, s3Key, nextOrden, slug);
            if (result.error) throw new Error(result.error);

            setImages((prev) => [
              ...prev,
              { id: result.id!, s3_key: s3Key, url: watermarkedUrl, orden: nextOrden },
            ]);
            setUploadingImages((prev) => prev.filter((u) => u.uid !== uid));
          } catch (err) {
            setUploadingImages((prev) =>
              prev.map((u) =>
                u.uid === uid
                  ? { ...u, state: "error", errorMsg: (err as Error).message }
                  : u,
              ),
            );
          }
        })();
      }
    },
    [images.length, uploadingImages.length, propertyId, slug],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: handleDrop,
  });

  const toggleAmenity = (a: string) =>
    setAmenidades((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const addUnique = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    clearDraft: () => void,
  ) => {
    const v = value.trim();
    if (!v) return;
    setter((cur) => (cur.includes(v) ? cur : [...cur, v]));
    clearDraft();
  };

  function parseCoordinate(value: string): number | null {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      {/* ── Left column: form sections ─────────────────────────────────────── */}
      <div className="flex flex-col gap-5">

        {/* General */}
        <SectionCard>
          <SectionLabel>General</SectionLabel>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel label="Título" />
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título comercial del inmueble"
                className={inputCls}
              />
            </div>

            <div>
              <FieldLabel label="Descripción" />
              <AutoGrowTextarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Descripción del inmueble..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel label="Tipo de inmueble" />
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className={selectCls}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel label="Operación" />
                <select
                  value={operacion}
                  onChange={(e) => setOperacion(e.target.value)}
                  className={selectCls}
                >
                  {OPERATION_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel label="Precio (MXN)" />
              <input
                type="text"
                inputMode="decimal"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
        </SectionCard>

        {/* Características */}
        <SectionCard>
          <SectionLabel>Características</SectionLabel>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stepper label="Recámaras" value={habitaciones} onChange={setHabitaciones} max={20} />
              <Stepper
                label="Baños"
                value={banos}
                onChange={setBanos}
                max={20}
                step={0.5}
              />
              <div>
                <FieldLabel label="Modalidad de baños" />
                <select
                  value={banosModalidad}
                  onChange={(e) => setBanosModalidad(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecciona una modalidad</option>
                  <option value="compartido">Compartido</option>
                  <option value="privado">Privado</option>
                </select>
              </div>
              <Stepper
                label="Estacionamientos"
                value={estacionamientos}
                onChange={setEstacionamientos}
                max={20}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  ["m² totales", metrosCuadrados, setMetrosCuadrados, "185"],
                  ["Sup. construida (m²)", superficieConstruida, setSuperficieConstruida, "165"],
                  ["Sup. terreno (m²)", superficieTerreno, setSuperficieTerreno, "220"],
                  ["Año de construcción", anioConstruccion, setAnioConstruccion, "2021"],
                ] as const
              ).map(([label, val, setter, ph]) => (
                <div key={label}>
                  <FieldLabel label={label} />
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    placeholder={ph}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Ubicación */}
        <SectionCard>
          <SectionLabel>Ubicación</SectionLabel>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel label="Dirección" />
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className={inputCls}
                placeholder="Calle y número"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Colonia", colonia, setColonia, "Col. Del Valle"],
                  ["Municipio / Alcaldía", municipio, setMunicipio, "Benito Juárez"],
                  ["Estado", estado, setEstado, "CDMX"],
                  ["Código postal", codigoPostal, setCodigoPostal, "03100"],
                ] as const
              ).map(([label, val, setter, ph]) => (
                <div key={label}>
                  <FieldLabel label={label} />
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    placeholder={ph}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel label="Latitud" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={latitud}
                  onChange={(e) => setLatitud(e.target.value)}
                  placeholder="19.4326"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel label="Longitud" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={longitud}
                  onChange={(e) => setLongitud(e.target.value)}
                  placeholder="-99.1332"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Multimedia */}
        <SectionCard>
          <SectionLabel>Multimedia</SectionLabel>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel label="Video URL" />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel label="Tour virtual URL" />
              <input
                type="url"
                value={tourVirtualUrl}
                onChange={(e) => setTourVirtualUrl(e.target.value)}
                placeholder="https://matterport.com/..."
                className={inputCls}
              />
            </div>
          </div>
        </SectionCard>

        {/* Amenidades */}
        <SectionCard>
          <SectionLabel>Amenidades</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_CATALOG.map((a) => (
              <Chip key={a} label={a} active={amenidades.includes(a)} onClick={() => toggleAmenity(a)} />
            ))}
          </div>
          {amenidades.length > 0 && (
            <p className="mt-3 text-xs text-brand-text/40">
              {amenidades.length} amenidad{amenidades.length !== 1 ? "es" : ""} seleccionada
              {amenidades.length !== 1 ? "s" : ""}
            </p>
          )}
        </SectionCard>

        {/* Requisitos y restricciones */}
        <SectionCard>
          <SectionLabel>Requisitos y restricciones</SectionLabel>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-brand-text/60">Requisitos</p>
              <AddItemRow
                value={reqDraft}
                onChange={setReqDraft}
                onAdd={() => addUnique(reqDraft, setRequisitos, () => setReqDraft(""))}
                placeholder="Ej: Fiador con inmueble"
              />
              <ItemList
                items={requisitos}
                emptyLabel="Sin requisitos"
                onRemove={(i) => setRequisitos((cur) => cur.filter((_, j) => j !== i))}
              />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-brand-text/60">Restricciones</p>
              <AddItemRow
                value={restrDraft}
                onChange={setRestrDraft}
                onAdd={() =>
                  addUnique(restrDraft, setRestricciones, () => setRestrDraft(""))
                }
                placeholder="Ej: No mascotas"
              />
              <ItemList
                items={restricciones}
                emptyLabel="Sin restricciones"
                onRemove={(i) => setRestricciones((cur) => cur.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        </SectionCard>

        {/* Tags */}
        <SectionCard>
          <SectionLabel>Tags</SectionLabel>
          <div className="flex flex-col gap-3">
            <AddItemRow
              value={tagDraft}
              onChange={setTagDraft}
              onAdd={() => addUnique(tagDraft, setTags, () => setTagDraft(""))}
              placeholder="Ej: frente al mar, remodelado, piscina"
            />
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-secondary/20 bg-brand-secondary/8 px-3 py-1 text-xs font-medium text-brand-secondary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((cur) => cur.filter((_, j) => j !== i))}
                      className="text-brand-secondary/50 transition hover:text-rose-500"
                      aria-label={`Eliminar tag "${tag}"`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border-soft px-4 py-3 text-sm text-brand-text/40">
                Sin tags
              </p>
            )}
          </div>
        </SectionCard>

        {/* Publicación */}
        <SectionCard>
          <SectionLabel>Publicación</SectionLabel>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel label="Descripción SEO" hint={`${seoDescription.length}/160`} />
              <AutoGrowTextarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={160}
                className={`${inputCls} resize-none`}
                placeholder="Resumen breve para buscadores y redes sociales."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Destacado" checked={destacado} onChange={setDestacado} />
              <Toggle label="Visible en portal" checked={visible} onChange={setVisible} />
            </div>
          </div>
        </SectionCard>

        {/* Control */}
        <SectionCard>
          <SectionLabel>Control</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel label="Estatus" />
              <select
                value={estatusId}
                onChange={(e) => setEstatusId(Number(e.target.value))}
                className={selectCls}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel label="Asesor responsable" />
              <select
                value={asesorId}
                onChange={(e) => setAsesorId(e.target.value)}
                className={selectCls}
              >
                <option value="">Sin asignar</option>
                {advisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Fotos */}
        <SectionCard>
          <SectionLabel>Fotos</SectionLabel>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`mb-4 cursor-pointer rounded-[1.75rem] border-2 border-dashed p-5 transition ${
              isDragActive
                ? "border-brand-secondary bg-brand-secondary/5"
                : "border-border-soft bg-brand-surface/40 hover:border-brand-secondary/40"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border-soft bg-white shadow-sm">
                <Upload className="size-4 text-brand-text/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text">
                  {isDragActive ? "Suelta las fotos aquí" : "Agregar fotos"}
                </p>
                <p className="text-xs text-brand-text/45">
                  Arrastra o haz clic · PNG, JPG, WEBP
                </p>
              </div>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-sm font-medium text-brand-text/60 shadow-sm transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                <ImagePlus className="size-4" />
                Seleccionar
              </button>
            </div>
          </div>

          {/* Grid */}
          {(images.length > 0 || uploadingImages.length > 0) ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {images.map((img, i) => (
                    <SortableImageTile
                      key={img.id}
                      image={img}
                      index={i}
                      isDeleting={deletingIds.has(img.id)}
                      onDelete={handleDeleteImage}
                    />
                  ))}
                  {uploadingImages.map((u) => (
                    <UploadingImageTile
                      key={u.uid}
                      image={u}
                      onDismiss={(uid) =>
                        setUploadingImages((prev) => prev.filter((x) => x.uid !== uid))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="rounded-[1.35rem] border border-dashed border-border-soft px-4 py-4 text-sm text-brand-text/40">
              Sin fotos. Sube la primera imagen para que aparezca como portada.
            </p>
          )}
        </SectionCard>
      </div>

      {/* ── Right sidebar ──────────────────────────────────────────────────── */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-fit">

        {/* Save card */}
        <div className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-primary text-sm font-semibold text-brand-text shadow-[0_16px_35px_rgba(210,255,30,0.25)] transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saveStatus === "saved" ? (
              <Check className="size-4" />
            ) : null}
            {isPending ? "Guardando…" : saveStatus === "saved" ? "Guardado" : "Guardar cambios"}
          </button>

          {saveStatus === "error" && saveError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {saveError}
            </p>
          )}

          <div className="mt-3 border-t border-border-soft pt-3">
            <DeletePropertyButton slug={slug} title={titulo} />
          </div>
        </div>

        {/* Navigation */}
        <div className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <Link
              href={`/inmuebles/${slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-brand-surface px-4 py-2.5 text-sm font-medium text-brand-text/60 transition hover:border-brand-secondary hover:text-brand-secondary"
            >
              <ArrowLeft className="size-3.5" />
              Ver detalle
            </Link>
            <Link
              href="/inmuebles"
              className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-brand-surface px-4 py-2.5 text-sm font-medium text-brand-text/60 transition hover:border-brand-secondary hover:text-brand-secondary"
            >
              <ArrowLeft className="size-3.5" />
              Portafolio
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">
            Estado actual
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-brand-text/55">Fotos</span>
              <span className="font-semibold tabular-nums text-brand-text">{images.length}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-brand-text/55">Amenidades</span>
              <span className="font-semibold tabular-nums text-brand-text">{amenidades.length}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-brand-text/55">Tags</span>
              <span className="font-semibold tabular-nums text-brand-text">{tags.length}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
