"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import Link from "next/link";
import { updateContact } from "../actions/updateContact";

const FUENTE_OPTIONS = ["Web", "Facebook", "Instagram", "Referido", "Otro"];

type EditContactFormProps = {
  contact: {
    id: string;
    nombre: string;
    telefono: string;
    email: string | null;
    fuente: string | null;
  };
};

export function EditContactForm({ contact }: EditContactFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    nombre: contact.nombre,
    telefono: contact.telefono,
    email: contact.email ?? "",
    fuente: contact.fuente ?? "Web",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateContact({
        id: contact.id,
        nombre: formState.nombre,
        telefono: formState.telefono,
        email: formState.email,
        fuente: formState.fuente,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/contactos/${contact.id}`);
    });
  }

  const hasChanges =
    formState.nombre !== contact.nombre ||
    formState.telefono !== contact.telefono ||
    formState.email !== (contact.email ?? "") ||
    formState.fuente !== (contact.fuente ?? "Web");

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            Editar información
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
              onChange={handleChange}
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
              onChange={handleChange}
              placeholder="Número de teléfono"
              className="w-full rounded-2xl border border-sky-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Correo (opcional)
            </span>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="correo@dominio.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Fuente</span>
            <select
              name="fuente"
              value={formState.fuente}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            >
              {FUENTE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={isPending || !hasChanges}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link
              href={`/contactos/${contact.id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-violet-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,243,255,0.96)_100%)] p-6 shadow-[0_28px_70px_rgba(91,33,182,0.08)] sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-violet-500">
            Vista previa
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Cambios a guardar
          </h2>

          <div className="mt-6 grid gap-3">
            {(
              [
                {
                  label: "Nombre",
                  value: formState.nombre || "Pendiente",
                  accent: "violet",
                  changed: formState.nombre !== contact.nombre,
                },
                {
                  label: "Teléfono",
                  value: formState.telefono || "Pendiente",
                  accent: "sky",
                  changed: formState.telefono !== contact.telefono,
                },
                {
                  label: "Correo",
                  value: formState.email || "Sin correo",
                  accent: "violet",
                  changed: formState.email !== (contact.email ?? ""),
                },
                {
                  label: "Fuente",
                  value: formState.fuente || "Sin fuente",
                  accent: "emerald",
                  changed: formState.fuente !== (contact.fuente ?? "Web"),
                },
              ] as const
            ).map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${
                  item.changed
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-slate-200 bg-white/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`block text-[10px] uppercase tracking-[0.3em] ${
                      item.changed ? "text-amber-500" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.changed && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600">
                      Modificado
                    </span>
                  )}
                </div>
                <span className="mt-1 block font-medium text-slate-950">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
