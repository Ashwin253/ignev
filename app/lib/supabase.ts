import { createClient } from "@supabase/supabase-js";
import type { EvListing, BatteryVariant, BatterySpec, ChargingSpec } from "./wordpress";

// ── Supabase Client (server-side) ────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function supabaseEnabled(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseConfig() {
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

// ── Database Row Types ───────────────────────────────────────────────────────

export type EvListingRow = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  body_type: string;
  commercial: boolean;
  launchdate: string | null;
  photo: string;
  gallery_images: Array<string | { url: string; type?: string; colorCode?: string }>;
  colors: string[];
  types: string[];
  pros: string[];
  cons: string[];
  has_baas: boolean;
  created_at: string;
  updated_at: string;
};

export type EvVariantRow = {
  id: string;
  listing_id: string;
  variant_name: string;
  slug: string;
  model_year: number;
  price: number;
  top_speed: number | null;
  battery_capacity_kwh: number | null;
  driving_range_km: number | null;
  charging_time_mins: number | null;
  max_power_bhp: number | null;
  max_torque_nm: number | null;
  has_baas: boolean;
  baas_price_per_km: number | null;
  baas_upfront_price: number | null;
  baas_model_name: string;
  charging_time_ac_hours: number | null;
  charging_time_dc_mins: number | null;
  max_dc_charging_rate_kw: number | null;
  created_at: string;
  updated_at: string;
};

export type EvVariantFeatureRow = {
  variant_id: string;
  front_brakes: string;
  rear_brakes: string;
  drivetrain: string;
  seating_capacity: number;
  ground_clearance_mm: number | null;
  boot_space_litres: number | null;
  wheel_size_inches: number | null;
  has_rear_wiper: boolean;
  has_rear_defogger: boolean;
  has_rain_sensing_wipers: boolean;
  headlight_type: string;
  has_sunroof: boolean;
  is_panoramic_sunroof: boolean;
  has_rear_ac_vents: boolean;
  has_ventilated_seats: boolean;
  has_climate_control: boolean;
  has_cruise_control: boolean;
  has_wireless_charger: boolean;
  has_keyless_entry: boolean;
  screen_size_inches: number | null;
  speaker_count: number;
  has_wireless_carplay_android_auto: boolean;
  has_connected_car_app: boolean;
  has_ota_updates: boolean;
  airbag_count: number;
  has_abs_ebd: boolean;
  has_esp: boolean;
  has_tpms: boolean;
  has_360_camera: boolean;
  adas_level: number;
  ncap_safety_rating: number | null;
};

// ── Map DB rows → EvListing ──────────────────────────────────────────────────

function mapToEvListing(row: EvListingRow, variants: EvVariantRow[], features?: Map<string, any>): EvListing {
  const galleryUrls = (row.gallery_images ?? []).map((item) =>
    typeof item === "string" ? item : (item as any).url ?? ""
  ).filter(Boolean);

  // Standard variants (all)
  const standardVariants: BatteryVariant[] = variants.map((v) => ({
    modelName: v.variant_name,
    capacity: v.battery_capacity_kwh ? String(v.battery_capacity_kwh) : "",
    range: v.driving_range_km ? String(v.driving_range_km) : "",
    charge: v.charging_time_mins ? String(v.charging_time_mins) : "",
    price: v.price ? String(v.price) : "",
    price_baas: v.baas_price_per_km ? String(v.baas_price_per_km) : "",
    baseprice: v.baas_upfront_price ? String(v.baas_upfront_price) : "",
  }));

  // BAAS variants (only those with has_baas)
  const baasVariants: BatteryVariant[] = variants
    .filter((v) => v.has_baas === true || (v.has_baas as any) === "true")
    .map((v) => ({
      modelName: v.baas_model_name || v.variant_name,
      capacity: v.battery_capacity_kwh ? String(v.battery_capacity_kwh) : "",
      range: v.driving_range_km ? String(v.driving_range_km) : "",
      charge: v.charging_time_mins ? String(v.charging_time_mins) : "",
      price: v.baas_upfront_price ? String(v.baas_upfront_price) : "",
      price_baas: v.baas_price_per_km ? String(v.baas_price_per_km) : "",
      baseprice: v.baas_upfront_price ? String(v.baas_upfront_price) : "",
    }));

  const hasBaas = row.has_baas || variants.some((v) => v.has_baas === true || (v.has_baas as any) === "true");
  const topSpeed = variants[0]?.top_speed ?? null;
  const prices = variants.length > 0
    ? [...new Set(variants.map((v) => v.price).filter(Boolean))].map(String)
    : [];

  // Build battery specs from variants
  const batterySpecs: BatterySpec[] = variants.map((v) => ({
    variantName: v.variant_name,
    electricMotor: "",
    maxPower: v.max_power_bhp ? String(v.max_power_bhp) : "",
    maxTorque: v.max_torque_nm ? String(v.max_torque_nm) : "",
    engine: "",
    emissionStandard: "",
    turboSupercharger: "0",
    idleStartStop: "0",
    extraSpecs: (v as any).extra_motor || [],
  }));

  // Build charging specs from variants
  const chargingSpecs: ChargingSpec[] = variants.map((v) => ({
    variantName: v.variant_name,
    acRegularCharging: v.charging_time_ac_hours ? `${v.charging_time_ac_hours} hrs` : "",
    dcFastCharging: v.charging_time_dc_mins ? `${v.charging_time_dc_mins} min` : "",
    acFastCharging: "",
    drivingRange: v.driving_range_km ? `${v.driving_range_km} km` : "",
    chargingOptions: v.max_dc_charging_rate_kw ? `Up to ${v.max_dc_charging_rate_kw} kW DC` : "",
    chargerIncluded: "",
    chargerConnectionType: "",
    extraSpecs: (v as any).extra_charging || [],
  }));

  return {
    id: row.id,
    databaseId: 0,
    title: row.title,
    slug: row.slug,
    date: row.created_at,
    photo: row.photo || galleryUrls[0] || "",
    brand: row.brand,
    types: row.types ?? [],
    prices: prices.length > 0 ? prices : [],
    topSpeed,
    commercial: row.commercial ?? false,
    launchdate: row.launchdate,
    batteryVariants: standardVariants,
    baasVariants,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    colors: row.colors ?? [],
    galleryImages: galleryUrls,
    energyComparison: [],
    batterySpecs,
    chargingSpecs,
    offers: [],
    batteryTypes: [],
    baas: hasBaas,
    variantDimensions: variants.map((v) => ({
      variantName: v.variant_name,
      length_mm: (v as any).length_mm ?? undefined,
      width_mm: (v as any).width_mm ?? undefined,
      height_mm: (v as any).height_mm ?? undefined,
      wheelbase_mm: (v as any).wheelbase_mm ?? undefined,
      ground_clearance_mm: (v as any).ground_clearance_mm ?? undefined,
      boot_space_litres: (v as any).boot_space_litres ?? undefined,
      turning_radius_m: (v as any).turning_radius_m ?? undefined,
      extraSpecs: (v as { extra_dimensions?: Array<{ label: string; value: string }> }).extra_dimensions ?? [],
    })),
    variantFeatures: variants.map((v) => ({
      variantName: v.variant_name,
      ...(features?.get(v.id) ?? {}),
    })),
    variantExtraSections: variants.map((v) => ({
      variantName: v.variant_name,
      sections: (v as { extra_sections?: Array<{ title: string; fields: Array<{ label: string; value: string }> }> }).extra_sections ?? [],
    })),
    variantCustomFields: variants.map((v) => ({
      variantName: v.variant_name,
      fields: (v as { custom_fields?: Array<{ label: string; value: string }> }).custom_fields ?? [],
    })),
  };
}

// ── Fetch Functions ──────────────────────────────────────────────────────────

export async function fetchEvListingsFromSupabase(limit = 50): Promise<EvListing[]> {
  if (!supabaseEnabled()) return [];

  const { data: listings, error } = await supabase
    .from("evlistings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !listings?.length) return [];

  // Fetch all variants for these listings in one query
  const listingIds = listings.map((l: EvListingRow) => l.id);
  const { data: allVariants } = await supabase
    .from("ev_variants")
    .select("*")
    .in("listing_id", listingIds)
    .order("price", { ascending: true });

  const variantsByListing = new Map<string, EvVariantRow[]>();
  for (const v of (allVariants ?? []) as EvVariantRow[]) {
    const arr = variantsByListing.get(v.listing_id) ?? [];
    arr.push(v);
    variantsByListing.set(v.listing_id, arr);
  }

  return (listings as EvListingRow[]).map((row) =>
    mapToEvListing(row, variantsByListing.get(row.id) ?? [])
  );
}

export async function fetchEvListingBySlugFromSupabase(slug: string): Promise<EvListing | null> {
  if (!supabaseEnabled()) return null;

  const { data: listing, error } = await supabase
    .from("evlistings")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !listing) return null;

  const { data: variants } = await supabase
    .from("ev_variants")
    .select("*")
    .eq("listing_id", (listing as EvListingRow).id)
    .order("price", { ascending: true });

  // Fetch features for all variants
  const variantIds = ((variants ?? []) as EvVariantRow[]).map((v) => v.id);
  let featuresMap = new Map<string, any>();
  if (variantIds.length) {
    const { data: feats } = await supabase.from("ev_variant_features").select("*").in("variant_id", variantIds);
    for (const f of (feats ?? [])) featuresMap.set(f.variant_id, f);
  }

  // Fetch energy comparisons
  const { data: energyData } = await supabase
    .from("ev_energy_comparisons")
    .select("*")
    .eq("listing_id", (listing as EvListingRow).id)
    .order("created_at");

  const result = mapToEvListing(listing as EvListingRow, (variants ?? []) as EvVariantRow[], featuresMap);
  // Override energyComparison with Supabase data
  if (energyData?.length) {
    result.energyComparison = energyData.map((e: any) => ({
      name: e.name,
      fuelType: e.fuel_type === "self" ? "self" : e.fuel_type,
      mileage: e.mileage || "",
      fuelPrice: e.fuel_price || "",
      modelused: e.model_used || "",
      category: e.category || "fuel",
    }));
  }
  return result;
}

export async function fetchEnergyComparisons(listingId: string) {
  const { data } = await supabase
    .from("ev_energy_comparisons")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at");
  return data ?? [];
}
