"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ScanFace, Save, ShieldAlert, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createUser, deleteUser, revokeUserFaceAccess, updateUser } from "@/features/users/actions/manage-users";
import { createUserInputSchema, updateUserInputSchema } from "@/features/users/schemas/user.schema";
import { USER_ROLES, getUserRoleLabel, type UserRole } from "@/features/users/types/user-role";

type UserFormValues = {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
  confirmPassword?: string;
};

type Props = {
  mode: "create" | "edit";
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  isSelf?: boolean;
  hasFaceEnrollment?: boolean;
  trustedDeviceCount?: number;
};

export function UserForm({ mode, user, isSelf = false, hasFaceEnrollment = false, trustedDeviceCount = 0 }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevokingFace, setIsRevokingFace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(mode === "create" ? createUserInputSchema : updateUserInputSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: (user?.role as UserRole) ?? "user",
      isActive: user?.isActive ?? true,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createUser(values)
          : await updateUser(user!.id, values);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/usuarios");
      router.refresh();
    });
  });

  const handleDelete = () => {
    if (!user || !window.confirm(`Eliminar a ${user.name} de forma permanente?`)) return;
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
        return;
      }
      router.push("/usuarios");
      router.refresh();
    });
  };

  const handleRevokeFace = () => {
    if (!user || !window.confirm(`Revocar el acceso facial de ${user.name}?`)) return;
    setIsRevokingFace(true);
    startTransition(async () => {
      const result = await revokeUserFaceAccess(user.id);
      if (result.error) {
        setError(result.error);
      }
      setIsRevokingFace(false);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5 rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)] sm:p-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            className="w-full rounded-2xl border border-border-soft bg-white px-4 py-3 text-lg font-semibold outline-none transition focus:border-brand-secondary"
            {...form.register("name")}
          />
          {form.formState.errors.name && <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400" htmlFor="email">
            Correo electronico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="off"
            className="w-full rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-secondary"
            {...form.register("email")}
          />
          {form.formState.errors.email && <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400" htmlFor="password">
              {mode === "create" ? "Contrasena" : "Nueva contrasena (opcional)"}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={mode === "edit" ? "Dejar en blanco para no cambiarla" : undefined}
                className="w-full rounded-2xl border border-border-soft bg-white px-4 py-3 pr-11 text-sm outline-none transition focus:border-brand-secondary"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-900"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400" htmlFor="confirmPassword">
              Confirmar contrasena
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="w-full rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-secondary"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-rose-600">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {mode === "edit" ? (
          <div className="rounded-2xl border border-border-soft bg-neutral-50 p-4">
            <div className="flex items-start gap-2">
              <ScanFace className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Reconocimiento facial</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  {hasFaceEnrollment
                    ? `Rostro registrado, con ${trustedDeviceCount} dispositivo${trustedDeviceCount === 1 ? "" : "s"} de confianza.`
                    : "Este usuario no ha registrado su rostro."}
                </p>
              </div>
            </div>
            {hasFaceEnrollment ? (
              <button
                type="button"
                onClick={handleRevokeFace}
                disabled={isRevokingFace}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-60"
              >
                {isRevokingFace ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Revocar acceso facial
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <aside className="space-y-5">
        <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400" htmlFor="role">
                Rol
              </label>
              <select
                id="role"
                disabled={isSelf}
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand-secondary disabled:opacity-60"
                {...form.register("role")}
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {getUserRoleLabel(role)}
                  </option>
                ))}
              </select>
              {isSelf ? <p className="text-xs text-neutral-400">No puedes cambiar tu propio rol.</p> : null}
            </div>

            <label className="flex items-center gap-2.5 text-sm text-neutral-700">
              <input
                type="checkbox"
                disabled={isSelf}
                className="size-4 rounded border-neutral-300 disabled:opacity-60"
                {...form.register("isActive")}
              />
              Cuenta activa
              {isSelf ? <span className="text-xs text-neutral-400">(no puedes desactivarte)</span> : null}
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar usuario
            </button>
          </div>
        </section>

        {mode === "edit" && !isSelf ? (
          <section className="rounded-[1.75rem] border border-dashed border-rose-200 bg-rose-50/50 p-5">
            <div className="flex items-start gap-2 text-rose-700">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs leading-5">
                Elimina la cuenta de forma permanente, junto con su acceso facial y llaves de API.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending || isDeleting}
              onClick={handleDelete}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Eliminar usuario
            </button>
          </section>
        ) : null}

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      </aside>
    </form>
  );
}
