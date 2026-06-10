import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CatalogBrowser from "../components/CatalogBrowser";
import { fetchEvListingsFromSupabase } from "../lib/supabase";
import { formatPricing } from "../lib/wordpress";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

export const metadata = {
  title: "EV Catalog | EVPULSE",
  description: "Browse all electric vehicles — cars, scooters, and autos — with real specs, pricing, and launch dates.",
};

export default async function CatalogPage() {
  let items: import("../components/CatalogBrowser").CatalogItem[] = [];

  // 1. Fetch from Supabase (fastest, most reliable)
  try {
    const sbListings = await fetchEvListingsFromSupabase(50);
    if (sbListings.length) {
      items = sbListings.map((l) => ({
        name: l.title,
        brand: l.brand,
        type: l.types[0] ?? "",
        pricing: formatPricing(l.prices),
        photo: l.photo,
        slug: l.slug,
        topSpeed: l.topSpeed,
        drivingRange: l.batteryVariants[0]?.range || "",
        commercial: l.commercial,
        launchdate: l.launchdate,
        prices: l.prices,
        baas: l.baas,
      }));
    }
  } catch { /* Supabase failed or not configured */ }

  return (
    <section className="bg-slate-100 py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              EV Catalog
            </h1>
            {/* <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Every listing is live from WordPress — specs, pricing, launch dates, pros and cons all in one place.
            </p> */}
          </div>

          {/* <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm shrink-0">
            <Zap size={15} className="text-sky-500" />
            {items.length} listings
          </div> */}
        </div>

        <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-400 font-medium">Loading catalog...</div>}>
          <CatalogBrowser items={items} />
        </Suspense>
      </div>
    </section>
  );
}
