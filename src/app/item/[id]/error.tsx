"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CloudOff } from "lucide-react";
import { RetryButton } from "@/components/ui/RetryButton";
import { StateMessage } from "@/components/ui/StateMessage";

export default function ListingError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 py-12">
      <StateMessage
        icon={CloudOff}
        tone="danger"
        title="We couldn't load this listing"
        actions={
          <>
            <RetryButton onRetry={retry} />
            <Link href="/" className="btn-secondary">
              Back to Marketplace
            </Link>
          </>
        }
      >
        Something went wrong while contacting the database. Please try again.
      </StateMessage>
    </div>
  );
}
