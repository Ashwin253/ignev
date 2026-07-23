import { getSiteContent } from "./lib/site-content";
import {
  fetchHomepageData,
  formatLaunchDate, isLaunched,
  formatPricing,
  type EvListing,
} from "./lib/wordpress";
import { fetchEvListingsFromSupabase, fetchHeroBanners } from "./lib/supabase";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Hero from "./components/Hero";
import FreshReleases from "./components/FreshReleases";
import type { ComingSoonItem } from "./components/ComingSoonCars";

const ComingSoonCars = dynamic(() => import("./components/ComingSoonCars"), {
  loading: () => <div className="h-64" />,
});
const PopularBrands = dynamic(() => import("./components/PopularBrands"), {
  loading: () => <div className="h-48" />,
});
const ElectricCore3D = dynamic(() => import("./components/ElectricCore3D"), {
  loading: () => <div className="h-64" />,
});
const LatestUpdates = dynamic(() => import("./components/LatestUpdates"), {
  loading: () => <div className="h-48" />,
});
const EcosystemSection = dynamic(() => import("./components/EcosystemSection"), {
  loading: () => <div className="h-96 bg-[#07130E]" />,
});
const WhyEVPULSE = dynamic(() => import("./components/WhyIgnev"), {
  loading: () => <div className="h-48" />,
});

// ISR — revalidate every 5 minutes
export const revalidate = 300;

function toComingSoonItem(l: EvListing): ComingSoonItem {
  return {
    name:    l.title,
    brand:   l.brand,
    type:    l.types[0] ?? "",
    pricing: l.prices.length ? formatPricing(l.prices) : "",
    launch:  formatLaunchDate(l.launchdate),
    photo:   l.photo,
    slug:    l.slug,
  };
}

import LoadingSkeleton from "./loading";
import LazyViewport from "./components/LazyViewport";

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  // Try Supabase first (fast), then WP as fallback
  let listings: EvListing[] = [];
  let banners: any[] = [];
  let updates: any[] = [];

  try {
    const sbListings = await fetchEvListingsFromSupabase(100);
    if (sbListings.length) listings = sbListings;

    const sbBanners = await fetchHeroBanners();
    if (sbBanners.length) banners = sbBanners;
  } catch { /* Supabase not configured or failed */ }

  // Fall back to WP if Supabase returned nothing
  if (!listings.length) {
    try {
      const wpData = await fetchHomepageData();
      listings = wpData.listings;
      banners = wpData.banners;
      updates = wpData.updates;
    } catch { /* WP also failed */ }
  } else {
    // Still fetch banners/updates from WP (Supabase doesn't have them yet)
    try {
      const wpData = await fetchHomepageData();
      if (!banners.length) banners = wpData.banners;
      updates = wpData.updates;
    } catch { /* use empty */ }
  }

  const content = await getSiteContent();
  const featured = listings.slice(0, 4);

  // New Releases: vehicles launched in the last 2 months
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const freshReleases = listings.filter((l) => {
    if (!l.launchdate) return false;
    const d = new Date(l.launchdate);
    return !isNaN(d.getTime()) && d <= new Date() && d >= twoMonthsAgo;
  }).slice(0, 8);

  // Upcoming Releases: vehicles launching in the next 2 months
  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  const upcoming = listings.filter((l) => {
    if (!l.launchdate) return false;
    const d = new Date(l.launchdate);
    return !isNaN(d.getTime()) && d > new Date() && d <= twoMonthsFromNow;
  }).slice(0, 8);

  const wpUpcoming: ComingSoonItem[] = listings
    .filter((l) => !isLaunched(l.launchdate))
    .slice(0, 8)
    .map(toComingSoonItem);

  const comingSoonItems: ComingSoonItem[] = wpUpcoming.length > 0
    ? wpUpcoming
    : [
        ...content.comingSoon.electric_cars.slice(0, 2),
        ...content.comingSoon.electric_two_wheelers.slice(0, 1),
        ...content.comingSoon.electric_autos.slice(0, 1),
      ].map((c) => ({ name: c.name, brand: c.brand, type: c.type, pricing: c.pricing, launch: c.launch, photo: c.photo }));

  return (
    <>
      {/* <Hero products={content.products} listings={listings} freshReleases={freshReleases} upcoming={upcoming} banners={banners} /> */}

       <EcosystemSection updates={updates} listings={listings} banners={banners} />
{/*       
      <LazyViewport fallback={<div className="h-48" />}>
        <PopularBrands />
      </LazyViewport>
      
      <LazyViewport fallback={<div className="h-64" />}>
        <ElectricCore3D />
      </LazyViewport>
      
      <LazyViewport fallback={<div className="h-48" />}>
        <LatestUpdates updates={updates} />
      </LazyViewport> */}
    </>
  );
}
