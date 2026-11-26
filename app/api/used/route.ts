import { NextResponse } from "next/server";
import { getUsedVehicles, mapRowToUsedVehicle } from "../../lib/used-vehicles";
import { supabaseEnabled, supabaseAsUser, bearerToken } from "../../lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand") || undefined;
    const body_type = searchParams.get("body_type") || undefined;
    const city = searchParams.get("city") || undefined;
    const source_type = searchParams.get("source_type") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const max_price = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
    const max_km = searchParams.get("max_km") ? Number(searchParams.get("max_km")) : undefined;
    const min_battery_health = searchParams.get("min_battery_health") ? Number(searchParams.get("min_battery_health")) : undefined;

    const vehicles = await getUsedVehicles({
      brand,
      body_type,
      city,
      source_type,
      status,
      search,
      max_price,
      max_km,
      min_battery_health,
    });

    return NextResponse.json({ ok: true, data: vehicles });
  } catch (error) {
    console.error("[API used GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.brand || !body.price) {
      return NextResponse.json(
        { ok: false, error: "Title, brand and price are required." },
        { status: 400 }
      );
    }

    const brand = String(body.brand).toUpperCase().trim();
    const model = String(body.model || body.title).trim();
    const year = Number(body.year) || new Date().getFullYear();
    const listingType = body.listing_type === "inventory" ? "inventory" : "detailed";
    const rawSlug = (body.slug || `${year}-${brand}-${model}-${body.variant || ""}-${body.city || "noida"}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const slug = rawSlug || `ev-used-${Date.now()}`;

    const newVehicleData = {
      slug,
      title: body.title,
      brand,
      model,
      variant: body.variant || "",
      year,
      reg_month_year: body.reg_month_year || "",
      body_type: body.body_type || "SUV",
      odometer_km: Number(body.odometer_km) || 0,
      ownership: body.ownership || "1st Owner",
      listing_type: listingType,
      stock_left: listingType === "inventory" ? Math.max(0, Number(body.stock_left) || 0) : 0,
      price: Number(body.price) || 0,
      original_price: body.original_price ? Number(body.original_price) : null,
      emi_starting: body.emi_starting ? Number(body.emi_starting) : Math.round((Number(body.price) || 0) * 0.0195),
      city: body.city || "Noida",
      state: body.state || "Delhi NCR",
      rto: body.rto || "",
      registration_number: body.registration_number || "",
      color: body.color || "",
      battery_capacity_kwh: body.battery_capacity_kwh ? Number(body.battery_capacity_kwh) : null,
      battery_health_percentage: body.battery_health_percentage ? Number(body.battery_health_percentage) : 95,
      real_range_km: body.real_range_km ? Number(body.real_range_km) : null,
      certified_range_km: body.certified_range_km ? Number(body.certified_range_km) : null,
      charging_time_hours: body.charging_time_hours ? Number(body.charging_time_hours) : null,
      fast_charging_minutes: body.fast_charging_minutes ? Number(body.fast_charging_minutes) : null,
      motor_power_ps: body.motor_power_ps ? Number(body.motor_power_ps) : null,
      motor_torque_nm: body.motor_torque_nm ? Number(body.motor_torque_nm) : null,
      warranty_remaining: body.warranty_remaining || "",
      insurance_type: body.insurance_type || "Comprehensive",
      insurance_valid_till: body.insurance_valid_till || "",
      source_type: body.source_type || "direct",
      seller_name: body.seller_name || "Evplse Assured Hub",
      seller_phone: body.seller_phone || "",
      seller_location: body.seller_location || "",
      photo: body.photo || "",
      gallery_images: body.gallery_images || [],
      images_360: body.images_360 || [],
      media_images: body.media_images || [],
      inspection_rating: Number(body.inspection_rating) || 4.8,
      inspection_summary: body.inspection_summary || [],
      features: body.features || [],
      pros: body.pros || [],
      imperfections: body.imperfections || [],
      status: body.status || "available",
      cta_action: body.cta_action || "both",
      featured: Boolean(body.featured),
    };

    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Vehicle was not saved." },
        { status: 503 }
      );
    }

    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to add a vehicle." },
        { status: 401 }
      );
    }

    const { data, error } = await db
      .from("used_vehicles")
      .insert(newVehicleData)
      .select()
      .single();

    if (error) {
      console.error("[API used POST] Supabase insert error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: mapRowToUsedVehicle(data) });
  } catch (error) {
    console.error("[API used POST] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
