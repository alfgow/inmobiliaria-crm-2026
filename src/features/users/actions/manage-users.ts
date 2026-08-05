"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { Prisma } from "../../../../app/generated/prisma/client";
import { revokeFaceAccessForUser } from "@/features/auth/actions/revoke-face-access";
import {
  hashPassword,
  isEmailTaken,
  parseCreateUserPayload,
  parseUpdateUserPayload,
} from "@/features/users/services/user.service";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  return user && user.role === "admin" ? user : null;
}

function revalidateUserPaths(id?: string) {
  revalidatePath("/usuarios");
  revalidatePath("/usuarios/nuevo");
  if (id) {
    revalidatePath(`/usuarios/${id}/editar`);
  }
}

export async function createUser(input: unknown) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { error: "No tienes permisos para gestionar usuarios." };
  }

  const parsed = parseCreateUserPayload(input);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  if (await isEmailTaken(parsed.data.email)) {
    return { error: "Ya existe un usuario con ese correo." };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const created = await prisma.users.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        is_active: parsed.data.isActive,
        password: passwordHash,
        updated_at: new Date(),
      },
      select: { id: true },
    });

    revalidateUserPaths();
    return { success: true, id: created.id.toString() };
  } catch (error) {
    console.error("createUser error:", error);
    return { error: "No fue posible crear el usuario." };
  }
}

export async function updateUser(id: string, input: unknown) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { error: "No tienes permisos para gestionar usuarios." };
  }

  const parsed = parseUpdateUserPayload(input);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  let userId: bigint;
  try {
    userId = BigInt(id);
  } catch {
    return { error: "Usuario invalido." };
  }

  if (await isEmailTaken(parsed.data.email, userId)) {
    return { error: "Ya existe un usuario con ese correo." };
  }

  const isSelf = admin.id === id;
  if (isSelf && (parsed.data.role !== "admin" || !parsed.data.isActive)) {
    return {
      error:
        "No puedes quitarte el rol de administrador ni desactivar tu propia cuenta. Pidele a otro administrador que lo haga.",
    };
  }

  try {
    await prisma.users.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        is_active: parsed.data.isActive,
        updated_at: new Date(),
        ...(parsed.data.password ? { password: await hashPassword(parsed.data.password) } : {}),
      },
    });

    revalidateUserPaths(id);
    return { success: true };
  } catch (error) {
    console.error("updateUser error:", error);
    return { error: "No fue posible actualizar el usuario." };
  }
}

export async function deleteUser(id: string) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { error: "No tienes permisos para gestionar usuarios." };
  }

  if (admin.id === id) {
    return { error: "No puedes eliminar tu propia cuenta." };
  }

  let userId: bigint;
  try {
    userId = BigInt(id);
  } catch {
    return { error: "Usuario invalido." };
  }

  try {
    await revokeFaceAccessForUser(userId).catch((error) => {
      console.error("deleteUser revokeFaceAccessForUser error:", error);
    });

    await prisma.api_keys.deleteMany({ where: { user_id: new Prisma.Decimal(id) } });
    await prisma.users.delete({ where: { id: userId } });

    revalidateUserPaths();
    return { success: true };
  } catch (error) {
    console.error("deleteUser error:", error);
    return { error: "No fue posible eliminar el usuario." };
  }
}

export async function revokeUserFaceAccess(id: string) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { error: "No tienes permisos para gestionar usuarios." };
  }

  let userId: bigint;
  try {
    userId = BigInt(id);
  } catch {
    return { error: "Usuario invalido." };
  }

  try {
    await revokeFaceAccessForUser(userId);
    revalidateUserPaths(id);
    return { success: true };
  } catch (error) {
    console.error("revokeUserFaceAccess error:", error);
    return { error: "No fue posible revocar el acceso facial." };
  }
}
