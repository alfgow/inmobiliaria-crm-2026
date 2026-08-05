import { redirect } from "next/navigation";
import { ShieldCheck, Users as UsersIcon, UserCheck } from "lucide-react";

import { PageShell } from "@/components/dashboard/page-shell";
import { getCurrentUser } from "@/features/auth/lib/current-user";
import { UserTable, type UserListItem } from "@/features/users/components/user-table";
import { serializeUser, userSelect } from "@/features/users/services/user.service";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function metricCard(label: string, value: number, icon: React.ReactNode) {
  return (
    <div className="rounded-[1.5rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(20,16,35,0.06)]">
      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-brand-primary/40 text-neutral-900">
        {icon}
      </div>
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
    </div>
  );
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  let users: UserListItem[] = [];
  let metrics = { total: 0, active: 0, admins: 0 };
  let databaseUnavailable = false;

  try {
    const [rawUsers, total, active, admins] = await Promise.all([
      prisma.users.findMany({
        orderBy: [{ created_at: "desc" }],
        select: userSelect,
      }),
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({ where: { role: "admin" } }),
    ]);

    users = rawUsers.map((user) => {
      const serialized = serializeUser(user);
      return { ...serialized, isSelf: serialized.id === currentUser.id };
    });
    metrics = { total, active, admins };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    databaseUnavailable = true;
  }

  return (
    <PageShell
      eyebrow="Equipo"
      title="Usuarios del sistema"
      description="Administra las cuentas del staff: quien tiene acceso al CRM, su rol y su estado."
      actionHref="/usuarios/nuevo"
      actionLabel="Nuevo usuario"
    >
      {databaseUnavailable ? (
        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          La base de datos no responde en este momento. Verifica PostgreSQL o `DATABASE_URL`.
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            {metricCard("Total", metrics.total, <UsersIcon className="size-5" />)}
            {metricCard("Activos", metrics.active, <UserCheck className="size-5" />)}
            {metricCard("Administradores", metrics.admins, <ShieldCheck className="size-5" />)}
          </section>
          <UserTable users={users} />
        </>
      )}
    </PageShell>
  );
}
