import { NextRequest, NextResponse } from "next/server";
import { getEvDetails } from "../../../../lib/mcp-service";

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

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json(
        { error: "Vehicle slug is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = await getEvDetails(slug);
    if (!data.found) {
      return NextResponse.json(data, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve EV details" },
      { status: 500, headers: corsHeaders }
    );
  }
}
