/**
 * Phone cameras produce 12MP files. Sending one is slow and no more accurate
 * than ~1100px, which is also close to the resolution Claude reasons over.
 */
const MAX_EDGE = 1100;
const QUALITY = 0.85;

export interface Downscaled {
  blob: Blob;
  base64: string;
  previewUrl: string;
}

export async function downscale(file: File): Promise<Downscaled> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      QUALITY,
    );
  });

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return { blob, base64: dataUrl.split(",")[1], previewUrl: dataUrl };
}
