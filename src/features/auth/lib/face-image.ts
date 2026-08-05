export const MAX_FACE_IMAGE_BYTES = 5 * 1024 * 1024;

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png));base64,([a-zA-Z0-9+/]+=*)$/;

export type ParsedFaceImage = {
  bytes: Buffer;
  contentType: string;
};

/**
 * Valida y decodifica un data URL de imagen capturado en el navegador.
 * Nunca se persiste: solo se usa en memoria para llamar a Rekognition.
 */
export function parseFaceImageDataUrl(value: unknown): ParsedFaceImage | null {
  if (typeof value !== "string") return null;

  const match = DATA_URL_PATTERN.exec(value.trim());
  if (!match) return null;

  const [, contentType, base64] = match;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  if (bytes.length === 0 || bytes.length > MAX_FACE_IMAGE_BYTES) return null;

  return { bytes, contentType };
}
