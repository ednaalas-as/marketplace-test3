import "server-only";
import { type AllowedImageType, LIMITS } from "@/lib/validations";

/**
 * Detects the real image type from the file's first bytes, so a renamed
 * file (or a lying Content-Type) cannot slip through.
 */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  ) {
    return "image/webp";
  }
  return null;
}

export async function validateUploadedImage(
  file: FormDataEntryValue | null,
): Promise<{ ok: true; bytes: Uint8Array; type: AllowedImageType } | { ok: false; error: string }> {
  if (!file || typeof file === "string") return { ok: false, error: "Add a photo of your item." };
  if (file.size === 0) return { ok: false, error: "The photo is empty. Choose another one." };
  if (file.size > LIMITS.imageMaxBytes) {
    return { ok: false, error: "The photo must be 4 MB or smaller." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return { ok: false, error: "Use a JPG, PNG, or WebP image." };
  return { ok: true, bytes, type };
}
