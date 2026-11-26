import { supabase, supabaseEnabled } from "./supabase";

export type UsedVehicleSourceType = "direct" | "dealer" | "customer";
export type UsedVehicleStatus = "available" | "booked" | "sold" | "under_inspection";
export type UsedVehicleCtaAction = "both" | "test_drive" | "enquire";
export type UsedVehicleListingType = "detailed" | "inventory";
export type MediaImageCategory = "outside" | "inside" | "tyres" | "details";

export interface UsedVehicleMediaImage {
  id?: string;
  url: string;
  category: MediaImageCategory; // "outside" | "inside" | "tyres" | "details"
  title: string;
  description: string;
}

export interface UsedVehicleInspectionItem {
  category: string; // e.g. "Battery & High Voltage", "Electric Motor", "AC & Climate", "Tyres & Brakes", "Body & Paint", "Interior & Tech"
  status: "Passed" | "Attention" | "Needs Repair";
  rating?: number; // 1 to 5
  notes: string;
}

export interface UsedVehicleImperfection {
  id?: string;
  part: string; // e.g. "Rear Left Door", "Front Bumper"
  type: string; // e.g. "Minor Scratch", "Small Dent", "Touchup"
  desc: string;
  photo?: string;
}

export interface UsedVehicle {
  id: string;
  slug: string;
  title: string; // e.g. "2021 Tata Nexon EV XZ Plus"
  brand: string; // e.g. "TATA"
  model: string; // e.g. "Nexon EV"
  variant: string; // e.g. "XZ Plus"
  year: number; // e.g. 2021
  reg_month_year?: string; // e.g. "July 2021"
  body_type: string; // e.g. "SUV", "Sedan", "Hatchback", "Scooter", "Bike"
  odometer_km: number; // e.g. 32450
  ownership: string; // e.g. "1st Owner", "2nd Owner"
  /** Detailed listings describe one vehicle; inventory listings represent matching units. */
  listing_type: UsedVehicleListingType;
  /** Number of matching units still available for inventory listings. */
  stock_left: number;
  price: number; // in INR e.g. 945000 (9.45 Lakh)
  original_price?: number | null; // e.g. 1599000
  emi_starting?: number | null; // e.g. 18450
  city: string; // e.g. "Noida"
  state: string; // e.g. "Delhi NCR"
  rto?: string; // e.g. "UP16"
  registration_number?: string; // e.g. "UP16-CR-3406"
  color?: string; // e.g. "Signature Teal Blue"

  // EV Specifics
  battery_capacity_kwh?: number | null; // e.g. 30.2
  battery_health_percentage?: number | null; // e.g. 94 (SoH)
  real_range_km?: number | null; // e.g. 220
  certified_range_km?: number | null; // e.g. 312
  charging_time_hours?: number | null; // e.g. 8.5
  fast_charging_minutes?: number | null; // e.g. 60
  motor_power_ps?: number | null; // e.g. 129
  motor_torque_nm?: number | null; // e.g. 245
  warranty_remaining?: string; // e.g. "Battery & Motor valid till Jul 2029 / 1,60,000 km"
  insurance_type?: string; // e.g. "Comprehensive (Zero Dep)"
  insurance_valid_till?: string; // e.g. "November 2026"

  // Source Information
  source_type: UsedVehicleSourceType; // "direct" | "dealer" | "customer"
  seller_name?: string; // e.g. "Evplse Assured Hub (Sector 4 Noida)"
  seller_phone?: string;
  seller_location?: string; // e.g. "Sector 4, Noida, UP"
  dealer_id?: string | null;

  // Media
  photo: string; // Cover image
  gallery_images: string[];
  images_360: string[]; // 8 clockwise frames: Front, Front-Right, Right, Rear-Right, Rear, Rear-Left, Left, Front-Left
  media_images?: UsedVehicleMediaImage[]; // Categorized inside/outside images with descriptions

  // Inspection & condition
  inspection_rating: number; // e.g. 4.8 / 5
  inspection_summary: UsedVehicleInspectionItem[];
  features: string[]; // e.g. ["Electric Sunroof", "Harman Sound System", "Fast Charging", "Rear View Camera"]
  pros: string[];
  imperfections: UsedVehicleImperfection[];

  // Action configuration
  status: UsedVehicleStatus; // "available" | "booked" | "sold"
  cta_action: UsedVehicleCtaAction; // "test_drive" | "enquire" | "both"
  featured?: boolean;

  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsedVehicleFilters {
  brand?: string;
  body_type?: string;
  city?: string;
  source_type?: string;
  min_price?: number;
  max_price?: number;
  max_km?: number;
  min_battery_health?: number;
  status?: string;
  search?: string;
}

// Helper to safely parse JSON
function safeJson(val: any, fallback: any) {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Map a Supabase row to UsedVehicle
export function mapRowToUsedVehicle(row: any): UsedVehicle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: (row.brand || "").toUpperCase(),
    model: row.model || "",
    variant: row.variant || "",
    year: row.year || new Date().getFullYear(),
    reg_month_year: row.reg_month_year || "",
    body_type: row.body_type || "SUV",
    odometer_km: Number(row.odometer_km) || 0,
    ownership: row.ownership || "1st Owner",
    listing_type: (row.listing_type as UsedVehicleListingType) || "detailed",
    stock_left: Math.max(0, Number(row.stock_left) || 0),
    price: Number(row.price) || 0,
    original_price: row.original_price ? Number(row.original_price) : null,
    emi_starting: row.emi_starting ? Number(row.emi_starting) : Math.round((Number(row.price) || 0) * 0.0195),
    city: row.city || "Noida",
    state: row.state || "Delhi NCR",
    rto: row.rto || "",
    registration_number: row.registration_number || "",
    color: row.color || "",
    battery_capacity_kwh: row.battery_capacity_kwh ? Number(row.battery_capacity_kwh) : null,
    battery_health_percentage: row.battery_health_percentage ? Number(row.battery_health_percentage) : 95,
    real_range_km: row.real_range_km ? Number(row.real_range_km) : null,
    certified_range_km: row.certified_range_km ? Number(row.certified_range_km) : null,
    charging_time_hours: row.charging_time_hours ? Number(row.charging_time_hours) : null,
    fast_charging_minutes: row.fast_charging_minutes ? Number(row.fast_charging_minutes) : null,
    motor_power_ps: row.motor_power_ps ? Number(row.motor_power_ps) : null,
    motor_torque_nm: row.motor_torque_nm ? Number(row.motor_torque_nm) : null,
    warranty_remaining: row.warranty_remaining || "",
    insurance_type: row.insurance_type || "Comprehensive",
    insurance_valid_till: row.insurance_valid_till || "",
    source_type: (row.source_type as UsedVehicleSourceType) || "direct",
    seller_name: row.seller_name || "Evplse Assured Hub",
    seller_phone: row.seller_phone || "",
    seller_location: row.seller_location || "",
    dealer_id: row.dealer_id || null,
    photo: row.photo || "",
    gallery_images: safeJson(row.gallery_images, []),
    images_360: safeJson(row.images_360, []),
    media_images: safeJson(row.media_images, []),
    inspection_rating: Number(row.inspection_rating) || 4.8,
    inspection_summary: safeJson(row.inspection_summary, []),
    features: Array.isArray(row.features) ? row.features : [],
    pros: Array.isArray(row.pros) ? row.pros : [],
    imperfections: safeJson(row.imperfections, []),
    status: (row.status as UsedVehicleStatus) || "available",
    cta_action: (row.cta_action as UsedVehicleCtaAction) || "both",
    featured: Boolean(row.featured),
    created_by: row.created_by || null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

// Fetch all used vehicles from Supabase (live data only)
export async function getUsedVehicles(filters?: UsedVehicleFilters): Promise<UsedVehicle[]> {
  let list: UsedVehicle[] = [];

  if (supabaseEnabled()) {
    try {
      let query = supabase.from("used_vehicles").select("*");

      if (filters?.brand && filters.brand !== "all") {
        query = query.ilike("brand", filters.brand);
      }
      if (filters?.body_type && filters.body_type !== "all") {
        query = query.ilike("body_type", filters.body_type);
      }
      if (filters?.city && filters.city !== "all") {
        query = query.ilike("city", filters.city);
      }
      if (filters?.source_type && filters.source_type !== "all") {
        query = query.eq("source_type", filters.source_type);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.max_price) {
        query = query.lte("price", filters.max_price);
      }
      if (filters?.max_km) {
        query = query.lte("odometer_km", filters.max_km);
      }
      if (filters?.min_battery_health) {
        query = query.gte("battery_health_percentage", filters.min_battery_health);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      list = (data || []).map(mapRowToUsedVehicle);
    } catch (e) {
      console.warn("[UsedVehicles] Database query failed:", e);
    }
  }

  // Filter in memory for any remaining conditions
  if (filters) {
    if (filters.brand && filters.brand !== "all") {
      list = list.filter((v) => v.brand.toLowerCase() === filters.brand?.toLowerCase());
    }
    if (filters.body_type && filters.body_type !== "all") {
      list = list.filter((v) => v.body_type.toLowerCase() === filters.body_type?.toLowerCase());
    }
    if (filters.city && filters.city !== "all") {
      list = list.filter((v) => v.city.toLowerCase() === filters.city?.toLowerCase());
    }
    if (filters.source_type && filters.source_type !== "all") {
      list = list.filter((v) => v.source_type === filters.source_type);
    }
    if (filters.status && filters.status !== "all") {
      list = list.filter((v) => v.status === filters.status);
    }
    if (filters.max_price) {
      list = list.filter((v) => v.price <= filters.max_price!);
    }
    if (filters.max_km) {
      list = list.filter((v) => v.odometer_km <= filters.max_km!);
    }
    if (filters.min_battery_health) {
      list = list.filter((v) => (v.battery_health_percentage ?? 0) >= filters.min_battery_health!);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((v) =>
        v.title.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.variant.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        (v.seller_name && v.seller_name.toLowerCase().includes(q))
      );
    }
  }

  return list;
}

// Fetch a single used vehicle by slug or id
export async function getUsedVehicleBySlug(slugOrId: string): Promise<UsedVehicle | null> {
  const requested = decodeURIComponent(slugOrId).trim();
  const clean = requested.toLowerCase();

  // Try DB first
  if (supabaseEnabled()) {
    try {
      // Query the catalog's slug exactly as linked. Manual entries can use
      // mixed case, which must not be lowercased before an equality query.
      let { data, error } = await supabase
        .from("used_vehicles")
        .select("*")
        .eq("slug", requested)
        .maybeSingle();

      if (!error && data) {
        return mapRowToUsedVehicle(data);
      }

      // Retain support for older generated lowercase slugs.
      if (!error && requested !== clean) {
        ({ data, error } = await supabase
          .from("used_vehicles")
          .select("*")
          .eq("slug", clean)
          .maybeSingle());
        if (data) return mapRowToUsedVehicle(data);
      }

      // The helper is also used by the API. Only query the UUID column when
      // the input is actually a UUID, so normal slugs cannot invalidate it.
      if (!error && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(requested)) {
        ({ data, error } = await supabase
          .from("used_vehicles")
          .select("*")
          .eq("id", requested)
          .maybeSingle());
        if (data) return mapRowToUsedVehicle(data);
      }

      if (error) throw error;
    } catch (e) {
      console.warn("[UsedVehicle] Error fetching by slug from DB:", e);
    }
  }

  return null;
}

// Format price in Indian Rupee format (Lakhs or Lakhs & Thousands)
export function formatUsedVehiclePrice(amount: number): string {
  if (!amount || isNaN(amount)) return "₹ 0";
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return `₹${cr.replace(/\.00$/, "")} Cr`;
  }
  if (amount >= 100000) {
    const lakh = (amount / 100000).toFixed(2);
    return `₹${lakh.replace(/\.00$/, "")} Lakh`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}
