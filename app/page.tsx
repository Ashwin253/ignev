import { getSiteContent } from "./lib/site-content";
import { fetchWPUpdates, fetchEvListings, type EvListing } from "./lib/wordpress";
import Hero from "./components/Hero";
import PopularBrands from "./components/PopularBrands";
import ElectricCore3D from "./components/ElectricCore3D";
import ComingSoonCars from "./components/ComingSoonCars";
import WhyEVPULSE from "./components/WhyIgnev";
import LatestUpdates from "./components/LatestUpdates";

// ISR — revalidate every 60 s so the build never blocks on a live network call
export const revalidate = 60;

export default async function Home() {
  const [content, updates, featured] = await Promise.all([
    getSiteContent(),
    fetchWPUpdates(3),
    fetchEvListings(4),
  ]);

  return (
    <>
      <Hero products={content.products} featured={featured} />
      <ComingSoonCars comingSoon={{ coming_soon: content.comingSoon }} />
      <PopularBrands />
      <ElectricCore3D />
      <LatestUpdates updates={updates} />
      <WhyEVPULSE />
    </>
  );
}
