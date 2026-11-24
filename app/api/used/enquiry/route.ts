import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vehicleId,
      vehicleTitle,
      customerName,
      customerPhone,
      customerPincode,
      customerCity,
      enquiryType, // "test_drive" | "enquire"
      testDriveMode, // "home" | "hub"
      preferredDate,
      preferredTime,
      message,
    } = body;

    if (!customerPhone || (!customerName && !customerPhone)) {
      return NextResponse.json(
        { ok: false, error: "Please provide your phone number and name." },
        { status: 400 }
      );
    }

    const typeLabel = enquiryType === "test_drive"
      ? `Test Drive (${testDriveMode === "home" ? "Home Test Drive" : "Visit Hub"})`
      : "Direct Enquiry";

    const fullMessage = [
      `Vehicle: ${vehicleTitle || "Used EV"} (ID: ${vehicleId || "N/A"})`,
      `Request: ${typeLabel}`,
      preferredDate ? `Preferred Date: ${preferredDate}` : null,
      preferredTime ? `Preferred Slot: ${preferredTime}` : null,
      customerCity ? `City: ${customerCity}` : null,
      message ? `Customer Note: ${message}` : null,
    ].filter(Boolean).join(" | ");

    if (supabaseEnabled()) {
      const { error } = await supabase.from("leads").insert({
        name: customerName || "Prospective Buyer",
        phone: customerPhone,
        pincode: customerPincode || "",
        interest: vehicleTitle || "Used EV",
        message: fullMessage,
        source: `Used EV: ${typeLabel}`,
      });

      if (error) {
        console.warn("[Used Enquiry] Supabase lead insert warning:", error.message);
      }
    }

    return NextResponse.json({
      ok: true,
      message: enquiryType === "test_drive"
        ? "Test drive scheduled successfully! Our Evezy advisor will call you to confirm your slot."
        : "Enquiry submitted successfully! Our vehicle specialist will get back to you shortly.",
    });
  } catch (error: any) {
    console.error("[Used Enquiry API Error]:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
