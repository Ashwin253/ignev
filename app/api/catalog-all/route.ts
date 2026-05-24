import { NextResponse } from "next/server";
import { fetchEvListings, fetchEvListingsREST } from "../../lib/wordpress";

export const revalidate = 300;

export async function GET() {
  try {
    // Try GraphQL first, then REST
    let listings = await fetchEvListings(50);
    if (!listings.length) {
      listings = await fetchEvListingsREST(50);
    }

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
