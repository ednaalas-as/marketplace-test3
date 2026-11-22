import Link from "next/link";
import { Compass } from "lucide-react";
import { StateMessage } from "@/components/ui/StateMessage";

export default function NotFound() {
  return (
    <div className="px-4 py-12">
      <StateMessage
        icon={Compass}
        title="Page not found"
        actions={
          <Link href="/" className="btn-primary">
            Browse Marketplace
          </Link>
        }
      >
        We couldn&apos;t find the page you were looking for.
      </StateMessage>
    </div>
  );
}
