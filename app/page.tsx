import { getSiteContent } from "./lib/site-content";
import { fetchWPUpdates, fetchEvListings, fetchHeroBanners, formatLaunchDate, isLaunched, type EvListing } from "./lib/wordpress";
import Hero from "./components/Hero";
import PopularBrands from "./components/PopularBrands";
import ElectricCore3D from "./components/ElectricCore3D";
import ComingSoonCars, { type ComingSoonItem } from "./components/ComingSoonCars";
import WhyEVPULSE from "./components/WhyIgnev";
import LatestUpdates from "./components/LatestUpdates";

// ISR — revalidate every 60 s so the build never blocks on a live network call
export const revalidate = 60;

/** Map a WP EvListing with a future launchdate to the ComingSoonItem shape */
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
  const [content, updates, allListings, banners] = await Promise.all([
    getSiteContent(),
    fetchWPUpdates(3),
    fetchEvListings(100),
    fetchHeroBanners(),
  ]);

  // Featured = latest 4 from WP (any status)
  const featured = allListings.slice(0, 4);

  // Coming soon = WP listings with a future launchdate, up to 8
  const wpUpcoming: ComingSoonItem[] = allListings
    .filter((l) => !isLaunched(l.launchdate))
    .slice(0, 8)
    .map(toComingSoonItem);

  // Fall back to local comingsoon.json if WP has no upcoming listings
  const comingSoonItems: ComingSoonItem[] = wpUpcoming.length > 0
    ? wpUpcoming
    : [
        ...content.comingSoon.electric_cars.slice(0, 2),
        ...content.comingSoon.electric_two_wheelers.slice(0, 1),
        ...content.comingSoon.electric_autos.slice(0, 1),
      ].map((c) => ({
        name:    c.name,
        brand:   c.brand,
        type:    c.type,
        pricing: c.pricing,
        launch:  c.launch,
        photo:   c.photo,
      }));

  return (
    <>
      <Hero products={content.products} featured={featured} banners={banners} />
      <ComingSoonCars items={comingSoonItems} />
      <PopularBrands />
      <ElectricCore3D />
      <LatestUpdates updates={updates} />
      <WhyEVPULSE />
    </>
  );
}
