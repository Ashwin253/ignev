import { Suspense } from "react";
import CatalogBrowser from "../components/CatalogBrowser";
import LogoLoader from "../components/LogoLoader";
import AutoLoadOfferModal from "../components/AutoLoadOfferModal";
import { Container, PageHero } from "../components/ui/kit";
import { getCatalogData } from "../lib/catalog-data";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

export const metadata = {
  title: "EV Catalog | EVPLSE",
  description: "Browse all electric vehicles — cars, scooters, bikes and commercial EVs — with real specs, pricing, and launch dates.",
};

export default async function CatalogPage() {
  const { items, brandRankings } = await getCatalogData();

  return (
    <main>
      <PageHero eyebrow="Catalog" title="Every electric vehicle, in one place." description="Real specs, honest pricing and launch dates for electric cars, scooters, bikes and commercial vehicles." />
      <Container className="pb-24 pt-8">
        <Suspense fallback={<LogoLoader fullscreen={false} message="Loading catalog..." />}>
          <CatalogBrowser items={items} brandRankings={brandRankings} />
        </Suspense>
      </Container>
      
    </main>
  );
}
