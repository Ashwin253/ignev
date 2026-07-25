import { NextResponse } from "next/server";
import { fetchEvListingBySlugFromSupabase } from "../../lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ context: "" });

  const item = await fetchEvListingBySlugFromSupabase(slug);
  if (!item) return NextResponse.json({ context: "" });

  const variants = item.batteryVariants.map((v) =>
    `${v.modelName || "Variant"}: ${v.capacity}kWh, ${v.range}km range, ₹${v.price}L`
  ).join("\n");

  const context = `Vehicle: ${item.brand} ${item.title}
Type: ${item.types[0] || "EV"}
Price: ₹${item.prices[0] || "N/A"} Lakh
Top Speed: ${item.topSpeed || "N/A"} km/h
BAAS Available: ${item.baas ? "Yes" : "No"}
Variants:\n${variants || "Standard"}
Pros: ${item.pros.join(", ") || "N/A"}
Cons: ${item.cons.join(", ") || "N/A"}`;

  return NextResponse.json({ context });
}
