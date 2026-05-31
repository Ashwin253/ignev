import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../lib/supabase";

export async function POST(req: Request) {
  if (!supabaseEnabled()) return NextResponse.json({ ok: true });
  try {
    const { path, slug, referrer, device } = await req.json();
    await supabase.from("page_views").insert({
      path: path || "/",
      slug: slug || "",
      referrer: referrer || "",
      device: device || "desktop",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
