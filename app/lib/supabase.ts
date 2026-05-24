import { createClient } from "@supabase/supabase-js";
import type { EvListing, BatteryVariant, EnergyCompareEntry, BatterySpec, ChargingSpec } from "./wordpress";

// ── Supabase Client (server-side) ────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function supabaseEnabled(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/** Expose config for client components (passed via server component props) */
export function getSupabaseConfig() {
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

// ── Database Row Type ─────────────────────────────────────────────────────────

export type EvListingRow = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  types: string[];
  price: string;
  top_speed: number | null;
  commercial: boolean;
  launchdate: string | null;
  photo: string;
  gallery_images: Array<string | { url: string; type?: string; colorCode?: string }>;
  colors: string[];
  battery_variants: BatteryVariant[];
  baas_variants: BatteryVariant[];
  has_baas: boolean;
  pros: string[];
  cons: string[];
  energy_comparison: EnergyCompareEntry[];
  battery_specs: BatterySpec[];
  charging_specs: ChargingSpec[];
  body_type: string;
  created_at: string;
  updated_at: string;
};

// ── Map DB row → EvListing ───────────────────────────────────────────────────

function mapRowToEvListing(row: EvListingRow): EvListing {
  const allVariants = row.battery_variants ?? [];
  
  // Standard variants = all variants (shown with standard price)
  const standardVariants = allVariants.map((v: any) => ({
    modelName: v.modelName || "",
    capacity: v.capacity || "",
    range: v.range || "",
    charge: v.charge || "",
    price: v.price || "",
    price_baas: v.price_baas || "",
    baseprice: v.baseprice || "",
    maxPower: v.maxPower || "",
    maxTorque: v.maxTorque || "",
  }));

  // BAAS variants = only those with has_baas checked, using BAAS-specific pricing
  const baasVariants = allVariants
    .filter((v: any) => v.has_baas)
    .map((v: any) => ({
      modelName: v.baas_modelName || v.modelName || "",
      capacity: v.capacity || "",
      range: v.baas_range || v.range || "",
      charge: v.baas_charge || v.charge || "",
      price: v.baseprice || "", // upfront price for BAAS
      price_baas: v.price_baas || "",
      baseprice: v.baseprice || "",
      maxPower: v.maxPower || "",
      maxTorque: v.maxTorque || "",
    }));

  const hasBaas = row.has_baas || baasVariants.length > 0;

  // Extract photo from gallery if needed
  const galleryUrls = (row.gallery_images ?? []).map((item) => typeof item === "string" ? item : (item as any).url ?? "").filter(Boolean);

  return {
    id: row.id,
    databaseId: 0,
    title: row.title,
    slug: row.slug,
    date: row.created_at,
    photo: row.photo || galleryUrls[0] || "",
    brand: row.brand,
    types: row.types ?? [],
    prices: row.price ? [row.price] : [],
    topSpeed: row.top_speed,
    commercial: row.commercial ?? false,
    launchdate: row.launchdate,
    batteryVariants: standardVariants,
    baasVariants: baasVariants,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    colors: row.colors ?? [],
    galleryImages: galleryUrls,
    energyComparison: row.energy_comparison ?? [],
    batterySpecs: row.battery_specs ?? [],
    chargingSpecs: row.charging_specs ?? [],
    offers: [],
    batteryTypes: [],
    baas: hasBaas,
  };
}

// ── Fetch Functions ──────────────────────────────────────────────────────────

export async function fetchEvListingsFromSupabase(limit = 50): Promise<EvListing[]> {
  if (!supabaseEnabled()) return [];
  const { data, error } = await supabase
    .from("evlistings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as EvListingRow[]).map(mapRowToEvListing);
}

export async function fetchEvListingBySlugFromSupabase(slug: string): Promise<EvListing | null> {
  if (!supabaseEnabled()) return null;
  const { data, error } = await supabase
    .from("evlistings")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return mapRowToEvListing(data as EvListingRow);
}
