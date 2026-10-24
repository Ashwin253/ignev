import { NextResponse } from "next/server";
import { fetchEvListingsFromSupabase } from "../../lib/supabase";
import { toCatalogItem } from "../../lib/catalog-map";

export const revalidate = 300;

export async function GET() {
  try {
    const listings = await fetchEvListingsFromSupabase(300);
    return NextResponse.json({ items: listings.map(toCatalogItem) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
