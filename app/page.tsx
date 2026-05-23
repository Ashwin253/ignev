import { getSiteContent } from "./lib/site-content";
import {
  fetchHomepageData,
  formatLaunchDate, isLaunched,
  type EvListing,
} from "./lib/wordpress";
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
const WhyEVPULSE = dynamic(() => import("./components/WhyIgnev"), {
  loading: () => <div className="h-48" />,
});

// ISR — revalidate every 60 s
export const revalidate = 60;

function toComingSoonItem(l: EvListing): ComingSoonItem {
  return {
    name:    l.title,
    brand:   l.brand,
    type:    l.types[0] ?? "",
    pricing: l.prices.length ? `₹${l.prices.join("–")} lakh` : "",
    launch:  formatLaunchDate(l.launchdate),
    photo:   l.photo,
    slug:    l.slug,
  };
}

export default async function Home() {
  // Single GraphQL round-trip for all homepage data
  const [{ listings, banners, updates }, content] = await Promise.all([
    fetchHomepageData(),
    getSiteContent(),
  ]);

  const featured = listings.slice(0, 4);

  // Fresh releases: vehicles launched in the last 2 months
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const freshReleases = listings.filter((l) => {
    if (!l.launchdate) return false;
    const d = new Date(l.launchdate);
    return !isNaN(d.getTime()) && d <= new Date() && d >= twoMonthsAgo;
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
      <Hero products={content.products} featured={featured} freshReleases={freshReleases} banners={banners} />
      <FreshReleases listings={freshReleases} />
      <ComingSoonCars items={comingSoonItems} />
      <PopularBrands />
      <ElectricCore3D />
      <LatestUpdates updates={updates} />
      <WhyEVPULSE />
    </>
  );
}
