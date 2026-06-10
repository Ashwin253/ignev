import { NextResponse } from "next/server";
import { fetchEvListingsFromSupabase } from "../../lib/supabase";

export const revalidate = 300;

export async function GET() {
  try {
    const listings = await fetchEvListingsFromSupabase(100);

    const items = listings.map((l) => ({
      name: l.title,
      brand: l.brand,
      type: l.types[0] ?? "",
      pricing: l.prices.length ? l.prices[0] : "",
      photo: l.photo,
      slug: l.slug,
      topSpeed: l.topSpeed,
      commercial: l.commercial,
      launchdate: l.launchdate,
      prices: l.prices,
      baas: l.baas,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
