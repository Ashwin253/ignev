import { Suspense } from "react";
import CatalogBrowser from "../components/CatalogBrowser";
import LogoLoader from "../components/LogoLoader";
import AutoLoadOfferModal from "../components/AutoLoadOfferModal";
import { Container, PageHero } from "../components/ui/kit";
import { getCatalogData } from "../lib/catalog-data";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

export const metadata = {
  title: "Upcoming EVs | EVPLSE",
  description: "Get a sneak peek at upcoming electric vehicles launching soon in the market.",
};

export default async function UpcomingPage() {
  const { items, brandRankings } = await getCatalogData();

  return (
    <main>
      <PageHero eyebrow="Coming soon" title="Upcoming electric vehicles." description="Anticipated specifications, expected prices and release dates of the EVs launching next." />
      <Container className="pb-24 pt-8">
        <Suspense fallback={<LogoLoader fullscreen={false} message="Loading catalog..." />}>
          <CatalogBrowser items={items} brandRankings={brandRankings} forceUpcoming />
        </Suspense>
      </Container>
      <AutoLoadOfferModal />
    </main>
  );
}
