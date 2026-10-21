import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { PHOTO_DIR, id } from "@/lib/db";

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Accepts a downscaled JPEG from the client and stores it on disk. */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo supplied" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: `Unsupported image type: ${file.type}` }, { status: 415 });
  }

  const photoId = id("ph");
  await fs.mkdir(PHOTO_DIR, { recursive: true });
  await fs.writeFile(path.join(PHOTO_DIR, `${photoId}${ext}`), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ photoId });
}
