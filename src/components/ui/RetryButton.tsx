"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCw } from "lucide-react";

export function RetryButton({ onRetry, label = "Try again" }: { onRetry?: () => void; label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-primary"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          if (onRetry) onRetry();
          else router.refresh();
        })
      }
    >
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <RotateCw className="size-4" aria-hidden />
      )}
      {label}
    </button>
  );
}
