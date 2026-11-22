import type { CATEGORIES } from "@/lib/categories";

export type Category = (typeof CATEGORIES)[number]["label"];
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  seller_email: string;
  image_url: string;
  created_at: string;
}

/** Fields shown on listing cards (no seller email on the grid). */
export type ListingSummary = Pick<
  Listing,
  "id" | "title" | "price" | "category" | "image_url" | "created_at"
>;

export interface Message {
  id: string;
  listing_id: string;
  buyer_email: string;
  seller_email: string;
  message: string;
  created_at: string;
}

/** Shape of every error body returned by the API routes. */
export interface ApiError {
  error: string;
  fieldErrors?: Record<string, string>;
}
