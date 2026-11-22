"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderNav() {
  const pathname = usePathname();
  return <BrowseLink active={pathname === "/"} />;
}

export function BrowseLink({ active = false }: { active?: boolean }) {
  return (
    <Link
      href="/"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors",
        active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface",
      )}
    >
      <House className="size-5" aria-hidden />
      <span className="hidden md:inline">Browse all</span>
      <span className="sr-only md:hidden">Browse all</span>
    </Link>
  );
}
