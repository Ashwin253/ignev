import { NextRequest, NextResponse } from "next/server";
import { searchEvs } from "../../../lib/mcp-service";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const brand = searchParams.get("brand") || "";
    const type = searchParams.get("type") || "";
    const maxPriceStr = searchParams.get("maxPrice");
    const minPriceStr = searchParams.get("minPrice");
    const minRangeStr = searchParams.get("minRange");
    const baasOnly = searchParams.get("baasOnly") === "true";
    const limitStr = searchParams.get("limit");

    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const minRange = minRangeStr ? parseFloat(minRangeStr) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const data = await searchEvs({
      query,
      brand,
      type,
      maxPrice: isNaN(maxPrice as number) ? undefined : maxPrice,
      minPrice: isNaN(minPrice as number) ? undefined : minPrice,
      minRange: isNaN(minRange as number) ? undefined : minRange,
      baasOnly,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to search EVs" },
      { status: 500, headers: corsHeaders }
    );
  }
}
