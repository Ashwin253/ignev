import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CatalogBrowser from "../components/CatalogBrowser";
import { fetchEvListingsFromSupabase } from "../lib/supabase";
import { formatPricing } from "../lib/wordpress";
import LogoLoader from "../components/LogoLoader";


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
        usageType: (l as any).usage_type || "",
        launchdate: l.launchdate,
        prices: l.prices,
        baas: l.baas,
        video_links: l.video_links,
      }));
    }
  } catch { /* Supabase failed or not configured */ }

  return (
    <section className="min-h-screen bg-white dark:bg-[#0f1115] text-zinc-900 dark:text-white py-28 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Ambient Glowing Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#34ebb1]/15 dark:bg-[#34ebb1]/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#34ebb1]/10 dark:bg-[#34ebb1]/5 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#10855f] dark:text-[#34ebb1] hover:text-[#0b6447] dark:hover:text-[#34ebb1]/80">
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
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

        <Suspense fallback={<LogoLoader fullscreen={false} message="Loading catalog..." />}>
          <CatalogBrowser items={items} />
        </Suspense>
      </div>
    </section>
  );
}
