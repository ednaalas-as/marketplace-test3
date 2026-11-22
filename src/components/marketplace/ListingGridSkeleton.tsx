export const GRID_CLASSES =
  "grid grid-cols-1 gap-x-3 gap-y-6 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function ListingGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading listings">
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-[#e4e6eb]" />
      <div className={GRID_CLASSES}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-xl bg-[#e4e6eb]" />
            <div className="mt-2.5 h-4 w-1/3 rounded bg-[#e4e6eb]" />
            <div className="mt-2 h-3.5 w-4/5 rounded bg-[#e4e6eb]" />
            <div className="mt-2 h-3 w-1/2 rounded bg-[#e4e6eb]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading listings…</span>
    </div>
  );
}
