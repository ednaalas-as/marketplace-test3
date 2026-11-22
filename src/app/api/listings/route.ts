import { randomUUID } from "node:crypto";
import { jsonError, serverError, tooManyRequests } from "@/lib/api";
import { categoryFromSlug } from "@/lib/categories";
import { validateUploadedImage } from "@/lib/images";
import { getListings } from "@/lib/listings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createPublicClient } from "@/lib/supabase";
import { createServiceClient, LISTING_IMAGES_BUCKET } from "@/lib/supabase-server";
import { IMAGE_EXTENSIONS, validateListing } from "@/lib/validations";

/** GET /api/listings?category=<slug>&q=<keywords> */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("category");
  const category = categoryFromSlug(slug);
  if (slug && slug !== "all" && !category) {
    return jsonError(400, "Unknown category.");
  }

  try {
    const listings = await getListings({ category: category?.label, query: searchParams.get("q") });
    return Response.json({ listings });
  } catch (err) {
    return serverError("GET /api/listings", err);
  }
}

/**
 * POST /api/listings (multipart/form-data)
 * Fields: image, title, description, price, category, sellerEmail
 *
 * Validates everything, uploads the photo to Supabase Storage, then inserts
 * the listing. If the insert fails, the uploaded photo is removed again.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`create:${clientIp(request)}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 4.5 * 1024 * 1024) {
    return jsonError(413, "The photo must be 4 MB or smaller.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Send the listing as a form upload.");
  }

  // Honeypot: real users never see or fill this field.
  if (typeof form.get("website") === "string" && form.get("website") !== "") {
    return jsonError(400, "Your listing could not be created.");
  }

  const result = validateListing({
    title: form.get("title"),
    description: form.get("description"),
    price: form.get("price"),
    category: form.get("category"),
    sellerEmail: form.get("sellerEmail"),
  });
  const image = await validateUploadedImage(form.get("image"));

  if (!result.ok || !image.ok) {
    const fieldErrors = {
      ...(result.ok ? {} : result.errors),
      ...(image.ok ? {} : { image: image.error }),
    };
    return jsonError(422, "Please fix the highlighted fields.", { fieldErrors });
  }

  let uploadedPath: string | null = null;
  try {
    const admin = createServiceClient();
    const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${IMAGE_EXTENSIONS[image.type]}`;

    const { error: uploadError } = await admin.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(path, image.bytes, { contentType: image.type, cacheControl: "31536000", upsert: false });
    if (uploadError) throw uploadError;
    uploadedPath = path;

    const { data: publicUrl } = admin.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(path);

    // Insert with the anon client so Row Level Security and the CHECK
    // constraints apply exactly as they would to any public client.
    const { data, error } = await createPublicClient()
      .from("listings")
      .insert({
        title: result.data.title,
        description: result.data.description,
        price: result.data.price,
        category: result.data.category,
        seller_email: result.data.sellerEmail,
        image_url: publicUrl.publicUrl,
      })
      .select("id")
      .single();
    if (error) throw error;

    return Response.json({ id: data.id }, { status: 201 });
  } catch (err) {
    if (uploadedPath) {
      await createServiceClient()
        .storage.from(LISTING_IMAGES_BUCKET)
        .remove([uploadedPath])
        .catch(() => undefined);
    }
    return serverError("POST /api/listings", err);
  }
}
