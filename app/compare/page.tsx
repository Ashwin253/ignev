import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";
import { fetchEvListingBySlugFromSupabase, fetchEvListingsFromSupabase } from "../lib/supabase";
import CompareMainUI from "./CompareMainUI";
import AddVehicleToCompare from "./AddVehicleToCompare";

export const metadata = {
  title: "Compare Vehicles | EVPULSE",
  description: "Compare electric vehicles side-by-side to find the perfect one for you.",
};

async function CompareContent({ slugs }: { slugs: string[] }) {
  // Fetch products from Supabase
  const products = await Promise.all(slugs.map(async (slug) => {
    return fetchEvListingBySlugFromSupabase(slug);
  }));

  // Fetch all listings for the "Add vehicle" dropdown
  const allListings = await fetchEvListingsFromSupabase(50);

  const filtered = products.filter((p): p is NonNullable<typeof p> => p !== null);

  const compactAll = allListings.map(l => ({
    slug: l.slug,
    title: l.title,
    brand: l.brand,
    photo: l.photo
  }));

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-10">
          <div className="absolute inset-0 animate-pulse rounded-full bg-sky-100 blur-3xl" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl border border-slate-100 text-sky-500">
            <GitCompare size={64} strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="text-4xl font-black text-slate-900">Compare your <span className="text-sky-600">Favorites</span></h2>
          <p className="text-center text-[11px] text-slate-400 font-medium pb-8 border-b border-slate-100 max-w-2xl mx-auto">
            * Prices and ownership estimates might change as per various reasons. 
            <span className="font-bold text-sky-600"> Please Enquire for updated details</span> and exact on-road pricing in your city.
          </p>
        <div className="mt-12 w-full max-w-md text-left">
           <AddVehicleToCompare allProducts={compactAll} currentSlugs={[]} />
        </div>
      </div>
    );
  }

  return <CompareMainUI products={filtered} allListings={compactAll} slugs={slugs} />;
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ slugs?: string }> }) {
  const { slugs: slugsRaw } = await searchParams;
  const slugs = slugsRaw ? slugsRaw.split(",") : [];

  return (
    <main className="min-h-screen bg-white pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors mb-4">
              <ArrowLeft size={14} /> Back to Catalog
            </Link>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Compare <span className="text-sky-600 text-glow">EVs</span>
            </h1>
            <p className="mt-2 text-slate-500">Side-by-side technical comparison and ownership analysis.</p>
          </div>
        </div>

        <Suspense fallback={<div className="py-24 text-center">Loading comparison...</div>}>
          <CompareContent slugs={slugs} />
        </Suspense>

        <div className="mt-16 rounded-3xl border border-slate-100 bg-slate-50/50 p-8 text-center backdrop-blur-sm">
          <p className="text-sm font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
            * Prices and ownership estimates might change as per various reasons including state subsidies, RTO charges, and insurance. 
            <span className="block mt-1 font-bold text-sky-600">Please Enquire for updated details and exact on-road pricing.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
