import { NextResponse } from "next/server";
import { createWPLead, wpEnabled } from "@/app/lib/wordpress";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const pincode = String(body?.pincode ?? "").trim();
    const interest = String(body?.interest ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !phone || !pincode || !interest) {
      return NextResponse.json(
        { error: "Missing required fields: name, phone, pincode, interest." },
        { status: 400 }
      );
    }

    if (!wpEnabled()) {
      // WordPress not configured — log locally and acknowledge
      console.info("[assist] WP not configured. Lead received:", { name, phone, pincode, interest, message });
      return NextResponse.json({ ok: true, stored: false });
    }

    await createWPLead({ name, phone, pincode, interest, message });
    return NextResponse.json({ ok: true, stored: true });
  } catch (error) {
    console.error("Assist lead save error:", error);
    return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
  }
}
