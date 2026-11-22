import { categoryFromLabel } from "@/lib/categories";
import type { Category } from "@/types/marketplace";

/**
 * Validation shared by the browser (instant feedback) and the API routes
 * (the real gate). The database repeats the important rules as CHECK
 * constraints, so no path can skip them.
 */

export const LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMin: 10,
  descriptionMax: 2000,
  priceMax: 100_000_000,
  emailMax: 254,
  messageMax: 1000,
  /** Final upload size. Vercel rejects request bodies over 4.5 MB. */
  imageMaxBytes: 4 * 1024 * 1024,
  /** Largest original the browser will accept before resizing it down. */
  imageOriginalMaxBytes: 20 * 1024 * 1024,
} as const;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const IMAGE_EXTENSIONS: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEmail(value: string): boolean {
  return value.length <= LIMITS.emailMax && EMAIL_RE.test(value);
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export type FieldErrors = Record<string, string>;

export interface ListingInput {
  title: string;
  description: string;
  price: number;
  category: Category;
  sellerEmail: string;
}

export interface RawListingInput {
  title?: unknown;
  description?: unknown;
  price?: unknown;
  category?: unknown;
  sellerEmail?: unknown;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Parses a price like "1,250.50" or "40". Returns NaN when invalid. */
export function parsePrice(value: unknown): number {
  const raw = str(value).replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return Number.NaN;
  return Number(raw);
}

export function validateListing(
  raw: RawListingInput,
): { ok: true; data: ListingInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const title = str(raw.title);
  if (!title) errors.title = "Enter a title.";
  else if (title.length < LIMITS.titleMin)
    errors.title = `Title must be at least ${LIMITS.titleMin} characters.`;
  else if (title.length > LIMITS.titleMax)
    errors.title = `Title must be ${LIMITS.titleMax} characters or fewer.`;

  const description = str(raw.description);
  if (!description) errors.description = "Enter a description.";
  else if (description.length < LIMITS.descriptionMin)
    errors.description = `Description must be at least ${LIMITS.descriptionMin} characters.`;
  else if (description.length > LIMITS.descriptionMax)
    errors.description = `Description must be ${LIMITS.descriptionMax} characters or fewer.`;

  const priceText = str(raw.price);
  const price = parsePrice(raw.price);
  if (!priceText) errors.price = "Enter a price.";
  else if (Number.isNaN(price))
    errors.price = "Enter a valid amount, like 25 or 25.99.";
  else if (price <= 0) errors.price = "Price must be greater than 0.";
  else if (price > LIMITS.priceMax) errors.price = "That price is too high.";

  const categoryEntry = categoryFromLabel(str(raw.category));
  if (!categoryEntry) errors.category = "Choose a category.";

  const sellerEmail = str(raw.sellerEmail).toLowerCase();
  if (!sellerEmail) errors.sellerEmail = "Enter your email.";
  else if (!isValidEmail(sellerEmail)) errors.sellerEmail = "Enter a valid email address.";

  if (Object.keys(errors).length > 0 || !categoryEntry) return { ok: false, errors };

  return {
    ok: true,
    data: { title, description, price, category: categoryEntry.label, sellerEmail },
  };
}

export interface MessageInput {
  listingId: string;
  buyerEmail: string;
  message: string;
}

export function validateMessage(raw: {
  listingId?: unknown;
  buyerEmail?: unknown;
  message?: unknown;
}): { ok: true; data: MessageInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const listingId = str(raw.listingId);
  if (!isUuid(listingId)) errors.listingId = "This listing could not be found.";

  const buyerEmail = str(raw.buyerEmail).toLowerCase();
  if (!buyerEmail) errors.buyerEmail = "Enter your email.";
  else if (!isValidEmail(buyerEmail)) errors.buyerEmail = "Enter a valid email address.";

  const message = str(raw.message);
  if (!message) errors.message = "Write a message to the seller.";
  else if (message.length > LIMITS.messageMax)
    errors.message = `Message must be ${LIMITS.messageMax} characters or fewer.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { listingId, buyerEmail, message } };
}

/** Client-side check of a chosen photo, before any resizing. */
export function validateImageFile(file: File | null): string | null {
  if (!file) return "Add a photo of your item.";
  if (!isAllowedImageType(file.type)) return "Use a JPG, PNG, or WebP image.";
  if (file.size > LIMITS.imageOriginalMaxBytes) return "That photo is too large. Use one under 20 MB.";
  return null;
}

/** Strips characters that have meaning in PostgREST filter syntax. */
export function sanitizeSearch(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/[%_,.()*\\:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
