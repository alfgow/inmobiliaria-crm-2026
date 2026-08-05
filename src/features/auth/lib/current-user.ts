import { cookies } from "next/headers";

import { SESSION_COOKIE, verifyToken } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return token ? verifyToken(token) : null;
}
