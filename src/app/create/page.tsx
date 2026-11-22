import type { Metadata } from "next";
import { CreateListingForm } from "@/components/marketplace/CreateListingForm";

export const metadata: Metadata = {
  title: "Create listing",
  description: "Sell an item on Marketplace.",
};

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-[28px] font-bold leading-tight text-ink">Create listing</h1>
      <p className="mb-5 text-[15px] text-muted">
        Add a photo and a few details. Your listing goes live as soon as you publish it.
      </p>
      <CreateListingForm />
    </div>
  );
}
