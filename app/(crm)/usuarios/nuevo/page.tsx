import { redirect } from "next/navigation";

import { PageShell } from "@/components/dashboard/page-shell";
import { getCurrentUser } from "@/features/auth/lib/current-user";
import { UserForm } from "@/features/users/components/user-form";

export default async function NewUserPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  return (
    <PageShell
      eyebrow="Equipo"
      title="Nuevo usuario"
      description="Crea una cuenta de acceso al CRM para un miembro del staff."
    >
      <UserForm mode="create" />
    </PageShell>
  );
}
