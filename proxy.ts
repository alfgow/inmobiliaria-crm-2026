import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth-secret";

const SESSION_COOKIE = "crm_session";
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/login-face",
  "/api/auth/logout",
  "/api/v1",
];
const ADMIN_ONLY_PATHS = ["/usuarios"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = getAuthSecret();

  try {
    const { payload } = await jwtVerify(token, secret);

    const isAdminOnlyPath = ADMIN_ONLY_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

    if (isAdminOnlyPath && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
