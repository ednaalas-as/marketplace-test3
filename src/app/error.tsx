"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { RetryButton } from "@/components/ui/RetryButton";
import { StateMessage } from "@/components/ui/StateMessage";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 py-12">
      <StateMessage
        icon={TriangleAlert}
        tone="danger"
        title="Something went wrong"
        actions={
          <>
            <RetryButton onRetry={retry} />
            <Link href="/" className="btn-secondary">
              Go home
            </Link>
          </>
        }
      >
        An unexpected error occurred. Please try again.
      </StateMessage>
    </div>
  );
}
