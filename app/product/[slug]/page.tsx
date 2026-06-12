import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck, CalendarDays, Zap,
} from "lucide-react";
import { ProductSkeleton } from "../../components/ProductSkeleton";
import { SmoothCollapseEmptyState } from "../../components/SmoothCollapse";
import {
  formatLaunchDate, isLaunched, formatPricing,
} from "../../lib/wordpress";
import { fetchEvListingBySlugFromSupabase, fetchEvListingsFromSupabase } from "../../lib/supabase";
import ProductGallery from "../../components/ProductGallery";
import ProductMainUI from "../ProductMainUI";
import { ProductSelectionProvider } from "../ProductSelectionProvider";
import dynamic from "next/dynamic";

const ProductDetailsSkeleton = () => (
  <div className="mt-16 rounded-3xl border-2 border-slate-300 bg-slate-100 px-5 py-8 md:px-10 md:py-10 shadow-sm animate-pulse">
    <div className="flex justify-center mb-5">
      <div className="h-8 w-48 bg-slate-300 rounded-lg"></div>
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[60px] w-full bg-slate-200 rounded-2xl border-2 border-slate-300"></div>
      ))}
    </div>
  </div>
);

const ProductDetails = dynamic(() => import("../ProductDetails"), {
  loading: () => <ProductDetailsSkeleton />,
});
import Image from "next/image";
import { Suspense } from "react";

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
    const item = await fetchEvListingBySlugFromSupabase(slug);
    if (!item) return { title: "EVPULSE" };
    return {
      title: `${item.brand} ${item.title} | EVPULSE`,
      description: `${item.brand} ${item.title} — ${item.types[0] ?? "EV"}. Starting at ${formatPricing(item.prices)}.`,
    };
  } catch {
    return { title: "EVPULSE" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch from Supabase
  let item = await fetchEvListingBySlugFromSupabase(slug);
  if (!item) notFound();

  const launched    = isLaunched(item.launchdate);
  const launchLabel = formatLaunchDate(item.launchdate);

  const photos = item.galleryImages.length > 0
    ? item.galleryImages
    : item.photo ? [item.photo] : [];



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
            <ProductGallery photos={photos} name={`${item.brand} ${item.title}`} colors={item.colors} item={item} />
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
        <Suspense fallback={
          <div className="mt-32">
            <h2 className="mb-8 text-2xl font-semibold text-slate-900">More like this</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </div>
          </div>
        }>
          <RelatedListings slug={slug} currentItem={item} />
        </Suspense>
      </div>
    </section>
  );
}

async function RelatedListings({ slug, currentItem }: { slug: string; currentItem: any }) {
  let related: any[] = [];
  try {
    const allSupabase = await fetchEvListingsFromSupabase(50);
    
    const targetPrice = currentItem.prices[0] ? parseFloat(currentItem.prices[0].replace(/[^\d.]/g, "")) : null;

    related = allSupabase
      .filter((l) => {
        if (l.slug === slug) return false;
        if (l.types[0] === currentItem.types[0] && currentItem.types[0]) return true;
        if (l.brand === currentItem.brand && currentItem.brand) return true;
        if (targetPrice && l.prices[0]) {
          const p = parseFloat(l.prices[0].replace(/[^\d.]/g, ""));
          if (!isNaN(p) && Math.abs(p - targetPrice) / targetPrice <= 0.2) return true;
        }
        return false;
      })
      .slice(0, 3);
  } catch { /* skip related if DB is down */ }

  if (related.length === 0) {
    return (
      <SmoothCollapseEmptyState>
        <div className="mt-32">
          <h2 className="mb-8 text-2xl font-semibold text-slate-900">More like this</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ProductSkeleton />
            <ProductSkeleton />
            <ProductSkeleton />
          </div>
        </div>
      </SmoothCollapseEmptyState>
    );
  }

  return (
    <div className="mt-32">
      <h2 className="mb-8 text-2xl font-semibold text-slate-900">More like this</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((rel) => (
          <Link key={rel.id} href={`/product/${rel.slug}`}
            className="group flex flex-col h-full overflow-hidden rounded-3xl border-2 border-slate-300 bg-slate-50 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5">
            <div className="relative aspect-4/3 overflow-hidden bg-slate-100 shrink-0">
              {rel.photo && (
                <Image src={rel.photo} alt={rel.title} fill sizes="33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
            </div>
            <div className="p-5 flex flex-col grow">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{rel.brand}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{rel.title}</h3>
                {rel.prices.length > 0 && <p className="mt-1 text-sm text-slate-500">{formatPricing(rel.prices)}</p>}
                <p className={`mt-1.5 text-xs font-medium ${isLaunched(rel.launchdate) ? "text-emerald-600" : "text-amber-600"}`}>
                  {formatLaunchDate(rel.launchdate)}
                </p>
              </div>
              <div className="mt-auto pt-5">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                  View Details <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
