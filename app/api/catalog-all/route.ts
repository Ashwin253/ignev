import { NextResponse } from "next/server";
import { fetchEvListingsFromSupabase } from "../../lib/supabase";
import { formatPricing } from "../../lib/wordpress";

export const revalidate = 300;

export async function GET() {
  try {
    const listings = await fetchEvListingsFromSupabase(100);

    const items = listings.map((l) => ({
      name: l.title,
      brand: l.brand,
      type: l.types[0] ?? "",
      types: l.types ?? [],
      body_type: l.body_type || (l as any).bodyType || "",
      bodyType: l.body_type || (l as any).bodyType || "",
      pricing: formatPricing(l.prices),
      photo: l.photo,
      slug: l.slug,
      topSpeed: l.topSpeed,
      drivingRange: l.batteryVariants?.[0]?.range || "",
      commercial: l.commercial,
      usageType: (l as any).usage_type || "",
      launchdate: l.launchdate,
      prices: l.prices,
      baas: l.baas,
      video_links: l.video_links,
      batterySpecs: l.batterySpecs,
      batteryVariants: l.batteryVariants,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
