import { NextRequest, NextResponse } from "next/server";
import { findChargingStations } from "../../../lib/mcp-service";

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
    const city = searchParams.get("city") || "";
    const network = searchParams.get("network") || "";
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const data = await findChargingStations({
      city,
      network,
      query,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to find charging stations" },
      { status: 500, headers: corsHeaders }
    );
  }
}
