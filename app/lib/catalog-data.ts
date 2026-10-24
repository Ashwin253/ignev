import { fetchEvListingsFromSupabase, fetchBrandRankings } from "./supabase";
import { fetchHomepageData } from "./wordpress";
import { toCatalogItem } from "./catalog-map";
import type { CatalogItem } from "./catalog-types";
import type { BrandRankItem } from "./brand-rankings";

/** Shared server-side loader for every catalog-style page (Supabase first, WordPress fallback). */
export async function getCatalogData(): Promise<{ items: CatalogItem[]; brandRankings: BrandRankItem[] }> {
  let listings: Awaited<ReturnType<typeof fetchEvListingsFromSupabase>> = [];
  let brandRankings: BrandRankItem[] = [];

  try {
    const [sb, ranks] = await Promise.all([fetchEvListingsFromSupabase(300), fetchBrandRankings()]);
    if (ranks?.length) brandRankings = ranks;
    if (sb.length) listings = sb;
  } catch {
    /* fall through to WordPress */
  }

  if (!listings.length) {
    try {
      listings = (await fetchHomepageData()).listings;
    } catch {
      /* render the empty state */
    }
  }

  return { items: listings.map(toCatalogItem), brandRankings };
}
