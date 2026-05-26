import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, pincode, interest, message, source } = body;

    if (!supabaseEnabled()) {
      return NextResponse.json({ ok: true, note: "Supabase not configured" });
    }

    const { error } = await supabase.from("leads").insert({
      name: name || "",
      phone: phone || "",
      pincode: pincode || "",
      interest: interest || "",
      message: message || "",
      source: source || "get-assist",
    });

    if (error) {
      console.warn("[Lead] Supabase insert failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
