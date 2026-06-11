"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { addInterest, removeInterest } from "../actions/intereses";

type InterestedProperty = {
  interestId: string;
  inmuebleId: string;
  titulo: string;
  direccion: string;
  precio: string;
  tipo: string;
  operacion: string;
  estatus: string;
  metros: string;
  createdAt: string | null;
};

type AvailableProperty = {
  id: string;
  titulo: string;
  precio: string;
  direccion: string;
};

type ContactInterestsCardProps = {
  contactId: string;
  initialInterests: InterestedProperty[];
  availableProperties: AvailableProperty[];
};

function formatMoney(value: string) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDimension(value: string) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `${amount.toLocaleString("es-MX")} m²` : "—";
}

export function ContactInterestsCard({
  contactId,
  initialInterests,
  availableProperties,
}: ContactInterestsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alreadyAdded = new Set(initialInterests.map((i) => i.inmuebleId));
  const selectableProperties = availableProperties.filter(
    (p) => !alreadyAdded.has(p.id),
  );

  function handleAdd() {
    if (!selectedPropertyId) return;
    setError(null);

    startTransition(async () => {
      const result = await addInterest(contactId, selectedPropertyId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSelectedPropertyId("");
      router.refresh();
    });
  }

  function handleRemove(interestId: string) {
    setError(null);
    setRemovingId(interestId);

    startTransition(async () => {
      const result = await removeInterest(interestId, contactId);

      if (!result.success) {
        setError(result.error);
        setRemovingId(null);
        return;
      }

      setRemovingId(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8">
      {/* Card header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            Intereses
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Propiedades que le interesan
          </h2>
        </div>
      </div>

      {/* Add interest row */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedPropertyId}
          onChange={(e) => {
            setSelectedPropertyId(e.target.value);
            setError(null);
          }}
          disabled={isPending || selectableProperties.length === 0}
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            {selectableProperties.length === 0
              ? "No hay propiedades disponibles"
              : "Selecciona un inmueble..."}
          </option>
          {selectableProperties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.titulo} — {formatMoney(property.precio)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedPropertyId || isPending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {isPending && !removingId ? "Agregando..." : "Agregar"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Interests list */}
      <div className="mt-4 grid gap-4">
        {initialInterests.length > 0 ? (
          initialInterests.map(
            ({ interestId, titulo, direccion, precio, tipo, operacion, estatus, metros, createdAt }) => {
              const isRemoving = removingId === interestId && isPending;
              const showTipo = tipo !== "—";
              const showOperacion = operacion !== "—";

              return (
                <div
                  key={interestId}
                  className={`relative rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition-opacity ${isRemoving ? "opacity-40" : ""}`}
                >
                  {/* Delete button — fixed top-right */}
                  <button
                    type="button"
                    onClick={() => handleRemove(interestId)}
                    disabled={isPending}
                    aria-label="Eliminar interés"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-white text-red-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Property info — right padding to avoid overlap with trash */}
                  <div className="space-y-2 pr-12">
                    {(showTipo || showOperacion) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {showTipo && (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-sky-700">
                            {tipo}
                          </span>
                        )}
                        {showOperacion && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-violet-700">
                            {operacion}
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-slate-950">{titulo}</h3>
                    <p className="text-sm leading-6 text-slate-600">{direccion}</p>
                  </div>

                  {/* Price — full width */}
                  <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                      Precio
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {formatMoney(precio)}
                    </p>
                  </div>

                  {/* Stats grid — 2 cols on mobile, 3 on sm */}
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                        Estatus
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-950">{estatus}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                        Metros
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-950">
                        {formatDimension(metros)}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 sm:col-span-1">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                        Interés registrado
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-950">
                        {formatDate(createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            },
          )
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
            Todavía no hay propiedades asociadas a este contacto.
          </div>
        )}
      </div>
    </div>
  );
}
