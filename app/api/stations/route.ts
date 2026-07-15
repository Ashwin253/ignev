import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../lib/supabase";

export const revalidate = 60;

export async function GET() {
  if (!supabaseEnabled()) {
    return NextResponse.json({ stations: [] });
  }
  const { data, error } = await supabase.from("ev_stations").select("*").eq("is_active", true);
  if (error) {
    return NextResponse.json({ stations: [], error: error.message });
  }
  return NextResponse.json({ stations: data ?? [] });
}
