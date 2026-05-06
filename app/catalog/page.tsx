import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

import CatalogBrowser from "../components/CatalogBrowser";
import { getSiteContent } from "../lib/site-content";

export default async function CatalogPage() {
  const content = await getSiteContent();
  const items = [
    ...content.products.electric_cars,
    ...content.products.electric_two_wheelers,
    ...content.products.electric_autos,
  ];

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
              Catalog
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              This page reads from the same content source as the homepage, so switching from local JSON to WordPress GraphQL will update both automatically.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
            <CalendarDays size={16} className="text-sky-500" />
            {items.length} listings available
          </div>
        </div>

        <CatalogBrowser items={items} />
      </div>
    </section>
  );
}
