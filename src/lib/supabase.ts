import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env";

/**
 * Supabase client that uses the public anon key. Every query it makes is
 * subject to Row Level Security, so it is safe anywhere. In this app it is
 * used on the server for reads and for inserts that RLS allows.
 */
export function createPublicClient(): SupabaseClient {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
