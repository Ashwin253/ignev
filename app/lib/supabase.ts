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
  price_bracket?: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by_email?: string;
  editors_emails?: string[];
};

export type EvVariantRow = {
  id: string;
  listing_id: string;
  variant_name: string;
  slug: string;
  model_year: number;
  price: number;
  top_speed: string | null;
  battery_capacity_kwh: string | null;
  driving_range_km: string | null;
  charging_time_mins: string | null;
  max_power_bhp: string | null;
  max_torque_nm: string | null;
  has_baas: boolean;
  baas_price_per_km: string | null;
  baas_upfront_price: string | null;
  baas_model_name: string;
  charging_time_ac_hours: string | null;
  charging_time_dc_mins: string | null;
  max_dc_charging_rate_kw: string | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  wheelbase_mm?: number | null;
  ground_clearance_mm?: number | null;
  boot_space_litres?: number | null;
  turning_radius_m?: number | null;
  acceleration?: string | null;
  battery_type?: string | null;
  battery_portability?: string | null;
  charger_type?: string | null;
  charger_output?: string | null;
  charger_cost_included?: string | null;
  kerb_weight_kg?: string | null;
  seat_length_mm?: string | null;
  seat_height_mm?: string | null;
  braking_system?: string | null;
  wheel_type?: string | null;
  front_wheel_size?: string | null;
  rear_wheel_size?: string | null;
  front_suspension?: string | null;
  rear_suspension?: string | null;
  chassis_type?: string | null;
  battery_warranty?: string | null;
  motor_warranty?: string | null;
  created_at: string;
  updated_at: string;
};

export type EvVariantFeatureRow = {
  variant_id: string;
  front_brakes: string;
  rear_brakes: string;
  drivetrain: string;
  seating_capacity: string | null;
  ground_clearance_mm: string | null;
  boot_space_litres: string | null;
  wheel_size_inches: string | null;
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
  screen_size_inches: string | null;
  speaker_count: string | null;
  has_wireless_carplay_android_auto: boolean;
  has_connected_car_app: boolean;
  has_ota_updates: boolean;
  airbag_count: string | null;
  has_abs: boolean;
  has_ebd: boolean;
  has_esp: boolean;
  has_tpms: boolean;
  has_360_camera: boolean;
  adas_level: string | null;
  ncap_safety_rating: string | null;
  has_speedometer_digital?: boolean;
  has_odometer_digital?: boolean;
  has_voice_assist?: boolean;
  has_stand_alarm?: boolean;
  has_low_battery_indicator?: boolean;
  has_clock?: boolean;
  has_call_sms_alert?: boolean;
  has_tripmeter?: boolean;
  has_boot_storage?: boolean;
  has_usb_charging_port?: boolean;
  has_keyless_lock_unlock?: boolean;
  has_start_type_self?: boolean;
  has_reverse_mode?: boolean;
  has_boot_light?: boolean;
  has_tail_light?: boolean;
  has_break_light?: boolean;
  has_turn_signal?: boolean;
  has_drls?: boolean;
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
    ? Array.from(new Set(variants.map((v) => v.price).filter(Boolean))).map(String)
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
    extraSpecs: [
      v.acceleration ? { label: "Acceleration", value: v.acceleration } : null,
      ...((v as any).extra_motor || [])
    ].filter(Boolean),
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
    extraSpecs: [
      v.battery_type ? { label: "Battery Type", value: v.battery_type } : null,
      v.battery_portability ? { label: "Battery Portability", value: v.battery_portability } : null,
      v.charger_type ? { label: "Charger Type", value: v.charger_type } : null,
      v.charger_output ? { label: "Charger Output", value: v.charger_output } : null,
      v.charger_cost_included ? { label: "Charger Cost Included", value: v.charger_cost_included } : null,
      ...((v as any).extra_charging || [])
    ].filter(Boolean),
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
    price_bracket: row.price_bracket || "",
    prices: prices.length > 0 ? prices : [],
    topSpeed: topSpeed ? Number(topSpeed) : null,
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
      extraSpecs: [
        v.kerb_weight_kg ? { label: "Kerb Weight", value: `${v.kerb_weight_kg} kg` } : null,
        v.seat_length_mm ? { label: "Seat Length", value: `${v.seat_length_mm} mm` } : null,
        v.seat_height_mm ? { label: "Seat Height", value: `${v.seat_height_mm} mm` } : null,
        ...((v as { extra_dimensions?: Array<{ label: string; value: string }> }).extra_dimensions ?? [])
      ].filter(Boolean) as any,
    })),
    variantFeatures: variants.map((v) => ({
      variantName: v.variant_name,
      ...(features?.get(v.id) ?? {}),
    })),
    variantExtraSections: variants.map((v) => {
      const builtInSections = [
        {
          title: "Brakes & Wheels",
          fields: [
            v.braking_system ? { label: "Braking System", value: v.braking_system } : null,
            v.wheel_type ? { label: "Wheel Type", value: v.wheel_type } : null,
            v.front_wheel_size ? { label: "Front Wheel Size", value: v.front_wheel_size } : null,
            v.rear_wheel_size ? { label: "Rear Wheel Size", value: v.rear_wheel_size } : null
          ].filter(Boolean)
        },
        {
          title: "Suspension & Chassis",
          fields: [
            v.front_suspension ? { label: "Front Suspension", value: v.front_suspension } : null,
            v.rear_suspension ? { label: "Rear Suspension", value: v.rear_suspension } : null,
            v.chassis_type ? { label: "Chassis Type", value: v.chassis_type } : null
          ].filter(Boolean)
        },
        {
          title: "Warranty",
          fields: [
            v.battery_warranty ? { label: "Battery Warranty", value: v.battery_warranty } : null,
            v.motor_warranty ? { label: "Motor Warranty", value: v.motor_warranty } : null
          ].filter(Boolean)
        }
      ].filter(s => s.fields.length > 0);

      return {
        variantName: v.variant_name,
        sections: [...builtInSections, ...((v as { extra_sections?: Array<{ title: string; fields: Array<{ label: string; value: string }> }> }).extra_sections ?? [])] as any,
      };
    }),
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

  const decodedSlug = decodeURIComponent(slug);
  const spacedSlug = decodedSlug.replace(/-/g, " ");
  const hyphenatedSlug = decodedSlug.replace(/\s+/g, "-");

  const { data: listing, error } = await supabase
    .from("evlistings")
    .select("*")
    .or(`slug.eq."${slug}",slug.eq."${decodedSlug}",slug.eq."${spacedSlug}",slug.eq."${hyphenatedSlug}"`)
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
