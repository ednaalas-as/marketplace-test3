"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

const DEBOUNCE_MS = 400;

/**
 * Keyword search. The query lives in the URL (?q=), so results are
 * shareable and the server does the filtering against Supabase.
 * Typing on the homepage searches as you type; pressing Enter on any other
 * page takes you to the homepage results.
 */
export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the box in sync when the URL changes (back button, clear, tabs).
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setValue(urlQuery);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function navigate(next: string) {
    const params = new URLSearchParams(pathname === "/" ? searchParams.toString() : "");
    const trimmed = next.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  function onChange(next: string) {
    setValue(next);
    if (pathname !== "/") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (next.trim() !== urlQuery) navigate(next);
    }, DEBOUNCE_MS);
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setValue("");
    if (urlQuery) navigate("");
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        navigate(value);
      }}
      className="relative"
    >
      <label htmlFor="marketplace-search" className="sr-only">
        Search Marketplace
      </label>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
        {isPending ? (
          <LoaderCircle className="size-[18px] animate-spin" aria-hidden />
        ) : (
          <Search className="size-[18px]" aria-hidden />
        )}
      </span>
      <input
        id="marketplace-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Marketplace"
        autoComplete="off"
        maxLength={80}
        enterKeyHint="search"
        className="h-10 w-full rounded-full bg-surface pl-10 pr-10 text-[15px] text-ink outline-none placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-brand/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute inset-y-0 right-2 my-auto grid size-7 place-items-center rounded-full text-muted hover:bg-line/60"
          aria-label="Clear search"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {isPending ? "Searching…" : ""}
      </span>
    </form>
  );
}

export function SearchBarFallback() {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
        <Search className="size-[18px]" aria-hidden />
      </span>
      <input
        type="search"
        disabled
        placeholder="Search Marketplace"
        aria-label="Search Marketplace"
        className="h-10 w-full rounded-full bg-surface pl-10 pr-4 text-[15px]"
      />
    </div>
  );
}
