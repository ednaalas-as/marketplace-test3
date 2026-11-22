import { LIMITS } from "@/lib/validations";

const MAX_DIMENSION = 2000;

/**
 * Phone photos are often larger than the 4 MB upload limit. When a photo is
 * too big (in bytes or pixels), re-encode it in the browser as a WebP/JPEG
 * no larger than 2000px on its longest side. Small photos pass through.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file doesn't look like a valid image. Try another photo.");
  }

  const { width, height } = bitmap;
  const tooLarge = file.size > LIMITS.imageMaxBytes;
  const tooWide = Math.max(width, height) > MAX_DIMENSION;
  if (!tooLarge && !tooWide) {
    bitmap.close();
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    if (tooLarge) throw new Error("The photo must be 4 MB or smaller.");
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.75, 0.6]) {
    const blob = await toBlob(canvas, "image/webp", quality) ?? (await toBlob(canvas, "image/jpeg", quality));
    if (blob && blob.size <= LIMITS.imageMaxBytes) {
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const base = file.name.replace(/\.[^.]+$/, "") || "photo";
      return new File([blob], `${base}.${ext}`, { type: blob.type });
    }
  }
  throw new Error("The photo must be 4 MB or smaller.");
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob && blob.type === type ? blob : null), type, quality),
  );
}
