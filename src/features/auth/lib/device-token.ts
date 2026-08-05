import { createHash, randomBytes } from "crypto";

export const DEVICE_COOKIE = "crm_device";
export const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function generateDeviceToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashDeviceToken(token) };
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido";

  const os = /Windows/.test(userAgent)
    ? "Windows"
    : /Mac OS X/.test(userAgent)
      ? "macOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /iPhone|iPad/.test(userAgent)
          ? "iOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "dispositivo desconocido";

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Navegador";

  return `${browser} en ${os}`;
}
