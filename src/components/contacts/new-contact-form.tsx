"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ActiveProperty = {
  id: string;
  titulo: string;
  precio: string;
  direccion: string;
  inmuebleEstatus: string;
};

type NewContactFormProps = {
  initialPhone: string;
  activeProperties: ActiveProperty[];
};

type FormState = {
  nombre: string;
  telefono: string;
  email: string;
  inmuebleId: string;
  comentarios: string;
};

function moneyFormatter(value: string) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function summaryValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

export function NewContactForm({
  initialPhone,
  activeProperties,
}: NewContactFormProps) {
  const [formState, setFormState] = useState<FormState>({
    nombre: "",
    telefono: initialPhone,
    email: "",
    inmuebleId: "",
    comentarios: "",
  });

  const selectedProperty = useMemo(
    () => activeProperties.find((property) => property.id === formState.inmuebleId),
    [activeProperties, formState.inmuebleId],
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            Información básica
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Datos del contacto
          </h2>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              name="nombre"
              required
              value={formState.nombre}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  nombre: event.target.value,
                }))
              }
              placeholder="Nombre completo"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Teléfono</span>
            <input
              type="tel"
              name="telefono"
              required
              value={formState.telefono}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  telefono: event.target.value,
                }))
              }
              placeholder="Número de teléfono"
              className="w-full rounded-2xl border border-sky-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Correo opcional
            </span>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="correo@dominio.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Propiedad de interés
            </span>
            <select
              name="inmueble_id"
              value={formState.inmuebleId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  inmuebleId: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              required
            >
              <option value="" disabled>
                Selecciona una propiedad activa
              </option>
              {activeProperties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.titulo} — {moneyFormatter(property.precio)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Comentarios
            </span>
            <textarea
              name="comentarios"
              rows={5}
              value={formState.comentarios}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  comentarios: event.target.value,
                }))
              }
              placeholder="Agrega contexto del contacto, presupuesto, zona, tiempos o cualquier detalle útil."
              className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)] transition hover:bg-emerald-700"
            >
              Guardar contacto
            </button>
            <Link
              href="/contactos"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>

      <aside className="space-y-6">
        <div className="hidden rounded-[2rem] border border-violet-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,243,255,0.96)_100%)] p-6 shadow-[0_28px_70px_rgba(91,33,182,0.08)] lg:block sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-violet-500">
            Resumen
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Lo que se registrará
          </h2>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-violet-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-violet-500">
                Nombre
              </span>
              <span className="mt-1 block font-medium text-slate-950">
                {summaryValue(formState.nombre, "Pendiente")}
              </span>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-sky-500">
                Teléfono
              </span>
              <span className="mt-1 block font-medium text-slate-950">
                {summaryValue(formState.telefono, "Pendiente")}
              </span>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-violet-500">
                Correo
              </span>
              <span className="mt-1 block font-medium text-slate-950">
                {summaryValue(formState.email, "Opcional")}
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-emerald-500">
                Propiedad
              </span>
              <span className="mt-1 block font-medium text-slate-950">
                {selectedProperty
                  ? `${selectedProperty.titulo} — ${moneyFormatter(selectedProperty.precio)}`
                  : "Selecciona una propiedad activa"}
              </span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-amber-500">
                Comentarios
              </span>
              <span className="mt-1 block font-medium text-slate-950">
                {summaryValue(
                  formState.comentarios,
                  "Comentario inicial de seguimiento",
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-400">
            Nota
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            El teléfono ingresado en el modal llega prellenado aquí para reducir
            fricción al crear el nuevo contacto.
          </p>
        </div>
      </aside>
    </section>
  );
}
