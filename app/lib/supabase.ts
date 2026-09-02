import { createClient } from "@supabase/supabase-js";
import type { EvListing, BatteryVariant, BatterySpec, ChargingSpec } from "./wordpress";

// ── Supabase Client (server-side) ────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export function supabaseEnabled(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseConfig() {
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

export async function fetchHeroBanners() {
  if (!supabaseEnabled()) return [];
  try {
    const { data, error } = await supabase
      .from("hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("fetchHeroBanners error:", error.message);
      return [];
    }
    return (data || []).map((b: any) => ({
      ...b,
      imageHorizontal: b.image_horizontal,
      imageVertical: b.image_vertical,
    }));
  } catch (e) {
    console.warn("fetchHeroBanners exception:", e);
    return [];
  }
}

export async function fetchProductContent(productSlug: string) {
  if (!supabaseEnabled() || !productSlug) return [];
  try {
    const { data, error } = await supabase
      .from("product_content")
      .select("*")
      .eq("product_slug", productSlug)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("fetchProductContent error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("fetchProductContent exception:", e);
    return [];
  }
}

export async function fetchLatestUpdates(limit = 3) {
  if (!supabaseEnabled()) return [];
  try {
    const { data, error } = await supabase
      .from("product_content")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("fetchLatestUpdates error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("fetchLatestUpdates exception:", e);
    return [];
  }
}

export async function fetchArticleById(id: string) {
  if (!supabaseEnabled() || !id) return null;
  try {
    const { data, error } = await supabase
      .from("product_content")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.warn("fetchArticleById error:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.warn("fetchArticleById exception:", e);
    return null;
  }
}

export async function fetchProductOffers(brand: string, slug: string) {
  if (!supabaseEnabled()) return [];
  try {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .or(`product_slug.eq.${slug},and(product_slug.is.null,brand.ilike.%${brand}%)`)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.warn("fetchProductOffers error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("fetchProductOffers exception:", e);
    return [];
  }
}

// ── Database Row Types ───────────────────────────────────────────────────────


export type EvListingRow = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  body_type: string;
  usage_type?: string | null;
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
  discontinued?: boolean;
  discontinued_date?: string | null;
  video_links?: Array<{ url: string; title?: string; variantId?: string | null; variantName?: string | null }>;
  featured_photos?: Array<{ url: string; variantId?: string | null; variantName?: string | null }>;
  city_pricing?: Array<{
    id?: string;
    location_name: string;
    location_type: "City" | "District";
    showroom_price: string;
    on_road_price: string;
    variant_id?: string | null;
  }> | null;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by_email?: string;
  editors_emails?: string[];
  featured?: boolean;
  deleted?: boolean;
  deleted_at?: string | null;
  coming_soon?: boolean;
  announced?: boolean;
  concept?: boolean;
  facelift?: boolean;
};

export type EvVariantRow = {
  id: string;
  listing_id: string;
  variant_name: string;
  slug: string;
  model_year: number;
  price: number | null;
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
  baas_monthly_rental: number | null;
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
  discontinued?: boolean;
  discontinued_date?: string | null;
  usage_type?: string | null;
  continuing_variant_id?: string | null;
  launch_date?: string | null;
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
  const standardVariants: BatteryVariant[] = variants.map((v) => {
    const customFields = (v as any).custom_fields || [];
    const hasColorCf = customFields.find((cf: any) => cf.label === "_has_exclusive_color");
    const colorsCf = customFields.find((cf: any) => cf.label === "_exclusive_colors");
    const has_exclusive_color = hasColorCf?.value === "true";
    const exclusive_colors = colorsCf?.value ? colorsCf.value.split(",").map((c: string) => c.trim()).filter(Boolean) : [];

    return {
      id: v.id,
      modelName: v.variant_name,
      capacity: v.battery_capacity_kwh ? String(v.battery_capacity_kwh) : "",
      range: v.driving_range_km ? String(v.driving_range_km) : "",
      charge: v.charging_time_mins ? String(v.charging_time_mins) : "",
      price: v.price ? String(v.price) : "",
      price_baas: v.baas_price_per_km ? String(v.baas_price_per_km) : "",
      baseprice: v.baas_upfront_price ? String(v.baas_upfront_price) : "",
      has_exclusive_color,
      exclusive_colors,
      discontinued: v.discontinued ?? false,
      discontinued_date: v.discontinued_date,
      usage_type: v.usage_type,
      continuing_variant_id: v.continuing_variant_id,
      baas_monthly_rental: v.baas_monthly_rental ? String(v.baas_monthly_rental) : "",
      launch_date: v.launch_date || null,
    };
  });

  // BAAS variants (only those with has_baas)
  const baasVariants: BatteryVariant[] = variants
    .filter((v) => v.has_baas === true || (v.has_baas as any) === "true")
    .map((v) => {
      const customFields = (v as any).custom_fields || [];
      const hasColorCf = customFields.find((cf: any) => cf.label === "_has_exclusive_color");
      const colorsCf = customFields.find((cf: any) => cf.label === "_exclusive_colors");
      const has_exclusive_color = hasColorCf?.value === "true";
      const exclusive_colors = colorsCf?.value ? colorsCf.value.split(",").map((c: string) => c.trim()).filter(Boolean) : [];

      return {
        id: v.id,
        modelName: v.variant_name,
        capacity: v.battery_capacity_kwh ? String(v.battery_capacity_kwh) : "",
        range: v.driving_range_km ? String(v.driving_range_km) : "",
        charge: v.charging_time_mins ? String(v.charging_time_mins) : "",
        price: v.baas_upfront_price ? String(v.baas_upfront_price) : "",
        price_baas: v.baas_price_per_km ? String(v.baas_price_per_km) : "",
        baseprice: v.baas_upfront_price ? String(v.baas_upfront_price) : "",
        has_exclusive_color,
        exclusive_colors,
        discontinued: v.discontinued ?? false,
        discontinued_date: v.discontinued_date,
        usage_type: v.usage_type,
        continuing_variant_id: v.continuing_variant_id,
        baas_monthly_rental: v.baas_monthly_rental ? String(v.baas_monthly_rental) : "",
        launch_date: v.launch_date || null,
      };
    });

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
    body_type: row.body_type,
    usage_type: row.usage_type,
    date: row.created_at,
    photo: row.photo || (() => {
      const parsed = typeof row.featured_photos === "string" ? (() => { try { return JSON.parse(row.featured_photos); } catch { return []; } })() : row.featured_photos;
      const list = Array.isArray(parsed) ? parsed : [];
      return list.find((p: any) => !p.variantId)?.url || list[0]?.url || galleryUrls[0] || "";
    })(),
    brand: (() => {
      const b = row.brand ? row.brand.trim().toUpperCase() : "";
      return b === "TATA" ? "TATA MOTORS" : b;
    })(),
    types: row.types ?? [],
    price_bracket: row.price_bracket || "",
    prices: prices.length > 0 ? prices : [],
    topSpeed: topSpeed ? Number(topSpeed) : null,
    commercial: row.commercial ?? false,
    launchdate: row.launchdate,
    discontinued: row.discontinued ?? false,
    discontinued_date: row.discontinued_date,
    featured: row.featured ?? false,
    deleted: row.deleted ?? false,
    deleted_at: row.deleted_at ?? null,
    coming_soon: row.coming_soon ?? false,
    announced: row.announced ?? false,
    concept: row.concept ?? false,
    facelift: row.facelift ?? false,
    video_links: (() => {
      const parsed = typeof row.video_links === "string" ? (() => { try { return JSON.parse(row.video_links); } catch { return []; } })() : row.video_links;
      return Array.isArray(parsed) ? parsed : [];
    })(),
    featured_photos: (() => {
      const parsed = typeof row.featured_photos === "string" ? (() => { try { return JSON.parse(row.featured_photos); } catch { return []; } })() : row.featured_photos;
      const list = Array.isArray(parsed) ? parsed : [];
      return list.length > 0 ? list : (row.photo ? [{ url: row.photo, variantId: null }] : []);
    })(),
    batteryVariants: standardVariants,
    baasVariants,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    colors: row.colors ?? [],
    galleryImages: galleryUrls,
    gallery_raw: (() => {
      const parsed = typeof row.gallery_images === "string" ? (() => { try { return JSON.parse(row.gallery_images); } catch { return []; } })() : row.gallery_images;
      return Array.isArray(parsed) ? parsed : [];
    })(),
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
    variantFeatures: variants.map((v) => {
      const allSecs = (v as { extra_sections?: Array<{ title: string; fields: Array<{ label: string; value: string }> }> }).extra_sections ?? [];
      const drivingModesSec = allSecs.find((s: any) => s.title === "Driving Modes");
      return {
        variantName: v.variant_name,
        ...(features?.get(v.id) ?? {}),
        extra_modes: (v as any).extra_modes || drivingModesSec?.fields || [],
      };
    }),
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
    city_pricing: (() => {
      const parsed = typeof row.city_pricing === "string" ? (() => { try { return JSON.parse(row.city_pricing); } catch { return []; } })() : row.city_pricing;
      return Array.isArray(parsed) ? parsed : [];
    })(),
  };
}

// ── Fetch Functions ──────────────────────────────────────────────────────────

export async function fetchEvListingsFromSupabase(limit = 50): Promise<EvListing[]> {
  if (!supabaseEnabled()) return [];

  const { data: listings, error } = await supabase
    .from("evlistings")
    .select("*")
    .or("deleted.is.null,deleted.eq.false")
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
    .or("deleted.is.null,deleted.eq.false")
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

export async function fetchCityPrices(variantIds: string[]) {
  if (!variantIds.length) return [];
  const { data } = await supabase
    .from("ev_city_prices")
    .select("*")
    .in("variant_id", variantIds)
    .order("city");
  return data ?? [];
}

export async function fetchBrandRankings(): Promise<import("./brand-rankings").BrandRankItem[]> {
  const { DEFAULT_BRAND_RANKS } = await import("./brand-rankings");
  if (!supabaseEnabled()) return DEFAULT_BRAND_RANKS;
  try {
    const { data, error } = await supabase
      .from("brand_rankings")
      .select("*")
      .eq("is_active", true)
      .order("rank", { ascending: true });

    if (error || !data || !data.length) {
      return DEFAULT_BRAND_RANKS;
    }
    return data as import("./brand-rankings").BrandRankItem[];
  } catch {
    return DEFAULT_BRAND_RANKS;
  }
}
