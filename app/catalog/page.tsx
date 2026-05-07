import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import CatalogBrowser from "../components/CatalogBrowser";
import { fetchEvListings } from "../lib/wordpress";
import { getSiteContent } from "../lib/site-content";

// ISR — revalidate every 60 s
export const revalidate = 60;

export const metadata = {
  title: "EV Catalog | EVPULSE",
  description: "Browse all electric vehicles — cars, scooters, and autos — with real specs, pricing, and launch dates.",
};

export default async function CatalogPage() {
  // Try WP first; fall back to local JSON
  let items: import("../components/CatalogBrowser").CatalogItem[] = [];

  try {
    const listings = await fetchEvListings(200);
    if (listings.length) {
      items = listings.map((l) => ({
        name:       l.title,
        brand:      l.brand,
        type:       l.types[0] ?? "",
        pricing:    l.prices.length ? `₹${l.prices.join("–")} lakh` : "",
        photo:      l.photo,
        slug:       l.slug,
        topSpeed:   l.topSpeed,
        commercial: l.commercial,
        launchdate: l.launchdate,
        prices:     l.prices,
      }));
    }
  } catch {
    // WP unavailable — fall back to local JSON
  }

  if (!items.length) {
    const content = await getSiteContent();
    items = [
      ...content.products.electric_cars,
      ...content.products.electric_two_wheelers,
      ...content.products.electric_autos,
    ];
  }

  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              EV Catalog
            </h1>
            {/* <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Every listing is live from WordPress — specs, pricing, launch dates, pros and cons all in one place.
            </p> */}
          </div>

          {/* <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm shrink-0">
            <Zap size={15} className="text-sky-500" />
            {items.length} listings
          </div> */}
        </div>

        <CatalogBrowser items={items} />
      </div>
    </section>
  );
}
