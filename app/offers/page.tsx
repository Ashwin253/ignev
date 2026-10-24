import React, { Suspense } from "react";
import { fetchOfferPages } from "../lib/wordpress";
import OffersMainUI from "./OffersMainUI";

export const metadata = {
  title: "EV Offers & Bank Discounts | EVPLSE",
  description: "Browse the latest electric vehicle offers, bank discounts, and city-wise promotions.",
};

export default async function OffersPage() {
  // Fetch promotional data from the dedicated OfferPage CPT
  const offers = await fetchOfferPages();

  return (
    <main className="min-h-screen bg-white pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <Suspense fallback={<OffersSkeleton />}>
          <OffersMainUI offers={offers} />
        </Suspense>

      </div>
    </main>
  );
}

function OffersSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="h-64 rounded-[2.5rem] bg-slate-100" />
      <div className="h-16 rounded-2xl bg-slate-50" />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="space-y-4">
            <div className="aspect-[16/9] rounded-3xl bg-slate-100" />
            <div className="h-6 w-3/4 rounded-lg bg-slate-100" />
            <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
