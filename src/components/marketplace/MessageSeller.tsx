"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleCheck, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { LIMITS, validateMessage, type FieldErrors } from "@/lib/validations";
import type { ApiError } from "@/types/marketplace";

type Status = "idle" | "submitting" | "sent";

export function MessageSellerButton({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button type="button" className="btn-primary w-full py-2.5" onClick={() => setOpen(true)}>
        <MessageCircle className="size-5" aria-hidden />
        Message seller
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Click on the backdrop closes the dialog.
          if (e.target === e.currentTarget) setOpen(false);
        }}
        aria-labelledby="message-seller-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-ink shadow-xl backdrop:bg-black/50"
      >
        {open && (
          <MessageForm listingId={listingId} listingTitle={listingTitle} onClose={() => setOpen(false)} />
        )}
      </dialog>
    </>
  );
}

function MessageForm({
  listingId,
  listingTitle,
  onClose,
}: {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}) {
  const ids = { email: useId(), message: useId() };
  const [buyerEmail, setBuyerEmail] = useState("");
  const [message, setMessage] = useState(`Hi, is "${listingTitle}" still available?`);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const inFlight = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || status !== "idle") return; // no double submits

    const website = (new FormData(e.currentTarget).get("website") as string) ?? "";
    const check = validateMessage({ listingId, buyerEmail, message });
    if (!check.ok) {
      setErrors(check.errors);
      setFormError(check.errors.listingId ?? null);
      return;
    }

    inFlight.current = true;
    setStatus("submitting");
    setErrors({});
    setFormError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...check.data, website }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as ApiError | null;
        setErrors(body?.fieldErrors ?? {});
        setFormError(body?.error ?? "Your message could not be sent. Please try again.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setFormError("Network error. Check your connection and try again.");
      setStatus("idle");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 id="message-seller-title" className="text-lg font-bold">
          Message seller
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-9 place-items-center rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf]"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {status === "sent" ? (
        <div role="status" className="flex flex-col items-center px-6 py-8 text-center animate-fade-in">
          <span className="mb-3 grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <CircleCheck className="size-8" aria-hidden />
          </span>
          <p className="text-lg font-bold">Message sent!</p>
          <p className="mt-1 text-[15px] text-muted">
            The seller will reply to <strong className="text-ink">{buyerEmail}</strong>.
          </p>
          <button type="button" className="btn-secondary mt-6 w-full" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4 px-5 py-4">
          <p className="truncate text-sm text-muted">
            About: <span className="font-medium text-ink">{listingTitle}</span>
          </p>

          {formError && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <div>
            <label htmlFor={ids.email} className="field-label">
              Your email
            </label>
            <input
              id={ids.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={LIMITS.emailMax}
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              aria-invalid={Boolean(errors.buyerEmail)}
              aria-describedby={errors.buyerEmail ? `${ids.email}-error` : undefined}
              placeholder="you@example.com"
              className="field-input"
              autoFocus
            />
            {errors.buyerEmail && (
              <p id={`${ids.email}-error`} className="field-error">
                {errors.buyerEmail}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={ids.message} className="field-label">
              Message
            </label>
            <textarea
              id={ids.message}
              required
              rows={4}
              maxLength={LIMITS.messageMax}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${ids.message}-error` : undefined}
              className="field-input resize-y"
            />
            <div className="flex justify-between">
              {errors.message ? (
                <p id={`${ids.message}-error`} className="field-error">
                  {errors.message}
                </p>
              ) : (
                <span />
              )}
              <p className="mt-1.5 text-xs text-muted">
                {message.length}/{LIMITS.messageMax}
              </p>
            </div>
          </div>

          {/* Honeypot for bots; hidden from people and assistive tech. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <button type="submit" className="btn-primary w-full py-2.5" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden />
                Send message
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted">
            Your email is shared only with this seller so they can reply.
          </p>
        </form>
      )}
    </div>
  );
}
