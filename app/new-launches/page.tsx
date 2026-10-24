import { Suspense } from "react";
import CatalogBrowser from "../components/CatalogBrowser";
import LogoLoader from "../components/LogoLoader";
import AutoLoadOfferModal from "../components/AutoLoadOfferModal";
import { Container, PageHero } from "../components/ui/kit";
import { getCatalogData } from "../lib/catalog-data";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

export const metadata = {
  title: "New EV Launches | EVPLSE",
  description: "Browse the newest electric vehicles launched in the market recently.",
};

export default async function NewLaunchesPage() {
  const { items, brandRankings } = await getCatalogData();

  return (
    <main>
      <PageHero eyebrow="Just launched" title="New EV launches." description="The newest electric vehicles to hit the market, with detailed specifications." />
      <Container className="pb-24 pt-8">
        <Suspense fallback={<LogoLoader fullscreen={false} message="Loading catalog..." />}>
          <CatalogBrowser items={items} brandRankings={brandRankings} forceNewLaunches />
        </Suspense>
      </Container>
      <AutoLoadOfferModal />
    </main>
  );
}
