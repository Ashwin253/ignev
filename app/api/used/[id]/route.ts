import { NextResponse } from "next/server";
import { getUsedVehicleBySlug, mapRowToUsedVehicle } from "../../../lib/used-vehicles";
import { supabaseEnabled, supabaseAsUser, bearerToken } from "../../../lib/supabase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vehicle = await getUsedVehicleBySlug(id);
    if (!vehicle) {
      return NextResponse.json({ ok: false, error: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: vehicle });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    const allowed = [
      "title", "brand", "model", "variant", "year", "reg_month_year", "body_type",
      "odometer_km", "ownership", "price", "original_price", "emi_starting",
      "city", "state", "rto", "registration_number", "color",
      "battery_capacity_kwh", "battery_health_percentage", "real_range_km", "certified_range_km",
      "charging_time_hours", "fast_charging_minutes", "motor_power_ps", "motor_torque_nm",
      "warranty_remaining", "insurance_type", "insurance_valid_till",
      "source_type", "seller_name", "seller_phone", "seller_location",
      "photo", "gallery_images", "images_360", "media_images", "inspection_rating",
      "inspection_summary", "features", "pros", "imperfections",
      "status", "cta_action", "featured", "slug"
    ];

    for (const key of allowed) {
      if (key in body) {
        if (key === "brand") updates[key] = String(body[key]).toUpperCase().trim();
        else updates[key] = body[key];
      }
    }

    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Vehicle was not updated." },
        { status: 503 }
      );
    }

    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to update a vehicle." },
        { status: 401 }
      );
    }

    const { data, error } = await db
      .from("used_vehicles")
      .update(updates)
      .or(`id.eq.${id},slug.eq.${id}`)
      .select()
      .single();

    if (error) {
      console.error("[API used PUT] Update failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: mapRowToUsedVehicle(data) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Vehicle was not deleted." },
        { status: 503 }
      );
    }
    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to delete a vehicle." },
        { status: 401 }
      );
    }

    const { error } = await db
      .from("used_vehicles")
      .delete()
      .or(`id.eq.${id},slug.eq.${id}`);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Vehicle deleted successfully." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
