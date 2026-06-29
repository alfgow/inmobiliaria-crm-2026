import { createHash, randomBytes } from "crypto";

const API_KEY_PREFIX = "crm";

export function generateApiKey() {
  const prefix = randomBytes(6).toString("base64url").slice(0, 10);
  const secret = randomBytes(32).toString("base64url");
  const key = `${API_KEY_PREFIX}_${prefix}_${secret}`;

  return {
    key,
    prefix,
    keyHash: hashApiKey(key),
  };
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function getApiKeyFromHeaders(headers: Headers) {
  const authorization = headers.get("authorization")?.trim();

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return headers.get("x-api-key")?.trim() ?? null;
}

export function getRequestIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    forwardedFor ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    null
  );
}

