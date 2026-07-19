import React, { Suspense } from "react";
import { fetchEvListingsFromSupabase } from "../lib/supabase";
import { fetchHomepageData, formatPricing } from "../lib/wordpress";
import CatalogBrowser from "../components/CatalogBrowser";
import LogoLoader from "../components/LogoLoader";
import AutoLoadOfferModal from "../components/AutoLoadOfferModal";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const revalidate = 300;

export const metadata = {
  title: "New EV Launches | EVPULSE",
  description: "Browse the newest electric vehicles launched in the market recently.",
};

export default async function NewLaunchesPage() {
  let listings: any[] = [];

  try {
    const sbListings = await fetchEvListingsFromSupabase(100);
    if (sbListings.length) listings = sbListings;
  } catch { /* ignore and fallback */ }

  if (!listings.length) {
    try {
      const wpData = await fetchHomepageData();
      listings = wpData.listings;
    } catch { /* use empty */ }
  }

  // Map listings to CatalogItems
  const items = listings.map((l) => ({
    name: l.title,
    brand: l.brand,
    type: l.types?.[0] ?? "",
    pricing: formatPricing(l.prices),
    photo: l.photo,
    slug: l.slug,
    topSpeed: l.topSpeed,
    drivingRange: l.batteryVariants?.[0]?.range || "",
    commercial: l.commercial,
    usageType: (l as any).usage_type || "",
    launchdate: l.launchdate,
    prices: l.prices,
    baas: l.baas,
    video_links: l.video_links,
  }));

  return (
    <main className="min-h-screen pt-28 pb-20 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.1),_transparent_40%),linear-gradient(180deg,#fcfdfd_0%,#f0fdfa_100%)] text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 transition">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Buy/Sell Subcategory</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              New EV Launches
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-500">
              Browse the newest electric vehicles launched recently with detailed specifications.
            </p>
          </div>
        </div>

        {/* EV Catalog Component */}
        <Suspense fallback={<LogoLoader fullscreen={false} message="Loading catalog..." />}>
          <CatalogBrowser
            items={items}
            hideComingSoonToggle={true}
            forceNewLaunches={true}
          />
        </Suspense>
      </div>
      <AutoLoadOfferModal />
    </main>
  );
}
