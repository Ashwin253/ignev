import { NextRequest, NextResponse } from "next/server";
import { compareEvs } from "../../../lib/mcp-service";

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
    const slugsParam = searchParams.get("slugs") || "";
    const slugs = slugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (slugs.length < 2) {
      return NextResponse.json(
        { error: "Please provide at least 2 comma-separated vehicle slugs in 'slugs' parameter." },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = await compareEvs(slugs);
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to compare EVs" },
      { status: 500, headers: corsHeaders }
    );
  }
}
