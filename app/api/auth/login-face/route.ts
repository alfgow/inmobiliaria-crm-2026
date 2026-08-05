import { NextRequest, NextResponse } from "next/server";

import { DEVICE_COOKIE, hashDeviceToken } from "@/features/auth/lib/device-token";
import { parseExternalImageId } from "@/features/auth/lib/face-identity";
import { parseFaceImageDataUrl } from "@/features/auth/lib/face-image";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { getRequestIp, shouldUseSecureCookie } from "@/lib/request";
import { searchFaceByImage } from "@/lib/rekognition";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import { TimeoutError, withTimeout } from "@/lib/with-timeout";

const FACE_LOGIN_DB_TIMEOUT_MS = 8000;
const AWS_SEARCH_THRESHOLD = 90;
const MIN_ACCEPTED_SIMILARITY = 99;
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const GENERIC_ERROR = "No se pudo verificar tu identidad. Usa tu contrasena.";
const NOT_ENABLED_ERROR = "Este dispositivo no esta habilitado para reconocimiento facial.";

type AttemptLog = {
  deviceTokenHash: string;
  ip: string | null;
  success: boolean;
  matchedUserId?: bigint;
  similarity?: number;
  reason: string;
};

async function logAttempt(log: AttemptLog) {
  try {
    await prisma.face_login_attempts.create({
      data: {
        device_token_hash: log.deviceTokenHash,
        ip: log.ip,
        success: log.success,
        matched_user_id: log.matchedUserId,
        similarity: log.similarity,
        reason: log.reason,
      },
    });
  } catch (error) {
    console.error("logAttempt error:", error);
  }
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req.headers);
  const deviceToken = req.cookies.get(DEVICE_COOKIE)?.value;

  if (!deviceToken) {
    return NextResponse.json({ error: NOT_ENABLED_ERROR }, { status: 403 });
  }

  const deviceTokenHash = hashDeviceToken(deviceToken);

  try {
    const recentFailedCount = await withTimeout(
      prisma.face_login_attempts.count({
        where: {
          device_token_hash: deviceTokenHash,
          success: false,
          created_at: { gte: new Date(Date.now() - ATTEMPT_WINDOW_MS) },
        },
      }),
      FACE_LOGIN_DB_TIMEOUT_MS,
    );

    if (recentFailedCount >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        { error: "Demasiados intentos fallidos. Usa tu contrasena." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsedImage = parseFaceImageDataUrl(body?.image);

    if (!parsedImage) {
      await logAttempt({ deviceTokenHash, ip, success: false, reason: "invalid_image" });
      return NextResponse.json({ error: "No se pudo leer la foto capturada." }, { status: 400 });
    }

    const match = await searchFaceByImage(parsedImage.bytes, AWS_SEARCH_THRESHOLD);

    if (!match || match.similarity < MIN_ACCEPTED_SIMILARITY) {
      await logAttempt({
        deviceTokenHash,
        ip,
        success: false,
        similarity: match?.similarity,
        reason: "no_match",
      });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const matchedUserId = parseExternalImageId(match.externalImageId);
    if (matchedUserId === null) {
      await logAttempt({
        deviceTokenHash,
        ip,
        success: false,
        similarity: match.similarity,
        reason: "bad_external_id",
      });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const trustedDevice = await prisma.trusted_devices.findFirst({
      where: { user_id: matchedUserId, device_token_hash: deviceTokenHash, status: "active" },
    });

    if (!trustedDevice) {
      await logAttempt({
        deviceTokenHash,
        ip,
        success: false,
        matchedUserId,
        similarity: match.similarity,
        reason: "device_not_trusted",
      });
      return NextResponse.json({ error: NOT_ENABLED_ERROR }, { status: 403 });
    }

    const user = await prisma.users.findUnique({
      where: { id: matchedUserId },
      select: { id: true, name: true, email: true, role: true, is_active: true },
    });

    if (!user || !user.is_active) {
      await logAttempt({
        deviceTokenHash,
        ip,
        success: false,
        matchedUserId,
        similarity: match.similarity,
        reason: "user_inactive",
      });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const token = await signToken({
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await prisma.trusted_devices.update({
      where: { id: trustedDevice.id },
      data: { last_used_at: new Date() },
    });

    await logAttempt({
      deviceTokenHash,
      ip,
      success: true,
      matchedUserId,
      similarity: match.similarity,
      reason: "ok",
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: shouldUseSecureCookie(req.headers),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (error) {
    if (error instanceof TimeoutError || isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "La base de datos no respondio a tiempo. Verifica PostgreSQL y DATABASE_URL." },
        { status: 503 },
      );
    }

    console.error("Face login failed", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
