const WATERMARK_URL = "/MarcaDeAgua_GDE.png";
const WATERMARK_ALPHA = 0.50;
const EXPORT_QUALITY = 0.92;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
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

    // Scale watermark to cover the full image maintaining aspect ratio (cover strategy)
    const imgW = sourceImg.naturalWidth;
    const imgH = sourceImg.naturalHeight;
    const wmAspect = wmImg.naturalWidth / wmImg.naturalHeight;
    const imgAspect = imgW / imgH;

    let wmWidth: number;
    let wmHeight: number;
    if (wmAspect > imgAspect) {
      wmWidth = imgW;
      wmHeight = imgW / wmAspect;
    } else {
      wmHeight = imgH;
      wmWidth = imgH * wmAspect;
    }

    const x = (imgW - wmWidth) / 2;
    const y = (imgH - wmHeight) / 2;

    ctx.save();
    ctx.globalAlpha = WATERMARK_ALPHA;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
    ctx.restore();

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
