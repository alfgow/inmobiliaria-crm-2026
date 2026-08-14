import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const sessionUser = token ? await verifyToken(token) : null;
  if (!sessionUser) return null;

  let userId: bigint;
  try {
    userId = BigInt(sessionUser.id);
  } catch {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
    },
  });

  if (!user?.is_active) return null;

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
