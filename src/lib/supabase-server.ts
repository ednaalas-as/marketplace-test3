import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, MissingEnvError } from "@/lib/env";

export const LISTING_IMAGES_BUCKET = "listing-images";

/**
 * Privileged client using the service role key. It bypasses Row Level
 * Security, so it is only imported by server code ("server-only" makes the
 * build fail if a client component imports it) and only used for the one
 * operation the public may not do directly: writing to Storage after the
 * API route has validated the file.
 */
export function createServiceClient(): SupabaseClient {
  const { url } = getPublicSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new MissingEnvError("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
