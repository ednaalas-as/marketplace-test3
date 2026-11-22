import { jsonError, serverError } from "@/lib/api";
import { getListing } from "@/lib/listings";
import { isUuid } from "@/lib/validations";

/** GET /api/listings/:id */
export async function GET(_request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(400, "That is not a valid listing ID.");

  try {
    const listing = await getListing(id);
    if (!listing) return jsonError(404, "Listing not found.");
    return Response.json({ listing });
  } catch (err) {
    return serverError(`GET /api/listings/${id}`, err);
  }
}
