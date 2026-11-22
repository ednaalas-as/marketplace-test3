import { Suspense } from "react";
import { CategoryTabs, CategoryTabsFallback } from "@/components/marketplace/CategoryTabs";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingGridSkeleton } from "@/components/marketplace/ListingGridSkeleton";
import { categoryFromSlug } from "@/lib/categories";
import { sanitizeSearch } from "@/lib/validations";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold leading-tight text-ink">Marketplace</h1>
        <p className="text-[15px] text-muted">Buy and sell everyday items with people near you.</p>
      </div>

      <div className="mb-6">
        <Suspense fallback={<CategoryTabsFallback />}>
          <CategoryTabs />
        </Suspense>
      </div>

      <Suspense fallback={<ListingGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  const category = categoryFromSlug(first(params.category));
  const query = sanitizeSearch(first(params.q));

  // A new key per filter makes the skeleton show while the next results load.
  return (
    <Suspense key={`${category?.slug ?? "all"}|${query}`} fallback={<ListingGridSkeleton />}>
      <ListingGrid category={category} query={query} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
