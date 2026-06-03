import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck, CalendarDays, Zap,
} from "lucide-react";
import {
  fetchEvListingsREST, fetchEvListingBySlugREST, fetchEvListingBySlug,
  formatLaunchDate, isLaunched,
} from "../../lib/wordpress";
import { fetchEvListingBySlugFromSupabase } from "../../lib/supabase";
import ProductGallery from "../../components/ProductGallery";
import ProductMainUI from "../ProductMainUI";
import ProductDetails from "../ProductDetails";
import { ProductSelectionProvider } from "../ProductSelectionProvider";
import Image from "next/image";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Don't pre-render at build time — WP can't handle concurrent requests.
  // Pages will be generated on-demand (ISR) on first visit.
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const item = await fetchEvListingBySlug(slug);
    if (!item) return { title: "EVPULSE" };
    return {
      title: `${item.brand} ${item.title} | EVPULSE`,
      description: `${item.brand} ${item.title} — ${item.types[0] ?? "EV"}. Starting at ₹${item.prices[0] || ""} Lakh.`,
    };
  } catch {
    return { title: "EVPULSE" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Try Supabase first, then WP
  let item = await fetchEvListingBySlugFromSupabase(slug);
  if (!item) item = await fetchEvListingBySlugREST(slug);
  if (!item) notFound();

  const launched    = isLaunched(item.launchdate);
  const launchLabel = formatLaunchDate(item.launchdate);

  const photos = item.galleryImages.length > 0
    ? item.galleryImages
    : item.photo ? [item.photo] : [];

  // Fetch related items lazily — small request, only 10 items
  let related: typeof item[] = [];
  try {
    const few = await fetchEvListingsREST(10);
    related = few
      .filter((l) => l.slug !== slug && (l.brand === item.brand || l.types[0] === item.types[0]))
      .slice(0, 3);
  } catch { /* skip related if WP is down */ }

  return (
    <section className="min-h-screen bg-slate-100 py-28 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-hidden">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-sky-600 transition-colors">Catalog</Link>
          <span>/</span>
          <span className="font-medium text-slate-900 line-clamp-1">{item.brand} {item.title}</span>
        </nav>

        <ProductSelectionProvider item={item}>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">

          {/* ── Gallery (with built-in color + photo buttons) ── */}
          <div className="min-w-0 overflow-hidden">
            <ProductGallery photos={photos} name={`${item.brand} ${item.title}`} colors={item.colors} />
          </div>

          {/* ── Details Area ── */}
          <div className="flex flex-col gap-5">

            {/* Title + badges */}
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 mb-1">{item.brand}</p>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{item.title}</h1>
                <div className="flex flex-col gap-1 ml-auto shrink-0">
                  {item.types[0] && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      <Zap size={10} className="text-sky-500" />{item.types[0]}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    launched ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-amber-100 border-amber-300 text-amber-800"
                  }`}>
                    {launched
                      ? <><BadgeCheck size={10} className="text-emerald-500" /> {launchLabel}</>
                      : <><CalendarDays size={10} /> {launchLabel}</>}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Area (Battery Selection, Tabs, Ownership) */}
            <ProductMainUI item={item} slug={slug} />
          </div>
        </div>
        {/* ── Detailed Specs + Pros/Cons ── */}
        <ProductDetails item={item} />
        </ProductSelectionProvider>
{/* ── Ownership — full width below the 2-col grid ── */}
        {/* <ProductOwnershipSection item={item} /> */}

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-32">
            <h2 className="mb-8 text-2xl font-semibold text-slate-900">You might also like</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link key={rel.id} href={`/product/${rel.slug}`}
                  className="group overflow-hidden rounded-3xl border-2 border-slate-300 bg-slate-50 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5">
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                    {rel.photo && (
                      <Image src={rel.photo} alt={rel.title} fill sizes="33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{rel.brand}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{rel.title}</h3>
                    {rel.prices.length > 0 && <p className="mt-1 text-sm text-slate-500">₹{rel.prices[0]} Lakh</p>}
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
