"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { prepareImageForUpload } from "@/lib/resize-image";
import { LIMITS, validateImageFile, validateListing, type FieldErrors } from "@/lib/validations";
import type { ApiError } from "@/types/marketplace";

type Status = "idle" | "preparing" | "submitting" | "success";

export function CreateListingForm() {
  const router = useRouter();
  const ids = {
    image: useId(),
    title: useId(),
    price: useId(),
    category: useId(),
    description: useId(),
    email: useId(),
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [values, setValues] = useState({
    title: "",
    price: "",
    category: "",
    description: "",
    sellerEmail: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  // Release the object URL used for the preview.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => omit(e, key));
  }

  function onFileChosen(chosen: File | null) {
    if (!chosen) return;
    const problem = validateImageFile(chosen);
    if (problem) {
      setErrors((e) => ({ ...e, image: problem }));
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setErrors((e) => omit(e, "image"));
    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
  }

  function removePhoto() {
    setFile(null);
    setPreviewUrl(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || status !== "idle") return; // no double submits

    const website = (new FormData(e.currentTarget).get("website") as string) ?? "";
    const check = validateListing(values);
    const imageProblem = validateImageFile(file);
    const nextErrors: FieldErrors = { ...(check.ok ? {} : check.errors) };
    if (imageProblem) nextErrors.image = imageProblem;
    if (!check.ok || imageProblem || !file) {
      setErrors(nextErrors);
      setFormError("Please fix the highlighted fields.");
      focusFirstError(nextErrors);
      return;
    }

    inFlight.current = true;
    setErrors({});
    setFormError(null);

    try {
      setStatus("preparing");
      let upload: File;
      try {
        upload = await prepareImageForUpload(file);
      } catch (err) {
        setErrors({ image: err instanceof Error ? err.message : "Could not read that photo." });
        setStatus("idle");
        return;
      }

      setStatus("submitting");
      const body = new FormData();
      body.set("image", upload);
      body.set("title", check.data.title);
      body.set("description", check.data.description);
      body.set("price", String(check.data.price));
      body.set("category", check.data.category);
      body.set("sellerEmail", check.data.sellerEmail);
      body.set("website", website);

      const res = await fetch("/api/listings", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as ({ id?: string } & Partial<ApiError>) | null;

      if (!res.ok || !json?.id) {
        const fieldErrors = json?.fieldErrors ?? {};
        setErrors(fieldErrors);
        setFormError(json?.error ?? "Your listing could not be published. Please try again.");
        setStatus("idle");
        focusFirstError(fieldErrors);
        return;
      }

      setStatus("success");
      router.push(`/item/${json.id}?created=1`);
    } catch {
      setFormError("Network error. Check your connection and try again.");
      setStatus("idle");
    } finally {
      inFlight.current = false;
    }
  }

  function focusFirstError(errs: FieldErrors) {
    const order: Array<[string, string]> = [
      ["image", ids.image],
      ["title", ids.title],
      ["price", ids.price],
      ["category", ids.category],
      ["description", ids.description],
      ["sellerEmail", ids.email],
    ];
    const first = order.find(([key]) => errs[key]);
    if (first) document.getElementById(first[1])?.focus();
  }

  const busy = status !== "idle";

  if (status === "success") {
    return (
      <div role="status" className="card flex flex-col items-center px-6 py-12 text-center animate-fade-in">
        <span className="mb-3 grid size-14 place-items-center rounded-full bg-success-soft text-success">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <p className="text-xl font-bold">Listing published!</p>
        <p className="mt-1 flex items-center gap-2 text-[15px] text-muted">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Opening your listing…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-4 sm:p-6" aria-busy={busy}>
      {formError && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
          {formError}
        </p>
      )}

      {/* Photo */}
      <div>
        <span className="field-label" id={`${ids.image}-label`}>
          Photo
        </span>
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-line bg-[#18191a]">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={previewUrl} alt="Preview of your listing photo" className="mx-auto max-h-80 w-full object-contain" />
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="btn bg-white/95 px-3 py-1.5 text-sm text-ink shadow hover:bg-white"
              >
                <RefreshCw className="size-4" aria-hidden />
                Replace
              </button>
              <button
                type="button"
                onClick={removePhoto}
                disabled={busy}
                aria-label="Remove photo"
                className="btn bg-white/95 px-2.5 py-1.5 text-ink shadow hover:bg-white"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFileChosen(e.dataTransfer.files?.[0] ?? null);
            }}
            aria-describedby={`${ids.image}-hint${errors.image ? ` ${ids.image}-error` : ""}`}
            data-invalid={errors.image ? "true" : undefined}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface/60 px-4 py-10 text-center transition-colors hover:border-brand hover:bg-brand-soft/50 data-[invalid=true]:border-danger"
          >
            <span className="grid size-12 place-items-center rounded-full bg-[#e4e6eb] text-ink">
              <ImagePlus className="size-6" aria-hidden />
            </span>
            <span className="text-[15px] font-semibold text-ink">Add photo</span>
            <span id={`${ids.image}-hint`} className="text-sm text-muted">
              JPG, PNG or WebP · click or drag and drop
            </span>
          </button>
        )}
        <input
          ref={fileInput}
          id={ids.image}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-labelledby={`${ids.image}-label`}
          onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
        />
        {errors.image && (
          <p id={`${ids.image}-error`} className="field-error">
            {errors.image}
          </p>
        )}
      </div>

      {/* Title */}
      <Field id={ids.title} label="Title" error={errors.title}>
        <input
          id={ids.title}
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={LIMITS.titleMax}
          placeholder="What are you selling?"
          className="field-input"
          {...errorProps(ids.title, errors.title)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Price */}
        <Field id={ids.price} label="Price (USD)" error={errors.price}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">$</span>
            <input
              id={ids.price}
              type="text"
              inputMode="decimal"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
              className="field-input pl-7"
              {...errorProps(ids.price, errors.price)}
            />
          </div>
        </Field>

        {/* Category */}
        <Field id={ids.category} label="Category" error={errors.category}>
          <select
            id={ids.category}
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className="field-input appearance-auto"
            {...errorProps(ids.category, errors.category)}
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Description */}
      <Field
        id={ids.description}
        label="Description"
        error={errors.description}
        hint={`${values.description.length}/${LIMITS.descriptionMax}`}
      >
        <textarea
          id={ids.description}
          rows={5}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={LIMITS.descriptionMax}
          placeholder="Describe the condition, size, brand, pickup details…"
          className="field-input resize-y"
          {...errorProps(ids.description, errors.description)}
        />
      </Field>

      {/* Seller email */}
      <Field
        id={ids.email}
        label="Your email"
        error={errors.sellerEmail}
        hint="Shown on your listing so buyers can contact you."
      >
        <input
          id={ids.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.sellerEmail}
          onChange={(e) => set("sellerEmail", e.target.value)}
          maxLength={LIMITS.emailMax}
          placeholder="you@example.com"
          className="field-input"
          {...errorProps(ids.email, errors.sellerEmail)}
        />
      </Field>

      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            {status === "preparing" ? "Preparing photo…" : "Publishing…"}
          </>
        ) : (
          "Publish listing"
        )}
      </button>
    </form>
  );
}

function omit(errors: FieldErrors, key: string): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}

function errorProps(id: string, error: string | undefined) {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : `${id}-hint`,
  };
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
