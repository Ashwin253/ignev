import { NextResponse } from "next/server";
import { fetchEvListingsFromSupabase } from "../lib/supabase";
import { formatPricing, isLaunched, formatLaunchDate } from "../lib/wordpress";

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const listings = await fetchEvListingsFromSupabase(300);
    
    if (!listings || listings.length === 0) {
      return NextResponse.json({ success: false, message: "No listings found in database" }, { status: 404 });
    }

    const summaryData = listings.map((l) => {
      // Find pricing range
      const priceVals = l.prices ? l.prices.map((p) => parseFloat(p.replace(/[^\d.]/g, ""))).filter(n => !isNaN(n)) : [];
      const minPrice = priceVals.length > 0 ? Math.min(...priceVals) : null;
      const maxPrice = priceVals.length > 0 ? Math.max(...priceVals) : null;

      // Find range range
      const ranges = l.batteryVariants ? l.batteryVariants.map((v) => parseFloat(v.range)).filter(n => !isNaN(n)) : [];
      const maxRange = ranges.length > 0 ? Math.max(...ranges) : null;

      // Find capacity range
      const capacities = l.batteryVariants ? l.batteryVariants.map((v) => parseFloat(v.capacity)).filter(n => !isNaN(n)) : [];
      const maxCapacity = capacities.length > 0 ? Math.max(...capacities) : null;

      const launched = isLaunched(l.launchdate);
      const pricingText = formatPricing(l.prices);

      // Construct a clean, natural summary text for AIs to read
      const defaultSummary = `${l.brand} ${l.title} is an electric ${l.types[0] || "vehicle"}. ` +
        `Pricing is around ${pricingText || "TBD"}. ` +
        `${maxRange ? `It offers a maximum range of up to ${maxRange} km on a single charge. ` : ""}` +
        `${maxCapacity ? `Features a battery capacity of up to ${maxCapacity} kWh. ` : ""}` +
        `${l.topSpeed ? `Has a top speed of ${l.topSpeed} km/h. ` : ""}` +
        `${launched ? `It was launched on ${formatLaunchDate(l.launchdate)}.` : `It is expected to launch around ${formatLaunchDate(l.launchdate)}.`}`;

      return {
        brand: l.brand,
        title: l.title,
        slug: l.slug,
        type: l.types[0] || "vehicle",
        priceRange: { min: minPrice, max: maxPrice },
        pricingText,
        maxRangeKm: maxRange,
        maxCapacityKwh: maxCapacity,
        topSpeedKmh: l.topSpeed,
        launched,
        baasAvailable: l.baas || false,
        summaryText: defaultSummary,
        pros: l.pros || [],
        cons: l.cons || []
      };
    });

    const response = NextResponse.json({ items: summaryData, updatedAt: new Date().toISOString() });
    
    // Add CDN caching headers
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
