"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Armchair,
  BookOpen,
  Car,
  Dumbbell,
  Flower2,
  LayoutGrid,
  type LucideIcon,
  Package,
  Shirt,
  Smartphone,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  electronics: Smartphone,
  furniture: Armchair,
  clothing: Shirt,
  "home-garden": Flower2,
  "sports-outdoors": Dumbbell,
  vehicles: Car,
  books: BookOpen,
  other: Package,
};

const TABS = [{ slug: "all", label: "All" }, ...CATEGORIES];

/** Category filter. Selection lives in the URL (?category=<slug>). */
export function CategoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "all";
  const [active, setActive] = useOptimistic(current);
  const [, startTransition] = useTransition();

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") params.delete("category");
    else params.set("category", slug);
    const qs = params.toString();
    startTransition(() => {
      setActive(slug);
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  return <TabList active={active} onSelect={select} />;
}

export function CategoryTabsFallback() {
  return <TabList active="all" />;
}

function TabList({ active, onSelect }: { active: string; onSelect?: (slug: string) => void }) {
  return (
    <div
      role="group"
      aria-label="Categories"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const Icon = ICONS[tab.slug] ?? Package;
        const selected = tab.slug === active;
        return (
          <button
            key={tab.slug}
            type="button"
            aria-pressed={selected}
            disabled={!onSelect}
            onClick={() => onSelect?.(tab.slug)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
              selected
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-ink hover:bg-[#f2f3f5]",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
