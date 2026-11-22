import "server-only";
import { formatPrice } from "@/lib/utils";
import type { Listing } from "@/types/marketplace";

/**
 * Seller notifications through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Email is optional: without RESEND_API_KEY the message is still saved in
 * Supabase and the API reports that no email went out. A failed send never
 * fails the request, because the message is already stored.
 */

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 8000;

export type EmailResult = { sent: true } | { sent: false; reason: "not_configured" | "failed" };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function notifySeller(options: {
  listing: Pick<Listing, "id" | "title" | "price" | "seller_email">;
  buyerEmail: string;
  message: string;
  siteUrl: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "not_configured" };
  const from = process.env.EMAIL_FROM || "Marketplace <onboarding@resend.dev>";

  const { listing, buyerEmail, message, siteUrl } = options;
  const listingUrl = `${siteUrl}/item/${listing.id}`;
  const price = formatPrice(listing.price);
  // Keep the subject on one line and a sensible length.
  const subjectTitle = listing.title.replace(/[\r\n]+/g, " ").slice(0, 80);

  const text = [
    `You have a new message about your listing "${listing.title}" (${price}).`,
    "",
    `From: ${buyerEmail}`,
    "",
    message,
    "",
    `Reply to this email to answer the buyer directly.`,
    `View your listing: ${listingUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f0f2f5;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#050505">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1877f2">Marketplace</p>
    <div style="background:#fff;border:1px solid #dadde1;border-radius:12px;padding:20px">
      <p style="margin:0 0 4px;font-size:15px;color:#65676b">New message about your listing</p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:700">${escapeHtml(listing.title)} · ${escapeHtml(price)}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#65676b">From <a href="mailto:${escapeHtml(buyerEmail)}" style="color:#1877f2">${escapeHtml(buyerEmail)}</a></p>
      <div style="white-space:pre-wrap;font-size:15px;line-height:1.5;background:#f0f2f5;border-radius:8px;padding:12px 14px">${escapeHtml(message)}</div>
      <p style="margin:16px 0 0;font-size:14px;color:#65676b">Reply to this email to answer the buyer directly.</p>
      <p style="margin:16px 0 0"><a href="${escapeHtml(listingUrl)}" style="display:inline-block;background:#1877f2;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:8px">View listing</a></p>
    </div>
  </div>
</body></html>`;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [listing.seller_email],
        reply_to: buyerEmail,
        subject: `New message about "${subjectTitle}"`,
        text,
        html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[email] Resend rejected the email", res.status, await res.text().catch(() => ""));
      return { sent: false, reason: "failed" };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] could not reach Resend", err);
    return { sent: false, reason: "failed" };
  }
}
