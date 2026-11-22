import Link from "next/link";
import { SearchX } from "lucide-react";
import { StateMessage } from "@/components/ui/StateMessage";

export default function ListingNotFound() {
  return (
    <div className="px-4 py-12">
      <StateMessage
        icon={SearchX}
        title="This listing isn't available"
        actions={
          <Link href="/" className="btn-primary">
            Browse Marketplace
          </Link>
        }
      >
        The link may be broken, or the listing may have been removed.
      </StateMessage>
    </div>
  );
}
