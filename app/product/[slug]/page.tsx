import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck, CalendarDays, Zap,
} from "lucide-react";
import { ProductSkeleton } from "../../components/ProductSkeleton";
import { SmoothCollapseEmptyState } from "../../components/SmoothCollapse";
import {
  formatLaunchDate, isLaunched, formatPricing,
} from "../../lib/wordpress";
import { fetchEvListingBySlugFromSupabase, fetchEvListingsFromSupabase, fetchProductContent, fetchProductOffers, supabase } from "../../lib/supabase";
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

  // Fetch city-wise fuel prices
  let dbFuelPrices: any[] = [];
  try {
    const { data } = await supabase.from("fuel_prices").select("*").order("city");
    dbFuelPrices = data || [];
  } catch (err) {
    console.error("Error fetching fuel prices:", err);
  }

  // Fetch linked product content (articles/videos)
  const productContent = await fetchProductContent(slug);

  // Fetch applicable offers
  const offers = await fetchProductOffers(item.brand || "", slug);

  const launched    = isLaunched(item.launchdate);
  const launchLabel = formatLaunchDate(item.launchdate);

  const photos = item.galleryImages.length > 0
    ? item.galleryImages
    : item.photo ? [item.photo] : [];



  // Find pricing range for JSON-LD schema
  const priceVals = item.prices ? item.prices.map((p) => parseFloat(p.replace(/[^\d.]/g, ""))).filter(n => !isNaN(n)) : [];
  const minPrice = priceVals.length > 0 ? Math.min(...priceVals) : null;
  const maxPrice = priceVals.length > 0 ? Math.max(...priceVals) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${item.brand} ${item.title}`,
    "image": photos,
    "description": `${item.brand} ${item.title} — Electric ${item.types[0] || "vehicle"}.` +
      (item.pros && item.pros.length > 0 ? ` Highlights: ${item.pros.slice(0, 3).join(", ")}.` : ""),
    "brand": {
      "@type": "Brand",
      "name": item.brand
    },
    "category": item.types[0] || "Electric Vehicle",
    ...(minPrice !== null && {
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": minPrice * 100000,
        ...(maxPrice !== null && { "highPrice": maxPrice * 100000 }),
        "offerCount": item.batteryVariants ? item.batteryVariants.length : 1,
        "availability": launched ? "https://schema.org/InStock" : "https://schema.org/PreOrder"
      }
    }),
    "additionalProperty": [
      ...(item.topSpeed ? [{
        "@type": "PropertyValue",
        "name": "Top Speed",
        "value": `${item.topSpeed} km/h`
      }] : []),
      ...(item.batteryVariants && item.batteryVariants[0]?.range ? [{
        "@type": "PropertyValue",
        "name": "Driving Range",
        "value": `${item.batteryVariants[0].range} km`
      }] : []),
      ...(item.batteryVariants && item.batteryVariants[0]?.capacity ? [{
        "@type": "PropertyValue",
        "name": "Battery Capacity",
        "value": `${item.batteryVariants[0].capacity} kWh`
      }] : [])
    ]
  };

  return (
    <section className="min-h-screen bg-[#f8f5f0] text-slate-900 py-28 overflow-x-hidden relative">
      {/* Decorative Ambient Glowing Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a5e6d1]/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#a5e6d1]/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* JSON-LD Schema for AI Crawlers / SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-hidden relative z-10">

        {/* Breadcrumb row */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-[#10855f] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-[#10855f] transition-colors">Catalog</Link>
            <span>/</span>
            <span className="font-semibold text-slate-900 line-clamp-1">{item.brand} {item.title}</span>
          </nav>
          <Link href="/catalog" className="shrink-0 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-700 transition">
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
        </div>

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
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#10855f] mb-1">{item.brand}</p>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{item.title}</h1>
                <div className="flex flex-col gap-1 ml-auto shrink-0">
                  {item.types[0] && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#a5e6d1]/40 bg-[#a5e6d1]/20 px-2 py-0.5 text-[10px] font-semibold text-[#10855f]">
                      <Zap size={10} className="text-[#10855f]" />{item.types[0]}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    launched ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    {launched
                      ? <><BadgeCheck size={10} className="text-emerald-400" /> {launchLabel}</>
                      : <><CalendarDays size={10} className="text-amber-450" /> {launchLabel}</>}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Area (Battery Selection, Tabs, Ownership) */}
            <ProductMainUI item={item} slug={slug} dbFuelPrices={dbFuelPrices} content={productContent} offers={offers} />
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
            <h2 className="mb-8 text-2xl font-black text-black">More like this</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <ProductSkeleton />
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
      .slice(0, 4);
  } catch { /* skip related if DB is down */ }

  if (related.length === 0) {
    return (
      <SmoothCollapseEmptyState>
        <div className="mt-32">
          <h2 className="mb-8 text-2xl font-black text-black">More like this</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductSkeleton />
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
      <h2 className="mb-8 text-2xl font-black text-black">More like this</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((rel) => (
          <Link key={rel.id} href={`/product/${rel.slug}`}
            className="group flex flex-col h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md hover:border-[#a5e6d1]/60 hover:shadow-xl transition-all duration-350 hover:-translate-y-1">
            <div className="relative aspect-4/3 overflow-hidden bg-transparent shrink-0">
              {rel.photo && (
                <Image src={rel.photo} alt={rel.title} fill sizes="33vw"
                  className="object-contain group-hover:scale-105 transition-transform duration-500" />
              )}
            </div>
            <div className="p-5 flex flex-col grow">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#10855f]">{rel.brand}</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">{rel.title}</h3>
                {rel.prices.length > 0 && <p className="mt-1 text-sm text-slate-650 font-bold">{formatPricing(rel.prices)}</p>}
                <p className={`mt-1.5 text-xs font-medium ${isLaunched(rel.launchdate) ? "text-emerald-600" : "text-amber-600"}`}>
                  {formatLaunchDate(rel.launchdate)}
                </p>
              </div>
              <div className="mt-auto pt-5">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-250 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 group-hover:bg-[#a5e6d1] group-hover:border-[#a5e6d1] group-hover:text-slate-950 group-hover:font-extrabold shadow-inner group-hover:shadow-[0_0_15px_rgba(165,230,209,0.3)]">
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
