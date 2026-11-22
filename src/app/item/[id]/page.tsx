import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { cache } from "react";
import { ArrowLeft, CalendarDays, Mail, Tag } from "lucide-react";
import { CreatedBanner } from "@/components/marketplace/CreatedBanner";
import { ListingDetailSkeleton } from "@/components/marketplace/ListingDetailSkeleton";
import { MessageSellerButton } from "@/components/marketplace/MessageSeller";
import { categoryFromLabel } from "@/lib/categories";
import { getListing } from "@/lib/listings";
import { formatDate, formatPrice, formatRelative } from "@/lib/utils";

// One database read per request, shared by generateMetadata and the page.
const loadListing = cache(getListing);

export async function generateMetadata({ params }: PageProps<"/item/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await loadListing(id);
    if (!listing) return { title: "Listing not found" };
    return {
      title: listing.title,
      description: listing.description.slice(0, 160),
      openGraph: { images: [listing.image_url] },
    };
  } catch {
    return { title: "Listing" };
  }
}

export default function ItemPage({ params }: PageProps<"/item/[id]">) {
  return (
    <div className="mx-auto max-w-6xl px-0 sm:px-6 sm:py-6">
      <Link
        href="/"
        className="mx-4 my-3 inline-flex items-center gap-1.5 rounded-md text-[15px] font-semibold text-muted hover:text-ink sm:mx-0 sm:mt-0"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to Marketplace
      </Link>
      <Suspense fallback={null}>
        <CreatedBanner />
      </Suspense>
      <Suspense fallback={<ListingDetailSkeleton />}>
        <ListingDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ListingDetail({ params }: { params: PageProps<"/item/[id]">["params"] }) {
  const { id } = await params;
  await connection();

  // Throws on database errors → handled by item/[id]/error.tsx.
  const listing = await loadListing(id);
  if (!listing) notFound();

  const category = categoryFromLabel(listing.category);

  return (
    <article className="overflow-hidden bg-white sm:card lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="relative aspect-square w-full bg-[#18191a] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
        <Image
          src={listing.image_url}
          alt={listing.title}
          fill
          priority
          sizes="(min-width: 1024px) 700px, 100vw"
          className="object-contain"
        />
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-ink break-words">{listing.title}</h1>
          <p className="mt-1 text-[22px] font-semibold text-ink">{formatPrice(listing.price)}</p>
          <p className="mt-1 text-sm text-muted">
            Listed {formatRelative(listing.created_at)}
          </p>
        </div>

        <MessageSellerButton listingId={listing.id} listingTitle={listing.title} />

        <section aria-labelledby="details-heading" className="border-t border-line pt-4">
          <h2 id="details-heading" className="mb-3 text-[17px] font-bold text-ink">
            Details
          </h2>
          <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[15px]">
            <dt className="flex items-center gap-2 text-muted">
              <Tag className="size-4" aria-hidden /> Category
            </dt>
            <dd>
              {category ? (
                <Link href={`/?category=${category.slug}`} className="font-medium text-brand hover:underline">
                  {listing.category}
                </Link>
              ) : (
                listing.category
              )}
            </dd>
            <dt className="flex items-center gap-2 text-muted">
              <CalendarDays className="size-4" aria-hidden /> Posted
            </dt>
            <dd>
              <time dateTime={listing.created_at}>{formatDate(listing.created_at)}</time>
            </dd>
          </dl>
          <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-ink">
            {listing.description}
          </p>
        </section>

        <section aria-labelledby="seller-heading" className="border-t border-line pt-4">
          <h2 id="seller-heading" className="mb-2 text-[17px] font-bold text-ink">
            Seller information
          </h2>
          <p className="flex items-center gap-2 text-[15px] text-ink">
            <Mail className="size-4 shrink-0 text-muted" aria-hidden />
            <a href={`mailto:${listing.seller_email}`} className="break-all text-brand hover:underline">
              {listing.seller_email}
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
