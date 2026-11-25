import ProductExtras from "../ProductExtras";
import { ProductNav, ProductSectionPanel, ProductHighlights, ProductVariants, ProductEmi, ProductFaq } from "../ProductSections";
import { buildProductFaqs } from "../../lib/product-faq";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Star,
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
import { fetchEvListingBySlugFromSupabase, fetchEvListingsFromSupabase, fetchProductContent, fetchProductOffers, fetchVehicleMediaRatings, supabase } from "../../lib/supabase";
import ProductGallery from "../../components/ProductGallery";
import ProductMainUI from "../ProductMainUI";
import ProductMediaRatings from "../ProductMediaRatings";
import { ProductSelectionProvider } from "../ProductSelectionProvider";
import MoreLikeThisSection from "../MoreLikeThisSection";
import dynamic from "next/dynamic";
import VehicleJsonLd from "../../components/VehicleJsonLd";
import { getMediaRatingSummary } from "../../lib/media-ratings";
import { formatShopPrice, getShopProductsForVehicleSlug, type ShopProduct } from "../../lib/shop";

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

  const [productContent, offers, mediaRatings, compatibleShopProducts] = await Promise.all([
    fetchProductContent(slug),
    fetchProductOffers(item.brand || "", slug),
    fetchVehicleMediaRatings(item.id),
    getShopProductsForVehicleSlug(item.slug || slug),
  ]);
  const mediaRatingSummary = getMediaRatingSummary(mediaRatings);

  const hasLaunchedVariant = item.batteryVariants?.some((variant) =>
    !["Coming Soon", "Announced", "Concept", "Facelift"].includes(variant.usage_type || "") &&
    isLaunched(variant.launch_date)
  ) ?? false;
  const launched    = isLaunched(item.launchdate) || hasLaunchedVariant;
  const launchLabel = formatLaunchDate(item.launchdate);

  const fallbackPhoto = getVehicleFallbackImage(item);
  const photos = item.galleryImages.length > 0
    ? item.galleryImages
    : item.photo ? [item.photo] : [fallbackPhoto];
  const sections = [
    ...(item.batteryVariants?.length ? [{ id: "variants", label: "Variants & price" }] : []),
    { id: "specs", label: "Specifications" },
    ...(item.prices?.length ? [{ id: "emi", label: "EMI" }] : []),
    ...(compatibleShopProducts.length ? [{ id: "shop", label: "Accessories & spare parts" }] : []),
    ...(mediaRatings.length > 0 ? [{ id: "media-ratings", label: "Media rating" }] : []),
    { id: "faq", label: "FAQs" },
    { id: "similar", label: "Similar EVs" },
  ];
  const faqs = buildProductFaqs(item);


  return (
    <section className="min-h-screen bg-white text-zinc-900  py-28 overflow-x-hidden relative transition-colors duration-300">
      {/* Decorative Ambient Glowing Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a5e6d1]/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#a5e6d1]/10 rounded-full blur-[130px] pointer-events-none"></div>

      <VehicleJsonLd item={item} promotions={offers} mediaRatings={mediaRatings} launched={launched} photos={photos} />
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
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${launched ? "bg-brand-soft text-brand-deep" : "bg-ink text-white"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${launched ? "bg-brand" : "bg-volt"}`} /> {launched ? "Available now" : launchLabel || "Coming soon"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.types?.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full border border-line-strong bg-white px-3 py-1 text-xs font-bold text-ink-soft">{t}</span>
                  ))}
                  {(item.body_type || (item as any).bodyType) && (
                    <span className="rounded-full border border-line-strong bg-white px-3 py-1 text-xs font-bold text-ink-soft">{item.body_type || (item as any).bodyType}</span>
                  )}
                  {item.baas && <span className="rounded-full bg-brand-deep px-3 py-1 text-xs font-bold text-white">BaaS available</span>}
                </div>
                {mediaRatingSummary && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      title={`Normalized average across the model and variants from ${mediaRatingSummary.ratingCount} media ${mediaRatingSummary.ratingCount === 1 ? "rating" : "ratings"}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"
                    >
                      <Star size={12} fill="currentColor" />
                      {mediaRatingSummary.ratingValue.toFixed(1)} / 5 <span className="font-semibold text-amber-700">Media rating</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Area (Battery Selection, Tabs, Ownership) */}
            <ProductExtras slug={slug} />
            <ProductMainUI item={item} slug={slug} dbFuelPrices={dbFuelPrices} content={productContent} offers={offers} />
          </div>
        </div>
        <ProductHighlights item={item} mediaRating={mediaRatingSummary} />
        <ProductNav title={`${item.brand} ${item.title}`.trim()} sections={sections}>
          {/* ── Variants ── */}
          {item.batteryVariants?.length ? (
            <div className="grid items-start gap-8 md:gap-10 md:pt-16">
              <ProductSectionPanel id="variants">
                <div className="pt-8 md:pt-0">
                  <ProductVariants item={item} title={`${item.brand} ${item.title}`.trim()} />
                </div>
              </ProductSectionPanel>
            </div>
          ) : null}

          {/* ── Detailed Specs + Pros/Cons ── */}
          <ProductSectionPanel id="specs">
            <div id="specs" className="scroll-mt-32 pt-4">
              <ProductDetails item={item} />
            </div>
          </ProductSectionPanel>
          {item.prices?.length ? (
            <ProductSectionPanel id="emi">
              <div className="pt-8 md:pt-0">
                <ProductEmi title={`${item.brand} ${item.title}`.trim()} />
              </div>
            </ProductSectionPanel>
          ) : null}
          {compatibleShopProducts.length > 0 && (
            <ProductSectionPanel id="shop">
              <CompatibleShopProducts products={compatibleShopProducts} vehicleName={`${item.brand} ${item.title}`.trim()} />
            </ProductSectionPanel>
          )}
          <ProductSectionPanel id="media-ratings">
            <ProductMediaRatings item={item} ratings={mediaRatings} />
          </ProductSectionPanel>
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
          <ProductSectionPanel id="faq">
            <ProductFaq faqs={faqs} />
          </ProductSectionPanel>

          {/* ── Ownership — full width below the 2-col grid ── */}
          {/* <ProductOwnershipSection item={item} /> */}

          <ProductSectionPanel id="similar">
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
          </ProductSectionPanel>
        </ProductNav>
        </ProductSelectionProvider>
      </div>
    </section>
  );
}

function CompatibleShopProducts({ products, vehicleName }: { products: ShopProduct[]; vehicleName: string }) {
  return (
    <section id="shop" className="scroll-mt-32 pt-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">EVPLSE Shop</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Accessories & spare parts for {vehicleName}</h2>
          <p className="mt-2 text-sm text-ink-soft">Quick access to accessories and parts selected for this model.</p>
        </div>
        <Link href="/shop" className="shrink-0 text-sm font-extrabold text-brand hover:text-brand-deep hover:underline">
          View all products →
        </Link>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const onSale = Boolean(product.mrp && product.mrp > product.price);
          return (
            <Link
              key={product.id}
              href={`/shop?product=${encodeURIComponent(product.slug)}`}
              className="group overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="aspect-square bg-slate-100 p-3">
                {product.image ? (
                  // Shop images may be hosted outside the Next Image allowlist.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">EVPLSE Shop</div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-brand">{product.category}</p>
                <h3 className="mt-2 font-extrabold text-ink">{product.name}</h3>
                {product.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-soft">{product.description}</p>}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-lg font-extrabold text-ink">{formatShopPrice(product.price)}</span>
                  {onSale && product.mrp && <span className="text-sm text-ink-mute line-through">{formatShopPrice(product.mrp)}</span>}
                </div>
              </div>
            </Link>
          );
        })}
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
