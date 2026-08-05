"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { getCurrentUser } from "@/features/auth/lib/current-user";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE_SECONDS,
  generateDeviceToken,
  getDeviceLabel,
} from "@/features/auth/lib/device-token";
import { prisma } from "@/lib/prisma";
import { shouldUseSecureCookie } from "@/lib/request";

export type TrustDeviceActionState = {
  success: boolean;
  message: string;
};

export async function trustDevice(): Promise<TrustDeviceActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Tu sesion expiro. Vuelve a iniciar sesion." };
  }

  const userId = BigInt(user.id);

  const hasActiveFace = await prisma.user_face_enrollments.findFirst({
    where: { user_id: userId, status: "active" },
    select: { id: true },
  });

  if (!hasActiveFace) {
    return {
      success: false,
      message: "Primero registra tu rostro antes de confiar en este dispositivo.",
    };
  }

  const headerList = await headers();
  const { token, tokenHash } = generateDeviceToken();

  await prisma.trusted_devices.create({
    data: {
      user_id: userId,
      device_token_hash: tokenHash,
      label: getDeviceLabel(headerList.get("user-agent")),
      status: "active",
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(headerList),
    sameSite: "lax",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  revalidatePath("/configuracion");
  return {
    success: true,
    message: "Este dispositivo ahora puede usar reconocimiento facial para iniciar sesion.",
  };
}
