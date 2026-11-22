import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatRelative } from "@/lib/utils";
import type { ListingSummary } from "@/types/marketplace";

export function ListingCard({ listing, now, priority }: { listing: ListingSummary; now: number; priority?: boolean }) {
  return (
    <Link
      href={`/item/${listing.id}`}
      className="group block rounded-xl outline-offset-4"
      aria-label={`${listing.title}, ${formatPrice(listing.price)}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line/60 bg-[#e4e6eb]">
        <Image
          src={listing.image_url}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="px-0.5 pt-2">
        <p className="text-[17px] font-bold leading-snug text-ink">{formatPrice(listing.price)}</p>
        <h3 className="line-clamp-2 text-[15px] leading-snug text-ink group-hover:underline">{listing.title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {listing.category} · {formatRelative(listing.created_at, now)}
        </p>
      </div>
    </Link>
  );
}
