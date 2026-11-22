import "server-only";
import { MissingEnvError } from "@/lib/env";
import type { ApiError } from "@/types/marketplace";

export function jsonError(
  status: number,
  error: string,
  extra?: { fieldErrors?: Record<string, string>; headers?: HeadersInit },
): Response {
  const body: ApiError = { error, ...(extra?.fieldErrors ? { fieldErrors: extra.fieldErrors } : {}) };
  return Response.json(body, { status, headers: extra?.headers });
}

/** Logs the real cause on the server, returns a safe message to the client. */
export function serverError(context: string, err: unknown): Response {
  console.error(`[api] ${context}`, err);
  if (err instanceof MissingEnvError) {
    return jsonError(500, "The marketplace is not configured yet. Please try again later.");
  }
  return jsonError(500, "Something went wrong on our side. Please try again.");
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return jsonError(429, "You're doing that too often. Please wait a moment and try again.", {
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}
