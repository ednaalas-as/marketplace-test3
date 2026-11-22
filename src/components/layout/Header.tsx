import Link from "next/link";
import { Suspense } from "react";
import { Plus, Store } from "lucide-react";
import { BrowseLink, HeaderNav } from "@/components/layout/HeaderNav";
import { SearchBar, SearchBarFallback } from "@/components/marketplace/SearchBar";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:flex-nowrap sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-lg text-brand"
          aria-label="Marketplace home"
        >
          <span className="grid size-10 place-items-center rounded-full bg-brand text-white">
            <Store className="size-5" aria-hidden />
          </span>
          <span className="text-xl font-bold tracking-tight">Marketplace</span>
        </Link>

        <div className="order-last w-full sm:order-none sm:mx-4 sm:max-w-md sm:flex-1">
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>

        <nav aria-label="Main" className="ml-auto flex items-center gap-1 sm:gap-2">
          <Suspense fallback={<BrowseLink />}>
            <HeaderNav />
          </Suspense>
          <Link href="/create" className="btn-primary px-3 sm:px-4">
            <Plus className="size-5" aria-hidden />
            <span className="hidden min-[400px]:inline">Create listing</span>
            <span className="sr-only min-[400px]:hidden">Create listing</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
