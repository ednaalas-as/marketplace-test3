import Link from "next/link";
import { connection } from "next/server";
import { CloudOff, PackageOpen, Plus, SearchX } from "lucide-react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { GRID_CLASSES } from "@/components/marketplace/ListingGridSkeleton";
import { RetryButton } from "@/components/ui/RetryButton";
import { StateMessage } from "@/components/ui/StateMessage";
import { MissingEnvError } from "@/lib/env";
import { getListings } from "@/lib/listings";
import type { CategoryEntry } from "@/lib/categories";
import { requestTime } from "@/lib/utils";
import type { ListingSummary } from "@/types/marketplace";

/** Fetches listings from Supabase at request time and renders the grid. */
export async function ListingGrid({ category, query }: { category: CategoryEntry | null; query: string }) {
  await connection();

  let listings: ListingSummary[];
  try {
    listings = await getListings({ category: category?.label, query });
  } catch (err) {
    console.error("[home] failed to load listings", err);
    return (
      <StateMessage
        icon={CloudOff}
        tone="danger"
        title="We couldn't load listings"
        actions={<RetryButton />}
      >
        {err instanceof MissingEnvError
          ? "The marketplace database isn't configured yet."
          : "Check your connection and try again."}
      </StateMessage>
    );
  }

  const filtered = Boolean(category || query);

  if (listings.length === 0) {
    if (filtered) {
      const clearHref = query && category ? `/?category=${category.slug}` : "/";
      return (
        <StateMessage
          icon={SearchX}
          title="No results found"
          actions={
            <>
              <Link href={clearHref} className="btn-secondary" scroll={false}>
                {query ? "Clear search" : "Show all categories"}
              </Link>
              <Link href="/create" className="btn-primary">
                <Plus className="size-4" aria-hidden />
                Create listing
              </Link>
            </>
          }
        >
          {query ? (
            <>
              Nothing matches <strong className="text-ink">“{query}”</strong>
              {category ? ` in ${category.label}` : ""}. Try different keywords.
            </>
          ) : (
            <>There are no listings in {category?.label} yet.</>
          )}
        </StateMessage>
      );
    }

    return (
      <StateMessage
        icon={PackageOpen}
        title="No listings yet"
        actions={
          <Link href="/create" className="btn-primary">
            <Plus className="size-4" aria-hidden />
            Create the first listing
          </Link>
        }
      >
        Be the first to sell something on Marketplace.
      </StateMessage>
    );
  }

  const now = requestTime();
  const heading = query
    ? `Results for “${query}”${category ? ` in ${category.label}` : ""}`
    : category
      ? category.label
      : "Today's picks";

  return (
    <section aria-labelledby="results-heading" className="animate-fade-in">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="results-heading" className="truncate text-lg font-bold text-ink">
          {heading}
        </h2>
        <p className="shrink-0 text-sm text-muted" aria-live="polite">
          {listings.length} {listings.length === 1 ? "listing" : "listings"}
        </p>
      </div>
      <div className={GRID_CLASSES}>
        {listings.map((listing, i) => (
          <ListingCard key={listing.id} listing={listing} now={now} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}
