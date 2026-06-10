import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { signToken, SESSION_COOKIE } from "@/lib/session";

const LOGIN_DB_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("LOGIN_DB_TIMEOUT"));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

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
  try {
    const body = await req.json();
    const email = (body.email ?? "").toLowerCase().trim();
    const password = body.password ?? "";
    const secureCookie = shouldUseSecureCookie(req);

    if (!email || !password) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });
    }

    const user = await withTimeout(
      prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          password: true,
        },
      }),
      LOGIN_DB_TIMEOUT_MS,
    );

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await signToken({
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "LOGIN_DB_TIMEOUT" ||
        isDatabaseUnavailableError(error))
    ) {
      return NextResponse.json(
        {
          error:
            "La base de datos no respondió a tiempo. Verifica PostgreSQL y DATABASE_URL.",
        },
        { status: 503 },
      );
    }

    console.error("Login failed", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
