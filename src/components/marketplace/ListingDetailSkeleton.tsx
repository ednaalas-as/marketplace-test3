export function ListingDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading listing"
      className="animate-pulse overflow-hidden bg-white sm:card lg:grid lg:grid-cols-[minmax(0,1fr)_400px]"
    >
      <div className="aspect-square w-full bg-[#e4e6eb] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[560px]" />
      <div className="flex flex-col gap-3 p-4 sm:p-6">
        <div className="h-7 w-4/5 rounded bg-[#e4e6eb]" />
        <div className="h-6 w-1/3 rounded bg-[#e4e6eb]" />
        <div className="h-4 w-1/4 rounded bg-[#e4e6eb]" />
        <div className="mt-2 h-11 w-full rounded-lg bg-[#e4e6eb]" />
        <div className="mt-4 h-4 w-full rounded bg-[#e4e6eb]" />
        <div className="h-4 w-11/12 rounded bg-[#e4e6eb]" />
        <div className="h-4 w-2/3 rounded bg-[#e4e6eb]" />
      </div>
      <span className="sr-only">Loading listing…</span>
    </div>
  );
}
