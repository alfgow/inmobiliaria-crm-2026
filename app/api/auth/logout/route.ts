import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

function shouldUseSecureCookie(req: NextRequest): boolean {
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return false;
  }

  return (
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https"
  );
}

export async function POST(req: NextRequest) {
  const secureCookie = shouldUseSecureCookie(req);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
