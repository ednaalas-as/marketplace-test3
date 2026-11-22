import "server-only";
import { createPublicClient } from "@/lib/supabase";
import { isUuid, sanitizeSearch } from "@/lib/validations";
import type { Category, Listing, ListingSummary } from "@/types/marketplace";

const SUMMARY_COLUMNS = "id, title, price, category, image_url, created_at";
const DETAIL_COLUMNS = "id, title, description, price, category, seller_email, image_url, created_at";
const PAGE_SIZE = 60;

export class DataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DataError";
  }
}

/** Postgres returns NUMERIC as a string; normalise it to a number. */
function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

export async function getListings(options: {
  category?: Category | null;
  query?: string | null;
}): Promise<ListingSummary[]> {
  const supabase = createPublicClient();
  let request = supabase
    .from("listings")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (options.category) request = request.eq("category", options.category);

  const term = sanitizeSearch(options.query);
  if (term) {
    request = request.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await request;
  if (error) throw new DataError("Could not load listings.", { cause: error });
  return (data ?? []).map((row) => ({ ...row, price: toNumber(row.price) })) as ListingSummary[];
}

/** Returns null for malformed IDs and for listings that do not exist. */
export async function getListing(id: string): Promise<Listing | null> {
  if (!isUuid(id)) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("listings")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new DataError("Could not load this listing.", { cause: error });
  if (!data) return null;
  return { ...data, price: toNumber(data.price) } as Listing;
}
