"use server";

import { isIP } from "node:net";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { Prisma } from "../../../../app/generated/prisma/client";
import { generateApiKey } from "@/features/api-users/services/api-key.service";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

export type CreateApiKeyActionState = {
  success: boolean;
  message: string;
  apiKey?: string;
  prefix?: string;
};

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return token ? verifyToken(token) : null;
}

function getRequiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createApiKey(
  _previousState: CreateApiKeyActionState,
  formData: FormData,
): Promise<CreateApiKeyActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      message: "Tu sesion expiro. Vuelve a iniciar sesion.",
    };
  }

  const name = getRequiredString(formData, "name");
  const allowedIp = getRequiredString(formData, "allowedIp");

  if (name.length < 3) {
    return {
      success: false,
      message: "El nombre debe tener al menos 3 caracteres.",
    };
  }

  if (name.length > 80) {
    return {
      success: false,
      message: "El nombre no puede superar 80 caracteres.",
    };
  }

  if (allowedIp && isIP(allowedIp) === 0) {
    return {
      success: false,
      message: "La IP permitida no tiene un formato valido.",
    };
  }

  const apiKey = generateApiKey();
  const now = new Date();

  try {
    await prisma.api_keys.create({
      data: {
        user_id: new Prisma.Decimal(user.id),
        name,
        prefix: apiKey.prefix,
        key_hash: apiKey.keyHash,
        allowed_ip: allowedIp || null,
        created_at: now,
        updated_at: now,
      },
    });

    revalidatePath("/configuracion");

    return {
      success: true,
      message: "API key creada. Guardala ahora, no volvera a mostrarse.",
      apiKey: apiKey.key,
      prefix: apiKey.prefix,
    };
  } catch (error) {
    console.error("createApiKey error:", error);
    return {
      success: false,
      message: "No fue posible crear la API key.",
    };
  }
}

export async function deleteApiKey(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const id = getRequiredString(formData, "id");

  let apiKeyId: bigint;
  try {
    apiKeyId = BigInt(id);
  } catch {
    return;
  }

  await prisma.api_keys.deleteMany({
    where: {
      id: apiKeyId,
      user_id: new Prisma.Decimal(user.id),
    },
  });

  revalidatePath("/configuracion");
}

