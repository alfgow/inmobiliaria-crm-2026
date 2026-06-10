import { NextResponse } from "next/server";

import { getUploadUrl } from "@/lib/s3";

export async function POST(request: Request) {
  const body = (await request.json()) as { key?: string; contentType?: string };
  const { key, contentType } = body;

  if (!key || !contentType) {
    return NextResponse.json({ error: "Missing key or contentType" }, { status: 400 });
  }

  if (!key.startsWith("inmuebles/") || !/^image\//.test(contentType)) {
    return NextResponse.json({ error: "Invalid key or contentType" }, { status: 400 });
  }

  const url = await getUploadUrl(key, contentType);
  return NextResponse.json({ url, key });
}
