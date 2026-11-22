/**
 * Predefined listing categories. `label` is what is stored in the database
 * (and enforced by a CHECK constraint in supabase-schema.sql); `slug` is
 * what appears in URLs such as /?category=home-garden.
 */
export const CATEGORIES = [
  { slug: "electronics", label: "Electronics" },
  { slug: "furniture", label: "Furniture" },
  { slug: "clothing", label: "Clothing" },
  { slug: "home-garden", label: "Home & Garden" },
  { slug: "sports-outdoors", label: "Sports & Outdoors" },
  { slug: "vehicles", label: "Vehicles" },
  { slug: "books", label: "Books" },
  { slug: "other", label: "Other" },
] as const;

export type CategoryEntry = (typeof CATEGORIES)[number];

export function categoryFromSlug(slug: string | null | undefined): CategoryEntry | null {
  if (!slug) return null;
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function categoryFromLabel(label: string | null | undefined): CategoryEntry | null {
  if (!label) return null;
  return CATEGORIES.find((c) => c.label === label) ?? null;
}
