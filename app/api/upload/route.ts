import { NextResponse } from "next/server";

import { uploadObject } from "@/lib/s3";

export async function POST(request: Request) {
  const formData = await request.formData();
  const key = String(formData.get("key") ?? "");
  const contentType = String(formData.get("contentType") ?? "");
  const file = formData.get("file");

  if (!key || !contentType || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing key, contentType or file" }, { status: 400 });
  }

  if (!key.startsWith("inmuebles/") || !/^image\//.test(contentType)) {
    return NextResponse.json({ error: "Invalid key or contentType" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadObject(key, buffer, contentType);
    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error("upload route error:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}
