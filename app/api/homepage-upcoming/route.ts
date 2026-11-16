import { NextResponse } from "next/server";
import { fetchEvListingsFromSupabase, fetchHomepageSectionCache, mapHomepageCacheListings } from "../../lib/supabase";
import { toCatalogItem } from "../../lib/catalog-map";

export const revalidate = 0;

export async function GET() {
  try {
    const cache = await fetchHomepageSectionCache();
    const listings = cache
      ? mapHomepageCacheListings(cache.payload)
      : await fetchEvListingsFromSupabase(300);
    const upcoming = listings
      .map(toCatalogItem)
      .filter((item) => item.upcoming)
      .sort((a, b) => (a.launchTs || Infinity) - (b.launchTs || Infinity))
      .slice(0, 4);
    return NextResponse.json({ upcoming });
  } catch {
    return NextResponse.json({ error: "Upcoming vehicles unavailable" }, { status: 503 });
  }
}
