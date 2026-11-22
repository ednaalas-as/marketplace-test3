import { jsonError, serverError, tooManyRequests } from "@/lib/api";
import { getListing } from "@/lib/listings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createPublicClient } from "@/lib/supabase";
import { validateMessage } from "@/lib/validations";

/**
 * POST /api/messages (application/json)
 * Body: { listingId, buyerEmail, message }
 *
 * The seller email is never taken from the client: it is copied from the
 * listing here, and a database trigger enforces the same rule.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`message:${clientIp(request)}`, { limit: 10, windowMs: 10 * 60_000 });
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Send the message as JSON.");
  }
  if (!body || typeof body !== "object") return jsonError(400, "Send the message as JSON.");

  if (typeof body.website === "string" && body.website !== "") {
    return jsonError(400, "Your message could not be sent.");
  }

  const result = validateMessage(body);
  if (!result.ok) {
    return jsonError(422, "Please fix the highlighted fields.", { fieldErrors: result.errors });
  }

  try {
    const listing = await getListing(result.data.listingId);
    if (!listing) return jsonError(404, "This listing no longer exists.");

    const { error } = await createPublicClient().from("messages").insert({
      listing_id: listing.id,
      buyer_email: result.data.buyerEmail,
      seller_email: listing.seller_email,
      message: result.data.message,
    });
    if (error) throw error;

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return serverError("POST /api/messages", err);
  }
}
