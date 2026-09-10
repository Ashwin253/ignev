import { NextResponse } from "next/server";
import { fetchBrandRankings } from "../../lib/supabase";

export const revalidate = 60;

export async function GET() {
  try {
    const rankings = await fetchBrandRankings();
    return NextResponse.json({ rankings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch brand rankings", rankings: [] },
      { status: 500 }
    );
  }
}
