const WATERMARK_URL = "/MarcaDeAgua_GDE.png";
const WATERMARK_ALPHA = 0.65;
const WATERMARK_RATIO = 0.30;
const WATERMARK_MAX_WIDTH_PX = 400;
const EXPORT_QUALITY = 0.92;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function applyWatermark(file: File): Promise<File> {
  try {
    const objectUrl = URL.createObjectURL(file);
    const [sourceImg, wmImg] = await Promise.all([
      loadImage(objectUrl),
      loadImage(WATERMARK_URL),
    ]);
    URL.revokeObjectURL(objectUrl);

    const canvas = document.createElement("canvas");
    canvas.width = sourceImg.naturalWidth;
    canvas.height = sourceImg.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.drawImage(sourceImg, 0, 0);

    const wmWidth = Math.min(sourceImg.naturalWidth * WATERMARK_RATIO, WATERMARK_MAX_WIDTH_PX);
    const wmHeight = wmWidth * (wmImg.naturalHeight / wmImg.naturalWidth);
    const padding = Math.round(sourceImg.naturalWidth * 0.025);
    const x = sourceImg.naturalWidth - wmWidth - padding;
    const y = sourceImg.naturalHeight - wmHeight - padding;

    ctx.globalAlpha = WATERMARK_ALPHA;
    ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
    ctx.globalAlpha = 1;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        file.type || "image/jpeg",
        EXPORT_QUALITY,
      );
    });

    return new File([blob], file.name, { type: file.type || "image/jpeg" });
  } catch (err) {
    console.warn("[watermark] Failed to apply watermark, using original file:", err);
    return file;
  }
}
