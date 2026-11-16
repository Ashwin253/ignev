import { NextResponse } from "next/server";
import {
  fetchHomepageSectionCache,
  fetchBrandRankings,
  fetchEvListingsFromSupabase,
  mapHomepageCacheListings,
} from "../../lib/supabase";
import { sortVehiclesByBrandRank, type BrandRankItem } from "../../lib/brand-rankings";
import { matchesVehicleCategory } from "../../lib/catalog-filters";
import { toCatalogItem } from "../../lib/catalog-map";

export const revalidate = 0;

export async function GET() {
  try {
    const cache = await fetchHomepageSectionCache();
    const [listings, rankings] = await Promise.all([
      cache
        ? Promise.resolve(mapHomepageCacheListings(cache.payload))
        : fetchEvListingsFromSupabase(300),
      fetchBrandRankings(),
    ]);

    const items = listings.map(toCatalogItem);
    const launched = listings.filter((listing, index) =>
      !items[index]?.upcoming || !!items[index]?.upcomingVariantName
    );
    const byCategory: Record<string, ReturnType<typeof toCatalogItem>[]> = {};

    for (const category of ["cars", "scooter", "bike", "commercial"]) {
      const cachedSlugs = cache?.payload.categorySlugs?.[category];
      if (cachedSlugs?.length) {
        const itemBySlug = new Map(items.map((item) => [item.slug, item]));
        byCategory[category] = cachedSlugs
          .map((slug) => itemBySlug.get(slug))
          .filter((item): item is ReturnType<typeof toCatalogItem> => !!item);
        continue;
      }
      const matched = listings.filter((listing) => matchesVehicleCategory(listing as any, category));
      const available = launched.filter((listing) => matchesVehicleCategory(listing as any, category));
      byCategory[category] = sortVehiclesByBrandRank(
        available.length ? available : matched,
        category,
        rankings as BrandRankItem[],
      ).slice(0, 8).map(toCatalogItem);
    }

    const now = Date.now();
    const twoMonthsAgo = now - 1000 * 60 * 60 * 24 * 62;
    const fresh = items
      .filter((item) => !item.upcoming && (item.launchTs ?? 0) >= twoMonthsAgo && (item.launchTs ?? 0) <= now)
      .sort((a, b) => (b.launchTs ?? 0) - (a.launchTs ?? 0))
      .slice(0, 10);
    return NextResponse.json({
      items,
      byCategory,
      fresh,
      modelCount: listings.length,
      brandCount: new Set(listings.map((listing) => listing.brand).filter(Boolean)).size,
      quickMatch2Lakh: items.filter((item) => cache?.payload.quickMatch2LakhSlugs?.includes(item.slug || "")),
    });
  } catch {
    return NextResponse.json({ error: "Homepage data unavailable" }, { status: 503 });
  }
}
