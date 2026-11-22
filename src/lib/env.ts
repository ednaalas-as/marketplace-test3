/**
 * Reads Supabase configuration and fails loudly when it is missing.
 * There are deliberately no fallback values: a misconfigured deployment
 * should show a clear error, not pretend to work.
 */

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(
      `Missing environment variable ${name}. Copy .env.example to .env.local ` +
        `(or add it in Vercel → Project → Settings → Environment Variables) and restart.`,
    );
    this.name = "MissingEnvError";
  }
}

export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  // Literal property access so Next.js can inline NEXT_PUBLIC_ values.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new MissingEnvError("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new MissingEnvError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey };
}
