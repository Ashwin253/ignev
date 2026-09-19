import { NextRequest, NextResponse } from "next/server";
import { calculateSavings } from "../../../lib/mcp-service";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dailyKmStr = searchParams.get("dailyKm");
    const vehicleTypeStr = searchParams.get("vehicleType");
    const fuelPriceStr = searchParams.get("fuelPrice");
    const electricityRateStr = searchParams.get("electricityRate");

    const dailyKm = dailyKmStr ? parseFloat(dailyKmStr) : 40;
    const vehicleType = vehicleTypeStr === "scooter" ? "scooter" : "car";
    const fuelPrice = fuelPriceStr ? parseFloat(fuelPriceStr) : undefined;
    const electricityRate = electricityRateStr ? parseFloat(electricityRateStr) : undefined;

    const data = calculateSavings({
      dailyKm: isNaN(dailyKm) ? 40 : dailyKm,
      vehicleType,
      fuelPrice: fuelPrice && !isNaN(fuelPrice) ? fuelPrice : undefined,
      electricityRate: electricityRate && !isNaN(electricityRate) ? electricityRate : undefined,
    });

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to calculate savings" },
      { status: 500, headers: corsHeaders }
    );
  }
}
