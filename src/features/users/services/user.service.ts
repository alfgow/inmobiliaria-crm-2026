import bcrypt from "bcryptjs";

import {
  createUserInputSchema,
  updateUserInputSchema,
} from "@/features/users/schemas/user.schema";
import { isUserRole } from "@/features/users/types/user-role";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;

export type UserRecord = {
  id: bigint;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
};

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

export function parseCreateUserPayload(input: unknown) {
  const parsed = createUserInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return { ok: true as const, data: parsed.data };
}

export function parseUpdateUserPayload(input: unknown) {
  const parsed = updateUserInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return { ok: true as const, data: parsed.data };
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function isEmailTaken(email: string, excludeId?: bigint) {
  const existing = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });

  return Boolean(existing && existing.id !== excludeId);
}

export function serializeUser(user: UserRecord) {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role: isUserRole(user.role) ? user.role : "user",
    isActive: user.is_active,
    createdAt: user.created_at?.toISOString() ?? null,
    updatedAt: user.updated_at?.toISOString() ?? null,
  };
}
