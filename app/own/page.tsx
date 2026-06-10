import React, { Suspense } from "react";
import Link from "next/link";
import { fetchEvListingBySlugFromSupabase, fetchEvListingsFromSupabase } from "../lib/supabase";
import LoanCalculator from "../components/LoanCalculator";
import CostEstimator from "../components/CostEstimator";
import AddVehicleToCompare from "../compare/AddVehicleToCompare";
import { ArrowLeft, CarFront } from "lucide-react";

async function OwnContent({ slug }: { slug: string | undefined }) {
  const [listing, allListings] = await Promise.all([
    slug ? fetchEvListingBySlugFromSupabase(slug) : Promise.resolve(null),
    fetchEvListingsFromSupabase(100)
  ]);

  const compactAll = allListings.map(l => ({
    slug: l.slug,
    title: l.title,
    brand: l.brand,
    photo: l.photo
  }));

  const initialPrice = listing ? parseInt(listing.prices[0]) * 100000 : undefined;
  const efficiency = listing?.batteryVariants?.[0]?.range 
    ? (parseFloat(listing.batteryVariants[0].capacity) / parseFloat(listing.batteryVariants[0].range)) * 100 
    : undefined;

  return (
    <div className="space-y-12">
      {/* Vehicle Selection */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CarFront className="text-sky-400" />
              {listing ? listing.title : "Select a Vehicle"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {listing ? `Planning ownership for ${listing.brand} ${listing.title}` : "Pick a vehicle to get started with personalized estimates."}
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <AddVehicleToCompare allProducts={compactAll} currentSlugs={slug ? [slug] : []} targetPath="/own" />
          </div>
        </div>

        {listing && (
          <div className="flex items-center gap-4 pt-6 border-t border-white/5">
             <Link href={`/product/${listing.slug}`} className="text-xs font-bold text-sky-400 hover:underline">
               View {listing.title} Details
             </Link>
          </div>
        )}
      </div>

      {/* Calculators */}
      <div className="grid gap-8 lg:grid-cols-2">
        <LoanCalculator initialPrice={initialPrice} />
        <CostEstimator initialPrice={initialPrice} efficiency={efficiency} />
      </div>
    </div>
  );
}

export default async function OwnPage({ searchParams }: { searchParams: Promise<{ slugs?: string }> }) {
  // We reuse the 'slugs' param from compare or use a single one
  const { slugs } = await searchParams;
  const slug = slugs?.split(",")[0];

  return (
    <main className="min-h-screen bg-[#0b1220] pb-24 pt-28">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400 mb-3">Ownership Planner</p>
          <h1 className="text-4xl font-black text-white md:text-6xl max-w-4xl leading-[1.1]">
            Plan your <span className="text-sky-400 text-glow">Finance</span> & <span className="text-emerald-400 text-glow">Savings</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
            Personalized EMI calculations, state-wise running costs, and EV vs Fuel savings comparison in one place.
          </p>
        </div>

        <Suspense fallback={<div className="py-24 text-center text-white">Loading planner...</div>}>
          <OwnContent slug={slug} />
        </Suspense>

        <div className="mt-16 rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur text-center">
          <p className="text-xs text-slate-500">
            * Estimates are indicative. Loan rates depend on bank discretion and credit profile. Fuel prices are updated periodically based on state averages.
          </p>
        </div>
      </div>
    </main>
  );
}
