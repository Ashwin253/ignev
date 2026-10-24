import { Suspense } from "react";
import { fetchHomepageData, type EvListing } from "./lib/wordpress";
import {
  fetchEvListingsFromSupabase,
  fetchHeroBanners,
  fetchLatestUpdates,
  fetchBrandRankings,
  extractArticleMeta,
  stripMarkdown,
} from "./lib/supabase";
import { sortVehiclesByBrandRank, type BrandRankItem } from "./lib/brand-rankings";
import { matchesVehicleCategory } from "./lib/catalog-filters";
import { toCatalogItem } from "./lib/catalog-map";
import { toInternalHref } from "./lib/links";
import { itemSlug } from "./lib/format";
import LoadingSkeleton from "./loading";
import HomeHero, { type HeroBannerLite } from "./components/home/HomeHero";
import { QuickMatch, RecentlyViewed, Rail, SavingsTeaser, Showcase } from "./components/home/HomeInteractive";
import ServicesOrbit from "./components/home/ServicesOrbit";
import { HomeFaq, HowItWorks, StatsBand } from "./components/home/HomeExtras";
import { BrandMarquee, NewsGrid, ToolsGrid, WhySection, type NewsItem } from "./components/home/HomeStatic";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

const FALLBACK_NEWS_PHOTO = "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80";

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  let listings: EvListing[] = [];
  let banners: any[] = [];
  let news: NewsItem[] = [];
  let brandRankings: BrandRankItem[] = [];

  // Supabase first (fast), WordPress as fallback
  try {
    const [sbListings, sbBanners, sbUpdates, sbRankings] = await Promise.all([
      fetchEvListingsFromSupabase(300),
      fetchHeroBanners(),
      fetchLatestUpdates(3),
      fetchBrandRankings(),
    ]);
    if (sbListings.length) listings = sbListings;
    if (sbBanners.length) banners = sbBanners;
    if (sbRankings.length) brandRankings = sbRankings;
    if (sbUpdates.length) {
      news = sbUpdates.map((u: any) => {
        const meta = extractArticleMeta(u.body);
        const plain = stripMarkdown(meta.cleanBody || u.body || "");
        return {
          id: String(u.id),
          title: u.title,
          href: `/article/${u.slug || u.url || u.id}`,
          excerpt: plain.length > 120 ? plain.slice(0, 117) + "…" : plain,
          date: u.created_at,
          photo: u.thumbnail || FALLBACK_NEWS_PHOTO,
        };
      });
    }
  } catch {
    /* Supabase not configured or failed */
  }

  if (!listings.length || !banners.length || !news.length) {
    try {
      const wp = await fetchHomepageData();
      if (!listings.length) listings = wp.listings;
      if (!banners.length) banners = wp.banners;
      if (!news.length) {
        news = (wp.updates || []).slice(0, 3).map((u: any) => ({
          id: String(u.id),
          title: u.title,
          href: u.href || `/article/${u.slug}`,
          excerpt: u.excerpt || "",
          date: u.date,
          photo: u.photo || FALLBACK_NEWS_PHOTO,
        }));
      }
    } catch {
      /* WordPress also unavailable — render what we have */
    }
  }

  const all = listings.map(toCatalogItem);

  // Category showcase — ranked by brand priority (admin-managed), launched vehicles only
  const launched = listings.filter((l) => !all[listings.indexOf(l)]?.upcoming);
  const byCategory: Record<string, ReturnType<typeof toCatalogItem>[]> = {};
  const counts: Record<string, number> = {};
  for (const key of ["cars", "scooter", "bike", "commercial"]) {
    const matched = listings.filter((l) => matchesVehicleCategory(l as any, key));
    counts[key] = matched.length;
    const pool = launched.filter((l) => matchesVehicleCategory(l as any, key));
    byCategory[key] = sortVehiclesByBrandRank(pool.length ? pool : matched, key, brandRankings)
      .slice(0, 8)
      .map(toCatalogItem);
  }

  // Launch rails
  const now = Date.now();
  const twoMonthsAgo = now - 1000 * 60 * 60 * 24 * 62;
  const fresh = all
    .filter((i) => !i.upcoming && (i.launchTs ?? 0) >= twoMonthsAgo && (i.launchTs ?? 0) <= now)
    .sort((a, b) => (b.launchTs ?? 0) - (a.launchTs ?? 0))
    .slice(0, 10);
  const upcoming = all
    .filter((i) => i.upcoming)
    .sort((a, b) => (a.launchTs || Infinity) - (b.launchTs || Infinity))
    .slice(0, 10);

  const heroBanners: HeroBannerLite[] = banners.map((b: any) => {
    const href = toInternalHref(b.href || b.link || "");
    let videoUrl = b.video_url || b.videoUrl || "";
    if (!videoUrl && href.startsWith("/product/")) {
      const slug = href.replace("/product/", "").split("?")[0].split("#")[0];
      const matched = all.find((item) => itemSlug(item) === slug);
      if (matched?.video_links?.[0]?.url) {
        videoUrl = matched.video_links[0].url;
      }
    }
    return {
      id: String(b.id),
      href,
      cta: b.cta || "",
      details: b.details || "",
      label: b.label || "",
      imageHorizontal: b.imageHorizontal || b.image_horizontal || "",
      imageVertical: b.imageVertical || b.image_vertical || "",
      videoUrl,
    };
  });

  return (
    <>
      <HomeHero banners={heroBanners} modelCount={listings.length} />
      <Showcase byCategory={byCategory} />
      <Rail eyebrow="Just launched" title="New launches" description="Vehicles that hit the Indian market in the last two months." href="/new-launches" hrefLabel="All new launches" items={fresh} tone="tint" />
      <QuickMatch items={all} />
      <Rail eyebrow="Coming soon" title="Upcoming electric vehicles" description="Track what's launching next — and be first in line." href="/upcoming" hrefLabel="All upcoming" items={upcoming} />
      <RecentlyViewed items={all} />
      <BrandMarquee />
      <SavingsTeaser />
      <WhySection />
      <StatsBand models={listings.length} brands={new Set(listings.map((l) => l.brand).filter(Boolean)).size} />
      {/* <ServicesOrbit /> */}
      <HowItWorks />
      <NewsGrid items={news} />
      <ToolsGrid />
      <HomeFaq />
    </>
  );
}
