import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

import { prisma } from "@/lib/prisma";
import { getPublicImageUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug requerido" }, { status: 400 });
  }

  const property = await prisma.inmuebles.findUnique({
    where: { slug },
    select: { id: true, titulo: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Inmueble no encontrado" }, { status: 404 });
  }

  const rawImages = await prisma.inmueble_imagenes.findMany({
    where: { inmueble_id: property.id.toString() },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { s3_key: true },
  });

  if (rawImages.length === 0) {
    return NextResponse.json({ error: "Este inmueble no tiene fotos" }, { status: 404 });
  }

  const zip = new JSZip();
  const folder = zip.folder("fotos") ?? zip;

  await Promise.all(
    rawImages.map(async (img, index) => {
      const url = getPublicImageUrl(img.s3_key);
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const buffer = await res.arrayBuffer();
        const ext = img.s3_key.split(".").pop()?.toLowerCase() ?? "jpg";
        const filename = `foto-${String(index + 1).padStart(3, "0")}.${ext}`;
        folder.file(filename, buffer);
      } catch {
        // skip images that fail to fetch
      }
    }),
  );

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const safeName = property.titulo.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 60);
  const filename = `fotos-${safeName}.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zipBuffer.byteLength),
    },
  });
}
