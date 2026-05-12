import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck, CalendarDays,
  Tag, Zap,
} from "lucide-react";
import {
  fetchEvListingsREST, fetchEvListingBySlugREST, fetchEvListingBySlug,
  formatLaunchDate, isLaunched,
} from "../../lib/wordpress";
import { getSiteContent } from "../../lib/site-content";
import ProductGallery from "../../components/ProductGallery";
import ProductMainUI from "../ProductMainUI";
import ProductOwnershipSection from "../ProductOwnershipSection";
import Image from "next/image";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const listings = await fetchEvListingsREST(200);
    if (listings.length) return listings.map((l) => ({ slug: l.slug }));
  } catch { /* fall through */ }
  const content = await getSiteContent();
  const all = [
    ...content.products.electric_cars,
    ...content.products.electric_two_wheelers,
    ...content.products.electric_autos,
  ];
  return all.map((item) => ({
    slug: `${item.brand}-${item.name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await fetchEvListingBySlug(slug);
  if (!item) return {};
  return {
    title: `${item.brand} ${item.title} | EVPULSE`,
    description: `${item.brand} ${item.title} — ${item.types[0] ?? "EV"}. Starting at ₹${item.prices.join("–")} lakh.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, allListings] = await Promise.all([
    fetchEvListingBySlugREST(slug),
    fetchEvListingsREST(100),
  ]);
  if (!item) notFound();

  const launched    = isLaunched(item.launchdate);
  const launchLabel = formatLaunchDate(item.launchdate);

  const photos = item.galleryImages.length > 0
    ? item.galleryImages
    : item.photo ? [item.photo] : [];

  const related = allListings
    .filter((l) => l.slug !== slug && (l.brand === item.brand || l.types[0] === item.types[0]))
    .slice(0, 3);

  return (
    <section className="min-h-screen bg-white py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-sky-600 transition-colors">Catalog</Link>
          <span>/</span>
          <span className="font-medium text-slate-900 line-clamp-1">{item.brand} {item.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">

          {/* ── Gallery ── */}
          <ProductGallery photos={photos} name={`${item.brand} ${item.title}`} />

          {/* ── Details Area ── */}
          <div className="flex flex-col gap-5">

            {/* Title + badges */}
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 mb-1">{item.brand}</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{item.title}</h1>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.types[0] && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    <Zap size={13} className="text-sky-500" />{item.types[0]}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                  launched ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {launched
                    ? <><BadgeCheck size={13} className="text-emerald-500" /> {launchLabel}</>
                    : <><CalendarDays size={13} /> {launchLabel}</>}
                </span>
              </div>
            </div>

            {/* Interactive Area (Battery Selection, Tabs, Ownership) */}
            <ProductMainUI item={item} slug={slug} />
          </div>
        </div>

        {/* ── Ownership — full width below the 2-col grid ── */}
        <ProductOwnershipSection item={item} />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-32">
            <h2 className="mb-8 text-2xl font-semibold text-slate-900">You might also like</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link key={rel.id} href={`/product/${rel.slug}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-all hover:-translate-y-0.5">
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                    {rel.photo && (
                      <Image src={rel.photo} alt={rel.title} fill sizes="33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{rel.brand}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{rel.title}</h3>
                    {rel.prices.length > 0 && <p className="mt-1 text-sm text-slate-500">₹{rel.prices.join("–")} lakh</p>}
                    <p className={`mt-1.5 text-xs font-medium ${isLaunched(rel.launchdate) ? "text-emerald-600" : "text-amber-600"}`}>
                      {formatLaunchDate(rel.launchdate)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
