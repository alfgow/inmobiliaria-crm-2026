export function shouldUseSecureCookie(headers: Headers): boolean {
  const host = headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return false;
  }

  return (
    headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production"
  );
}

export function getRequestIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return forwardedFor || headers.get("x-real-ip")?.trim() || null;
}
