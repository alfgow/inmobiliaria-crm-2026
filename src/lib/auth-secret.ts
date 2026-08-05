const DEVELOPMENT_AUTH_SECRET = "dev-secret-change-me-in-production";

export function getAuthSecret(): Uint8Array {
  const authSecret = process.env.AUTH_SECRET?.trim();

  if (authSecret) {
    return new TextEncoder().encode(authSecret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return new TextEncoder().encode(DEVELOPMENT_AUTH_SECRET);
}
