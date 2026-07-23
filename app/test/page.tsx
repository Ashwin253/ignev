import { getSiteContent } from "../lib/site-content";
import {
  fetchHomepageData,
  formatLaunchDate, isLaunched,
  formatPricing,
  type EvListing,
} from "../lib/wordpress";
import { fetchEvListingsFromSupabase, fetchHeroBanners } from "../lib/supabase";
import { Suspense } from "react";
import LoadingSkeleton from "../loading";
import dynamic from "next/dynamic";
const EcosystemSection = dynamic(() => import("../components/EcosystemSection"), {
  loading: () => <div className="h-96 bg-[#07130E]" />,
});

// ISR — revalidate every 5 minutes
export const revalidate = 300;


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
  return (
    <>

       <EcosystemSection updates={updates} listings={listings} banners={banners} />
 
    </>
  );
}
