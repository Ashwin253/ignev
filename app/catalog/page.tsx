import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CatalogBrowser from "../components/CatalogBrowser";
import { fetchEvListings, fetchEvListingsREST } from "../lib/wordpress";
import { fetchEvListingsFromSupabase } from "../lib/supabase";
import { getSiteContent } from "../lib/site-content";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

export const metadata = {
  title: "EV Catalog | EVPULSE",
  description: "Browse all electric vehicles — cars, scooters, and autos — with real specs, pricing, and launch dates.",
};

export default async function CatalogPage() {
  let items: import("../components/CatalogBrowser").CatalogItem[] = [];

  function formatPricing(prices: string[]): string {
    if (!prices.length) return "";
    // If the first entry already contains text like "Lakh", "₹", or words — show as-is
    const first = prices[0].trim();
    if (/[a-zA-Z]/.test(first) || first.includes("₹")) {
      return prices.length === 1 ? first : prices.join(" | ");
    }
    // Numeric entries — show "From lowest"
    const starts: number[] = [];
    for (const p of prices) {
      const cleaned = p.replace(/[₹,a-zA-Z\s]/g, "");
      const parts = cleaned.split(/[–-]/);
      for (const part of parts) {
        const num = parseFloat(part.trim());
        if (Number.isFinite(num) && num > 0) {
          starts.push(num > 1000 ? num / 100000 : num);
        }
      }
    }
    if (!starts.length) return first; // fallback to raw text
    const min = Math.min(...starts);
    const max = Math.max(...starts);
    const fmt = (v: number) => v % 1 === 0 ? String(v) : v.toFixed(2).replace(/\.?0+$/, "");
    if (min === max) return `₹${fmt(min)} Lakh`;
    return `₹${fmt(min)}–${fmt(max)} Lakh`;
  }

  // 1. Try Supabase first (fastest, most reliable)
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
        commercial: l.commercial,
        launchdate: l.launchdate,
        prices: l.prices,
        baas: l.baas,
      }));
    }
  } catch { /* Supabase failed or not configured */ }

  // 2. Fall back to WordPress if Supabase returned nothing
  if (!items.length) {
  try {
    const [gqlResult, restResult] = await Promise.allSettled([
      fetchEvListings(8),
      fetchEvListingsREST(8),
    ]);

    const listings = 
      (gqlResult.status === "fulfilled" && gqlResult.value.length > 0) ? gqlResult.value :
      (restResult.status === "fulfilled" && restResult.value.length > 0) ? restResult.value :
      [];

    if (listings.length) {
      items = listings.map((l) => ({
        name: l.title,
        brand: l.brand,
        type: l.types[0] ?? "",
        pricing: formatPricing(l.prices),
        photo: l.photo,
        slug: l.slug,
        topSpeed: l.topSpeed,
        commercial: l.commercial,
        launchdate: l.launchdate,
        prices: l.prices,
        baas: l.baas,
      }));
    }
  } catch { /* both failed */ }
  } // end WP fallback

  // Fall back to local JSON if nothing returned
  if (!items.length) {
    const content = await getSiteContent();
    items = [
      ...content.products.electric_cars,
      ...content.products.electric_two_wheelers,
      ...content.products.electric_autos,
    ];
  }
  console.log('[CatalogPage] Final items count:', items.length);
  if (!items.length) console.log('[CatalogPage] WP failed AND fallback empty');

  return (
    <section className="bg-white py-28">
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
