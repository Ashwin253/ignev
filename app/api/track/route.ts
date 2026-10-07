import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../lib/supabase";

export async function POST(req: Request) {
  if (!supabaseEnabled()) return NextResponse.json({ ok: true });
  try {
    const { path, slug, referrer, device, event, properties } = await req.json();
    
    // Check if reset action requested
    if (event === "reset_stats" || properties?.action === "reset") {
      await supabase.from("page_views").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      return NextResponse.json({ ok: true, reset: true });
    }

    await supabase.from("page_views").insert({
      path: path || "/",
      slug: slug || "",
      referrer: referrer || "",
      device: device || "desktop",
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}

export async function DELETE(req: Request) {
  if (!supabaseEnabled()) return NextResponse.json({ ok: true });
  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");

    if (daysParam && daysParam !== "all") {
      const days = parseInt(daysParam, 10);
      if (!isNaN(days) && days > 0) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { error, count } = await supabase
          .from("page_views")
          .delete()
          .lt("created_at", cutoffDate);

        if (error) throw error;
        return NextResponse.json({ ok: true, message: `Deleted records older than ${days} days`, count });
      }
    }

    // Delete all records from page_views
    const { error } = await supabase.from("page_views").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "All stats reset successfully" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
