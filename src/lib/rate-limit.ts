import "server-only";

/**
 * Small fixed-window rate limiter keyed by client IP.
 *
 * It lives in memory, so on Vercel each warm function instance keeps its own
 * counters. That is enough to blunt casual spam from a single client without
 * adding infrastructure; the database CHECK constraints and the Storage
 * bucket's size/type limits remain the hard guarantees.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 5000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
