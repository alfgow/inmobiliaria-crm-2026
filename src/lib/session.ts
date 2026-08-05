import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth-secret";

export const SESSION_COOKIE = "crm_session";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  const secret = getAuthSecret();

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
