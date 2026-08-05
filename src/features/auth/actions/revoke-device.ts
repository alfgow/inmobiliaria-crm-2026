"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/features/auth/lib/current-user";
import { DEVICE_COOKIE, hashDeviceToken } from "@/features/auth/lib/device-token";
import { prisma } from "@/lib/prisma";

export async function revokeDevice(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();

  let deviceId: bigint;
  try {
    deviceId = BigInt(id);
  } catch {
    return;
  }

  const userId = BigInt(user.id);

  const device = await prisma.trusted_devices.findFirst({
    where: { id: deviceId, user_id: userId, status: "active" },
    select: { device_token_hash: true },
  });

  if (!device) return;

  await prisma.trusted_devices.update({
    where: { id: deviceId },
    data: { status: "revoked", revoked_at: new Date() },
  });

  const cookieStore = await cookies();
  const currentToken = cookieStore.get(DEVICE_COOKIE)?.value;

  if (currentToken && hashDeviceToken(currentToken) === device.device_token_hash) {
    cookieStore.set(DEVICE_COOKIE, "", { maxAge: 0, path: "/" });
  }

  revalidatePath("/configuracion");
}
