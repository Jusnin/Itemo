import { promises as fs } from "node:fs";
import path from "node:path";
import { PHOTO_DIR } from "@/lib/db";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Photo ids come from our own store, but this is a filesystem read — refuse
  // anything that isn't a plain id so a crafted URL can't walk out of the dir.
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return new Response("Bad id", { status: 400 });
  }

  for (const ext of Object.keys(TYPES)) {
    const file = path.join(PHOTO_DIR, `${id}${ext}`);
    try {
      const data = await fs.readFile(file);
      return new Response(new Uint8Array(data), {
        headers: {
          "Content-Type": TYPES[ext],
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // try the next extension
    }
  }

  return new Response("Not found", { status: 404 });
}
