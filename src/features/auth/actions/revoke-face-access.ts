"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/features/auth/lib/current-user";
import { DEVICE_COOKIE } from "@/features/auth/lib/device-token";
import { deleteFace } from "@/lib/rekognition";
import { prisma } from "@/lib/prisma";

/**
 * Revoca el rostro registrado y todos los dispositivos de confianza de un
 * usuario. Reusable para offboarding administrativo; hoy solo se expone en
 * self-service desde Configuracion.
 */
export async function revokeFaceAccessForUser(userId: bigint): Promise<void> {
  const activeEnrollments = await prisma.user_face_enrollments.findMany({
    where: { user_id: userId, status: "active" },
    select: { rekognition_face_id: true },
  });

  await prisma.$transaction([
    prisma.user_face_enrollments.updateMany({
      where: { user_id: userId, status: "active" },
      data: { status: "revoked", revoked_at: new Date() },
    }),
    prisma.trusted_devices.updateMany({
      where: { user_id: userId, status: "active" },
      data: { status: "revoked", revoked_at: new Date() },
    }),
  ]);

  await Promise.allSettled(
    activeEnrollments.map((enrollment) => deleteFace(enrollment.rekognition_face_id)),
  );
}

export async function revokeFaceAccess() {
  const user = await getCurrentUser();
  if (!user) return;

  await revokeFaceAccessForUser(BigInt(user.id));

  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, "", { maxAge: 0, path: "/" });

  revalidatePath("/configuracion");
}
