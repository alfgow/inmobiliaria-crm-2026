import { notFound, redirect } from "next/navigation";

import { PageShell } from "@/components/dashboard/page-shell";
import { getCurrentUser } from "@/features/auth/lib/current-user";
import { UserForm } from "@/features/users/components/user-form";
import { serializeUser, userSelect } from "@/features/users/services/user.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  let userId: bigint;
  try {
    userId = BigInt(id);
  } catch {
    notFound();
  }

  const [user, faceEnrollment, trustedDeviceCount] = await Promise.all([
    prisma.users.findUnique({ where: { id: userId }, select: userSelect }),
    prisma.user_face_enrollments.findFirst({
      where: { user_id: userId, status: "active" },
      select: { id: true },
    }),
    prisma.trusted_devices.count({ where: { user_id: userId, status: "active" } }),
  ]);

  if (!user) {
    notFound();
  }

  const serialized = serializeUser(user);

  return (
    <PageShell
      eyebrow="Equipo"
      title={serialized.name}
      description="Edita los datos de acceso, el rol y la seguridad de esta cuenta."
    >
      <UserForm
        mode="edit"
        user={serialized}
        isSelf={serialized.id === currentUser.id}
        hasFaceEnrollment={Boolean(faceEnrollment)}
        trustedDeviceCount={trustedDeviceCount}
      />
    </PageShell>
  );
}
