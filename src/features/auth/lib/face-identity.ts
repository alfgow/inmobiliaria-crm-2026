const EXTERNAL_ID_PREFIX = "user_";

export function toExternalImageId(userId: bigint | string): string {
  return `${EXTERNAL_ID_PREFIX}${userId}`;
}

export function parseExternalImageId(externalImageId: string): bigint | null {
  if (!externalImageId.startsWith(EXTERNAL_ID_PREFIX)) return null;

  const idPart = externalImageId.slice(EXTERNAL_ID_PREFIX.length);
  if (!/^\d+$/.test(idPart)) return null;

  try {
    return BigInt(idPart);
  } catch {
    return null;
  }
}
