"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, X } from "lucide-react";

/** Shown on a listing's page right after it was created (?created=1). */
export function CreatedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || searchParams.get("created") !== "1") return null;

  return (
    <div
      role="status"
      className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-success animate-fade-in sm:mx-0"
    >
      <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="flex-1 text-[15px]">
        <strong className="font-semibold">Your listing is live!</strong> Buyers can now find it on
        Marketplace and message you.
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="grid size-7 place-items-center rounded-full hover:bg-success/10"
        onClick={() => {
          setDismissed(true);
          router.replace(pathname, { scroll: false });
        }}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
