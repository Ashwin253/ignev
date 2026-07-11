import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, userId } = body;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Token is required" }, { status: 400 });
    }

    if (!supabaseEnabled()) {
      return NextResponse.json({ ok: true, note: "Supabase not configured" });
    }

    // Upsert the token to associate it with the logged-in team member
    const { error } = await supabase.from("fcm_tokens").upsert(
      {
        user_id: userId,
        token: token,
      },
      { onConflict: "token" }
    );

    if (error) {
      console.warn("[FCM Register] Supabase upsert failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
