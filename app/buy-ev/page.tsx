import { Suspense } from "react";
import CatalogBrowser from "../components/CatalogBrowser";
import LogoLoader from "../components/LogoLoader";
import AutoLoadOfferModal from "../components/AutoLoadOfferModal";
import { Container, PageHero } from "../components/ui/kit";
import { getCatalogData } from "../lib/catalog-data";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

export const metadata = {
  title: "Buy Electric Vehicles | EVPLSE",
  description: "Browse and buy electric vehicles. Filter by cars, bikes, scooters and commercial EVs.",
};

export default async function BuyEvPage() {
  const { items, brandRankings } = await getCatalogData();

  return (
    <main>
      <PageHero eyebrow="Buy" title="Buy an electric vehicle." description="Every launched electric vehicle on the market. Filter by brand, price and specs, then get the best offer." />
      <Container className="pb-24 pt-8">
        <Suspense fallback={<LogoLoader fullscreen={false} message="Loading catalog..." />}>
          <CatalogBrowser items={items} brandRankings={brandRankings} forceLaunched />
        </Suspense>
      </Container>
      <AutoLoadOfferModal />
    </main>
  );
}
