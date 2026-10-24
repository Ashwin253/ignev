import ProductExtras from "../ProductExtras";
import { ProductNav, ProductHighlights, ProductVariants, ProductEmi, ProductFaq } from "../ProductSections";
import { buildProductFaqs } from "../../lib/product-faq";
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
import { getVehicleFallbackImage, getVehiclePhoto } from "../../lib/vehicle-images";
import {
  isCommercialListing,
  isElectricBikeListing,
  isElectricScooterListing,
} from "../../lib/catalog-filters";
import { fetchEvListingBySlugFromSupabase, fetchEvListingsFromSupabase, fetchProductContent, fetchProductOffers, supabase } from "../../lib/supabase";
import ProductGallery from "../../components/ProductGallery";
import ProductMainUI from "../ProductMainUI";
import { ProductSelectionProvider } from "../ProductSelectionProvider";
import MoreLikeThisSection from "../MoreLikeThisSection";
import dynamic from "next/dynamic";

const ProductDetailsSkeleton = () => (
  <div className="mt-16 rounded-3xl border-2 border-slate-300 bg-slate-100  px-5 py-8 md:px-10 md:py-10 shadow-sm animate-pulse">
    <div className="flex justify-center mb-5">
      <div className="h-8 w-48 bg-slate-300 rounded-lg"></div>
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[60px] w-full bg-slate-200 rounded-2xl border-2 border-slate-300 "></div>
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
    if (!item) return { title: "EVPLSE" };
    const canonicalSlug = item.slug || slug;
    const cleanTitle = `${item.brand} ${item.title} | EVPLSE`;
    const cleanDesc = `${item.brand} ${item.title} — ${item.types[0] ?? "EV"}. Starting at ${formatPricing(item.prices)}.`;
    const fallbackPhoto = getVehicleFallbackImage(item);
    const photoUrl = item.photo || (item.galleryImages && item.galleryImages[0]) || fallbackPhoto;

    return {
      title: cleanTitle,
      description: cleanDesc,
      alternates: {
        canonical: `/product/${canonicalSlug}`,
      },
      openGraph: {
        title: cleanTitle,
        description: cleanDesc,
        url: `https://www.evplse.com/product/${canonicalSlug}`,
        type: "website",
        images: photoUrl ? [{ url: photoUrl }] : undefined,
      },
    };
  } catch {
    return { title: "EVPLSE" };
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

  const fallbackPhoto = getVehicleFallbackImage(item);
  const photos = item.galleryImages.length > 0
    ? item.galleryImages
    : item.photo ? [item.photo] : [fallbackPhoto];



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
    <section className="min-h-screen bg-white text-zinc-900  py-28 overflow-x-hidden relative transition-colors duration-300">
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
          <nav className="flex items-center gap-2 text-sm text-zinc-500 ">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-brand transition-colors">Catalog</Link>
            <span>/</span>
            <span className="font-semibold text-zinc-900 line-clamp-1">{item.brand} {item.title}</span>
          </nav>
          <Link href="/catalog" className="shrink-0 inline-flex items-center gap-2 rounded-full border border-slate-350 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
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

            <div className="mb-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand mb-1">{item.brand}</p>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-5xl">{item.title}</h1>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${launched ? "bg-brand-soft text-brand-deep" : "bg-ink text-white"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${launched ? "bg-brand" : "bg-volt"}`} /> {launched ? "Available now" : launchLabel || "Coming soon"}
                </span>
                {item.types?.slice(0, 2).map((t) => (
                  <span key={t} className="rounded-full border border-line-strong bg-white px-3 py-1 text-xs font-bold text-ink-soft">{t}</span>
                ))}
                {(item.body_type || (item as any).bodyType) && (
                  <span className="rounded-full border border-line-strong bg-white px-3 py-1 text-xs font-bold text-ink-soft">{item.body_type || (item as any).bodyType}</span>
                )}
                {item.baas && <span className="rounded-full bg-brand-deep px-3 py-1 text-xs font-bold text-white">BaaS available</span>}
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand ring-1 ring-brand/30">✓ Verified specs</span>
              </div>
            </div>

            {/* Interactive Area (Battery Selection, Tabs, Ownership) */}
            <ProductExtras slug={slug} title={`${item.brand} ${item.title}`.trim()} price={item.prices?.[0] ? formatPricing(item.prices) : undefined} />
            <ProductMainUI item={item} slug={slug} dbFuelPrices={dbFuelPrices} content={productContent} offers={offers} />
          </div>
        </div>
        <ProductNav
          title={`${item.brand} ${item.title}`.trim()}
          sections={[
            { id: "highlights", label: "Highlights" },
            ...(item.batteryVariants?.length ? [{ id: "variants", label: "Variants & price" }] : []),
            ...(item.prices?.length ? [{ id: "emi", label: "EMI" }] : []),
            { id: "specs", label: "Specifications" },
            { id: "faq", label: "FAQs" },
            { id: "similar", label: "Similar EVs" },
          ]}
        />
        <ProductHighlights item={item} />

        {/* ── Variants + EMI (Equal 50/50 width) ── */}
        <div className="grid gap-8 lg:gap-10 pt-16 lg:grid-cols-2 items-start">
          <ProductVariants item={item} title={`${item.brand} ${item.title}`.trim()} />
          <ProductEmi title={`${item.brand} ${item.title}`.trim()} />
        </div>

        {/* ── Detailed Specs + Pros/Cons ── */}
        <div id="specs" className="scroll-mt-32 pt-4">
          <ProductDetails item={item} />
        </div>
        </ProductSelectionProvider>

        {(() => {
          const faqs = buildProductFaqs(item);
          return (
            <>
              {faqs.length > 0 && (
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
                    }),
                  }}
                />
              )}
              <ProductFaq faqs={faqs} />
            </>
          );
        })()}
{/* ── Ownership — full width below the 2-col grid ── */}
        {/* <ProductOwnershipSection item={item} /> */}

        {/* Related */}
        <div id="similar" className="scroll-mt-32" />
        <Suspense fallback={
          <div className="mt-20 sm:mt-32">
            <h2 className="mb-6 text-2xl font-black text-zinc-900 ">More like this</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <ProductSkeleton />
              <div className="hidden sm:block"><ProductSkeleton /></div>
              <div className="hidden sm:block"><ProductSkeleton /></div>
              <div className="hidden sm:block"><ProductSkeleton /></div>
            </div>
          </div>
        }>
          <RelatedListings slug={slug} currentItem={item} />
        </Suspense>
      </div>
    </section>
  );
}

function getListingCategory(item: any): "commercial" | "bike" | "scooter" | "cars" {
  if (isCommercialListing(item)) return "commercial";
  if (isElectricBikeListing(item)) return "bike";
  if (isElectricScooterListing(item)) return "scooter";
  return "cars";
}

function normalizeBrandName(brand?: string | null): string {
  if (!brand) return "";
  const b = brand.trim().toLowerCase();
  if (b === "tata" || b === "tata motors") return "tata";
  if (b === "ola" || b === "ola electric") return "ola";
  if (b === "hero" || b === "hero electric" || b === "vida" || b === "hero vida") return "hero";
  if (b === "bajaj" || b === "chetak" || b === "bajaj auto") return "bajaj";
  if (b === "tvs" || b === "tvs motor") return "tvs";
  if (b === "mg" || b === "mg motor") return "mg";
  if (b === "mahindra" || b === "mahindra & mahindra") return "mahindra";
  return b;
}

function checkSameVehicleType(a: any, b: any): boolean {
  const catA = getListingCategory(a);
  const catB = getListingCategory(b);
  if (catA === catB) return true;

  // Direct types array overlap
  const typesA = (Array.isArray(a.types) ? a.types : [a.types]).filter(Boolean).map((t: any) => String(t).toLowerCase().trim());
  const typesB = (Array.isArray(b.types) ? b.types : [b.types]).filter(Boolean).map((t: any) => String(t).toLowerCase().trim());
  if (typesA.length > 0 && typesB.length > 0 && typesA.some((t: string) => typesB.includes(t))) {
    return true;
  }

  // Matching body type
  const bodyA = (a.body_type || a.bodyType || "").toLowerCase().trim();
  const bodyB = (b.body_type || b.bodyType || "").toLowerCase().trim();
  if (bodyA && bodyB && bodyA === bodyB) {
    return true;
  }

  // 2-wheelers match (bike or scooter)
  const is2WA = catA === "bike" || catA === "scooter";
  const is2WB = catB === "bike" || catB === "scooter";
  if (is2WA && is2WB) {
    return true;
  }

  return false;
}

function checkSameBrand(a: any, b: any): boolean {
  const brandA = normalizeBrandName(a.brand);
  const brandB = normalizeBrandName(b.brand);
  return !!brandA && brandA === brandB;
}

async function RelatedListings({ slug, currentItem }: { slug: string; currentItem: any }) {
  let related: any[] = [];
  try {
    const allSupabase = await fetchEvListingsFromSupabase(300);
    
    const targetPrice = currentItem.prices?.[0] ? parseFloat(currentItem.prices[0].replace(/[^\d.]/g, "")) : null;
    const currentCategory = getListingCategory(currentItem);
    const currentBody = (currentItem.body_type || currentItem.bodyType || "").toLowerCase().trim();

    // Filter strictly to same vehicle type OR same brand, excluding current listing
    const candidates = allSupabase.filter((l) => {
      if (l.slug === slug || l.id === currentItem.id) return false;
      if (l.deleted) return false;

      const sameType = checkSameVehicleType(l, currentItem);
      const sameBrand = checkSameBrand(l, currentItem);

      return sameType || sameBrand;
    });

    // Score candidates to prioritize the most relevant recommendations
    const scored = candidates.map((l) => {
      let score = 0;
      const sameType = checkSameVehicleType(l, currentItem);
      const sameBrand = checkSameBrand(l, currentItem);
      const exactCategory = getListingCategory(l) === currentCategory;
      const lBody = (l.body_type || "").toLowerCase().trim();

      // Highest priority: Same brand AND same vehicle type
      if (sameBrand && sameType) {
        score += 100;
      } else if (sameBrand) {
        score += 60;
      } else if (sameType) {
        score += 50;
      }

      // Exact vehicle category match bonus (both cars, both scooters, etc.)
      if (exactCategory) {
        score += 30;
      }

      // Matching body type bonus (e.g. SUV to SUV, Hatchback to Hatchback)
      if (currentBody && lBody && currentBody === lBody) {
        score += 20;
      }

      // Price proximity bonus: closer prices are more relevant
      if (targetPrice && l.prices?.[0]) {
        const p = parseFloat(l.prices[0].replace(/[^\d.]/g, ""));
        if (!isNaN(p) && p > 0 && targetPrice > 0) {
          const diffRatio = Math.abs(p - targetPrice) / targetPrice;
          if (diffRatio <= 0.15) score += 20;
          else if (diffRatio <= 0.3) score += 15;
          else if (diffRatio <= 0.5) score += 10;
        }
      }

      // Slightly prefer launched models over concepts
      if (!l.concept) {
        score += 5;
      }

      return { listing: l, score };
    });

    scored.sort((a, b) => b.score - a.score);
    related = scored.slice(0, 4).map((s) => s.listing);
  } catch { /* skip related if DB is down */ }

  if (related.length === 0) {
    return (
      <SmoothCollapseEmptyState>
        <div className="mt-20 sm:mt-32">
          <h2 className="mb-6 text-2xl font-black text-zinc-900 ">More like this</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductSkeleton />
            <div className="hidden sm:block"><ProductSkeleton /></div>
            <div className="hidden sm:block"><ProductSkeleton /></div>
            <div className="hidden sm:block"><ProductSkeleton /></div>
          </div>
        </div>
      </SmoothCollapseEmptyState>
    );
  }

  return <MoreLikeThisSection related={related} />;
}
