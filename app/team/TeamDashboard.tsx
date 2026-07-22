"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Pencil, Trash2, LogOut, Save, X, Loader2, ChevronDown, ChevronUp, MessageSquare, Mic, MicOff, Sparkles, Copy, Clipboard, Eye, Zap, Crop, FlipHorizontal, Download } from "lucide-react";
import type { EvListingRow, EvVariantRow } from "../lib/supabase";
import CropModal from "./CropModal";
import LeadsPanel from "./LeadsPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import MapPanel from "./MapPanel";
import FuelPricesPanel from "./FuelPricesPanel";
import ChargersPanel from "./ChargersPanel";
import BannersPanel from "./BannersPanel";
import ContentPanel from "./ContentPanel";
import OffersPanel from "./OffersPanel";
import MediaPanel from "./MediaPanel";
import ForYouLeadsPanel from "./ForYouLeadsPanel";
import ApprovalsPanel from "./ApprovalsPanel";
import VehicleApprovalsPanel from "./VehicleApprovalsPanel";
import EventsPanel from "./EventsPanel";
import { requestFcmToken } from "../lib/firebase";
import { useVoiceDictation, MicButton } from "./VoiceInput";
import { appendExtra, isCheckboxExtra, isExtraChecked, normalizeExtras, type SpecExtraItem } from "../lib/spec-extras";

const cleanNumber = (val: string): number | null => {
  if (!val || val.trim() === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const cleanInt = (val: string, fallback: number = 0): number => {
  if (!val || val.trim() === "") return fallback;
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
};

const cleanFloat = (val: string, fallback: number = 0): number => {
  if (!val || val.trim() === "") return fallback;
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
};

// Auto-convert to lakhs if someone enters full amount (e.g. 1500000 → 15)
// Only converts on blur via the MiniInput component
const cleanPriceLakh = (val: string): number => {
  if (!val || val.trim() === "") return 0;
  const num = parseFloat(val.replace(/,/g, ""));
  if (isNaN(num)) return 0;
  return num;
};
const convertToLakh = (val: number): number => {
  return val > 100000 ? parseFloat((val / 100000).toFixed(2)) : val;
};

type ListingForm = {
  slug: string; title: string; brand: string; body_type: string; usage_type?: string | null;
  commercial: boolean; has_baas: boolean; launchdate: string | null; photo: string;
  gallery_images: any[]; colors: string[]; types: string[];
  pros: string[]; cons: string[];
  price_bracket: string;
  parent_id?: string;
  editors_emails?: string[];
  discontinued: boolean;
  discontinued_date: string | null;
  featured: boolean;
  video_links: Array<{ url: string; title?: string; variantId?: string | null; variantName?: string | null }>;
  featured_photos: Array<{ url: string; variantId?: string | null; variantName?: string | null }>;
  city_pricing: Array<{
    id?: string;
    location_name: string;
    location_type: "City" | "District";
    showroom_price: string;
    on_road_price: string;
    variant_id?: string | null;
  }>;
};

export type VariantForm = {
  id?: string;
  variant_name: string;
  version_name?: string | null;
  launch_date?: string | null;
  usage_type?: string | null;
  continuing_variant_id?: string | null;
  slug: string; model_year: number; price: number;
  top_speed: string | null; battery_capacity_kwh: string | null;
  driving_range_km: string | null; charging_time_mins: string | null;
  max_power_bhp: string | null; max_torque_nm: string | null;
  has_baas: boolean; baas_price_per_km: string | null;
  baas_upfront_price: string | null; baas_model_name: string;
  charging_time_ac_hours: string | null; charging_time_dc_mins: string | null;
  max_dc_charging_rate_kw: string | null;
  baas_monthly_rental?: number | null;
  acceleration?: string | null; battery_type?: string | null; battery_portability?: string | null;
  charger_type?: string | null; charger_output?: string | null; charger_cost_included?: string | null;
  kerb_weight_kg?: string | null; seat_length_mm?: string | null; seat_height_mm?: string | null;
  length_mm?: string | null; width_mm?: string | null; height_mm?: string | null;
  ground_clearance_mm?: string | null; wheelbase_mm?: string | null; turning_radius_m?: string | null;
  braking_system?: string | null; wheel_type?: string | null; front_wheel_size?: string | null; rear_wheel_size?: string | null;
  front_suspension?: string | null; rear_suspension?: string | null; chassis_type?: string | null;
  battery_warranty?: string | null; motor_warranty?: string | null;
  discontinued?: boolean;
  discontinued_date?: string | null;
  // Features
  features?: {
    front_brakes: string; rear_brakes: string; drivetrain: string;
    seating_capacity: string | null; front_suspension: string; rear_suspension: string;
    headlight_type: string;
    has_sunroof: boolean; has_climate_control: boolean; has_cruise_control: boolean;
    has_wireless_charger: boolean; has_keyless_entry: boolean;
    screen_size_inches: string | null; speaker_count: string | null;
    has_wireless_carplay_android_auto: boolean; has_connected_car_app: boolean;
    has_ota_updates: boolean; airbag_count: string | null; has_abs: boolean; has_ebd: boolean;
    has_esp: boolean; has_tpms: boolean; has_360_camera: boolean;
    adas_level: string | null; ncap_safety_rating: string | null;
    has_speedometer_digital?: boolean; has_odometer_digital?: boolean; has_voice_assist?: boolean;
    has_stand_alarm?: boolean; has_low_battery_indicator?: boolean; has_clock?: boolean;
    has_call_sms_alert?: boolean; has_tripmeter?: boolean; has_boot_storage?: boolean;
    has_usb_charging_port?: boolean; has_start_type_self?: boolean; has_reverse_mode?: boolean;
    has_boot_light?: boolean; has_tail_light?: boolean; has_break_light?: boolean;
    has_turn_signal?: boolean; has_drls?: boolean;
    boot_storage_litres?: string;
    front_speakers?: string;
    rear_speakers?: string;
    extra_features?: Array<{ label: string; value: string; kind?: "field" | "checkbox" }>;
  };
  showFeatures?: boolean;
  has_exclusive_color?: boolean;
  exclusive_colors?: string[];
  is_detailed_variant?: boolean;
};

const emptyListing: ListingForm = {
  slug: "", title: "", brand: "", body_type: "", usage_type: null, commercial: false, has_baas: false,
  launchdate: null, photo: "", gallery_images: [], colors: [],
  types: [], pros: [], cons: [], price_bracket: "",
  parent_id: "",
  editors_emails: [],
  discontinued: false,
  discontinued_date: null,
  featured: false,
  video_links: [],
  featured_photos: [],
  city_pricing: [],
};

const emptyVariant: VariantForm = {
  variant_name: "", version_name: "", launch_date: "", slug: "", model_year: 2026, price: 0,
  usage_type: null, continuing_variant_id: null,
  top_speed: null, battery_capacity_kwh: null, driving_range_km: null,
  charging_time_mins: null, max_power_bhp: null, max_torque_nm: null,
  has_baas: false, baas_price_per_km: null, baas_upfront_price: null,
  baas_model_name: "", charging_time_ac_hours: null,
  charging_time_dc_mins: null, max_dc_charging_rate_kw: null,
  baas_monthly_rental: null,
  has_exclusive_color: false,
  exclusive_colors: [],
  discontinued: false,
  discontinued_date: null,
  is_detailed_variant: false,
};

const defaultFeatures = {
  front_brakes: "Disc", rear_brakes: "Disc", drivetrain: "FWD",
  seating_capacity: null, front_suspension: "", rear_suspension: "",
  headlight_type: "LED", has_sunroof: false, has_climate_control: false,
  has_cruise_control: false, has_wireless_charger: false, has_keyless_entry: false,
  screen_size_inches: null, speaker_count: "4",
  has_wireless_carplay_android_auto: false, has_connected_car_app: false,
  has_ota_updates: false, airbag_count: null, has_abs: true, has_ebd: true,
  has_esp: false, has_tpms: false, has_360_camera: false,
  adas_level: "0", ncap_safety_rating: null,
  has_speedometer_digital: false, has_odometer_digital: false, has_voice_assist: false,
  has_stand_alarm: false, has_low_battery_indicator: false, has_clock: false,
  has_call_sms_alert: false, has_tripmeter: false, has_boot_storage: false,
  has_usb_charging_port: false, has_start_type_self: false, has_reverse_mode: false,
  has_boot_light: false, has_tail_light: false, has_break_light: false,
  has_turn_signal: false, has_drls: false,
};

const getListingSlug = (brand: string, title: string): string => {
  const brandClean = (brand || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const titleClean = (title || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return brandClean && titleClean ? `${brandClean}-${titleClean}` : (brandClean || titleClean || "");
};

const getVariantSlug = (parentSlug: string, variant: Partial<VariantForm>): string => {
  const parts: string[] = [];
  if (parentSlug) parts.push(parentSlug);
  
  if (variant.battery_capacity_kwh) {
    const bat = String(variant.battery_capacity_kwh).trim().toLowerCase().replace(/[^a-z0-9.]/g, "");
    if (bat) parts.push(`${bat}kwh`);
  }
  
  if (variant.variant_name) {
    const name = variant.variant_name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (name) parts.push(name);
  }
  
  let year = variant.model_year ? String(variant.model_year) : "";
  if (!year && variant.launch_date) {
    const matches = variant.launch_date.match(/\d{4}/);
    if (matches) year = matches[0];
  }
  if (year) {
    parts.push(year);
  }
  
  return parts.join("-").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

const isListingSlugDefault = (slug: string, brand: string, title: string): boolean => {
  if (!slug) return true;
  const s = slug.toLowerCase().trim();
  
  const newFormat = getListingSlug(brand, title).toLowerCase().trim();
  if (s === newFormat) return true;
  
  const oldFormat = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").trim();
  if (s === oldFormat) return true;
  
  return false;
};

const isVariantSlugDefault = (slug: string, parentSlug: string, variant: Partial<VariantForm>): boolean => {
  if (!slug) return true;
  const s = slug.toLowerCase().trim();
  
  const newFormat = getVariantSlug(parentSlug, variant).toLowerCase().trim();
  if (s === newFormat) return true;
  
  const variantNameClean = (variant.variant_name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").trim();
  if (!variantNameClean) return true;
  
  const oldFormat = `${parentSlug}-${variantNameClean}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").trim();
  if (s === oldFormat) return true;
  
  const variantOnlyFormat = variantNameClean;
  if (s === variantOnlyFormat) return true;
  
  return false;
};

const getNextAvailableListingSlug = (baseSlug: string, currentId: string | null, existingListings: Array<{ id: string; slug: string }>): string => {
  let candidate = baseSlug;
  let counter = 1;
  while (existingListings.some(l => l.id !== currentId && l.slug === candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }
  return candidate;
};

const getNextAvailableVariantSlug = (
  baseSlug: string,
  currentVariantIdx: number,
  parentSlug: string,
  currentVariants: Array<{ id?: string; slug?: string; variant_name?: string; battery_capacity_kwh?: string | null; model_year?: number; launch_date?: string | null }>,
  existingListings: Array<{ id: string; slug: string; variants: Array<{ id: string; slug: string; variant_name: string }> }>,
  currentEditingListingId: string | null
): string => {
  let candidate = baseSlug;
  let counter = 1;

  const isClashing = (slugToCheck: string) => {
    const localClash = currentVariants.some((varItem, idx) => {
      if (idx === currentVariantIdx) return false;
      const otherComputed = varItem.slug || getVariantSlug(parentSlug, varItem);
      return otherComputed === slugToCheck;
    });
    if (localClash) return true;

    for (const l of existingListings) {
      if (l.id === currentEditingListingId) continue;
      for (const otherV of l.variants) {
        if ((otherV.slug || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") === slugToCheck) {
          return true;
        }
      }
    }
    return false;
  };

  while (isClashing(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }
  return candidate;
};

const PRESET_COMPETITORS = [
  // 4 Wheelers
  { "type": "4 Wheeler", "model": "Maruti Suzuki Dzire", "priceBracket": "5-10", "variants": { "petrol": "24.79", "cng": "33.73", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Swift", "priceBracket": "5-10", "variants": { "petrol": "25.75", "cng": "32.85", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Wagon R", "priceBracket": "under-5L", "variants": { "petrol": "25.19", "cng": "34.05", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Baleno", "priceBracket": "5-10", "variants": { "petrol": "22.35", "cng": "30.61", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Fronx", "priceBracket": "5-10", "variants": { "petrol": "21.79", "cng": "28.51", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Brezza", "priceBracket": "5-15", "variants": { "petrol": "22.15", "cng": "25.51", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Ertiga", "priceBracket": "5-15", "variants": { "petrol": "20.51", "cng": "26.11", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Celerio", "priceBracket": "under-5L", "variants": { "petrol": "26.68", "cng": "34.43", "ev": null } },
  { "type": "4 Wheeler", "model": "Maruti Suzuki Alto K10", "priceBracket": "under-5L", "variants": { "petrol": "24.39", "cng": "33.85", "ev": null } },
  { "type": "4 Wheeler", "model": "Hyundai Exter", "priceBracket": "5-10", "variants": { "petrol": "19.40", "cng": "27.10", "ev": null } },
  { "type": "4 Wheeler", "model": "Tata Punch", "priceBracket": "5-15", "variants": { "petrol": "20.09", "cng": "26.99", "ev": "421" } },
  { "type": "4 Wheeler", "model": "Tata Nexon", "priceBracket": "5-15", "variants": { "petrol": "17.44", "cng": "26.99", "ev": "325" } },
  { "type": "4 Wheeler", "model": "Tata Tiago", "priceBracket": "under-5L", "variants": { "petrol": "20.09", "cng": "26.49", "ev": "315" } },
  { "type": "4 Wheeler", "model": "Tata Tigor", "priceBracket": "5-10", "variants": { "petrol": "19.28", "cng": "26.49", "ev": "315" } },
  { "type": "4 Wheeler", "model": "Tata Altroz", "priceBracket": "5-10", "variants": { "petrol": "19.33", "cng": "26.20", "ev": null } },
  { "type": "4 Wheeler", "model": "Mahindra Scorpio N", "priceBracket": "15-30", "variants": { "petrol": "12.70", "cng": null, "ev": null } },
  { "type": "4 Wheeler", "model": "Mahindra XUV 3XO", "priceBracket": "5-15", "variants": { "petrol": "20.10", "cng": null, "ev": null } },
  { "type": "4 Wheeler", "model": "Hyundai Creta", "priceBracket": "15-30", "variants": { "petrol": "17.40", "cng": null, "ev": "473" } },
  { "type": "4 Wheeler", "model": "MG Windsor", "priceBracket": "15-30", "variants": { "petrol": null, "cng": null, "ev": "332" } },
  { "type": "4 Wheeler", "model": "Mahindra BE 6", "priceBracket": "15-30", "variants": { "petrol": null, "cng": null, "ev": "557" } },

  // 2 Wheelers
  { "type": "2 Wheeler", "model": "Hero Splendor Plus", "priceBracket": "under-1L", "variants": { "petrol": "70", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Honda Activa 6G", "priceBracket": "under-1L", "variants": { "petrol": "59.5", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Honda Shine 125", "priceBracket": "under-1L", "variants": { "petrol": "55", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Bajaj Pulsar 125", "priceBracket": "under-1L", "variants": { "petrol": "51", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "TVS Apache RTR 160", "priceBracket": "1-1.5", "variants": { "petrol": "47", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Royal Enfield Classic 350", "priceBracket": "2-3", "variants": { "petrol": "41.5", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "TVS Jupiter", "priceBracket": "under-1L", "variants": { "petrol": "48", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Suzuki Access 125", "priceBracket": "under-1L", "variants": { "petrol": "45", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "TVS NTorq 125", "priceBracket": "under-1L", "variants": { "petrol": "48.5", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Yamaha RayZR 125", "priceBracket": "under-1L", "variants": { "petrol": "52", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Suzuki Burgman Street 125", "priceBracket": "1-1.5", "variants": { "petrol": "48", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "Hero Destini 125", "priceBracket": "under-1L", "variants": { "petrol": "59", "cng": null, "ev": null } },
  { "type": "2 Wheeler", "model": "TVS iQube", "priceBracket": "1-2", "variants": { "petrol": null, "cng": null, "ev": "75 / 100 / 150" } },
  { "type": "2 Wheeler", "model": "Bajaj Chetak", "priceBracket": "1-1.5", "variants": { "petrol": null, "cng": null, "ev": "127 / 153" } },
  { "type": "2 Wheeler", "model": "Ather 450X", "priceBracket": "1.5-2", "variants": { "petrol": null, "cng": null, "ev": "126 / 161" } },
  { "type": "2 Wheeler", "model": "Ather Rizta", "priceBracket": "1-1.5", "variants": { "petrol": null, "cng": null, "ev": "123 / 159" } },
  { "type": "2 Wheeler", "model": "Ola S1 Pro", "priceBracket": "1-1.5", "variants": { "petrol": null, "cng": null, "ev": "242" } },
  { "type": "2 Wheeler", "model": "Vida V2", "priceBracket": "1-1.5", "variants": { "petrol": null, "cng": null, "ev": "94 / 165" } },
  { "type": "2 Wheeler", "model": "Revolt RV400", "priceBracket": "1-2", "variants": { "petrol": null, "cng": null, "ev": "150" } },
  { "type": "2 Wheeler", "model": "Ultraviolette F77", "priceBracket": "3L+", "variants": { "petrol": null, "cng": null, "ev": "211 / 323" } },

  // 3 Wheelers
  { "type": "3 Wheeler", "model": "Bajaj RE", "priceBracket": "3-5", "variants": { "petrol": "35", "cng": "27", "ev": null } },
  { "type": "3 Wheeler", "model": "TVS King Deluxe", "priceBracket": "3-5", "variants": { "petrol": "34", "cng": "28", "ev": null } },
  { "type": "3 Wheeler", "model": "TVS King Duramax", "priceBracket": "3-5", "variants": { "petrol": null, "cng": "30", "ev": null } },
  { "type": "3 Wheeler", "model": "Bajaj Maxima Z", "priceBracket": "3-5", "variants": { "petrol": null, "cng": "26", "ev": null } },
  { "type": "3 Wheeler", "model": "Bajaj Maxima X Wide", "priceBracket": "3-5", "variants": { "petrol": null, "cng": "25", "ev": null } },
  { "type": "3 Wheeler", "model": "Piaggio Ape City", "priceBracket": "3-5", "variants": { "petrol": "30", "cng": "28", "ev": null } },
  { "type": "3 Wheeler", "model": "Piaggio Ape Xtra LDX", "priceBracket": "3-5", "variants": { "petrol": null, "cng": "28", "ev": null } },
  { "type": "3 Wheeler", "model": "Mahindra Alfa DX", "priceBracket": "3-5", "variants": { "petrol": null, "cng": "29", "ev": null } },
  { "type": "3 Wheeler", "model": "Mahindra Jeeto Strong CNG", "priceBracket": "5-7", "variants": { "petrol": null, "cng": "32", "ev": null } },
  { "type": "3 Wheeler", "model": "Bajaj Qute", "priceBracket": "3-5", "variants": { "petrol": null, "cng": "35", "ev": null } },
  { "type": "3 Wheeler", "model": "Mahindra Treo", "priceBracket": "3-5", "variants": { "petrol": null, "cng": null, "ev": "131" } },
  { "type": "3 Wheeler", "model": "Mahindra Treo Plus", "priceBracket": "3-5", "variants": { "petrol": null, "cng": null, "ev": "150" } },
  { "type": "3 Wheeler", "model": "Mahindra Treo Zor", "priceBracket": "3-5", "variants": { "petrol": null, "cng": null, "ev": "125" } },
  { "type": "3 Wheeler", "model": "Mahindra e-Alfa Plus", "priceBracket": "under-3L", "variants": { "petrol": null, "cng": null, "ev": "95" } },
  { "type": "3 Wheeler", "model": "Bajaj RE E-TEC 9.0", "priceBracket": "3-5", "variants": { "petrol": null, "cng": null, "ev": "178" } },
  { "type": "3 Wheeler", "model": "Bajaj GoGo P5009", "priceBracket": "5-7", "variants": { "petrol": null, "cng": null, "ev": "171" } },
  { "type": "3 Wheeler", "model": "Bajaj GoGo P7012", "priceBracket": "7-10", "variants": { "petrol": null, "cng": null, "ev": "251" } },
  { "type": "3 Wheeler", "model": "Piaggio Ape E-City FX", "priceBracket": "3-5", "variants": { "petrol": null, "cng": null, "ev": "145" } },
  { "type": "3 Wheeler", "model": "Euler HiLoad EV", "priceBracket": "5-7", "variants": { "petrol": null, "cng": null, "ev": "170" } },
  { "type": "3 Wheeler", "model": "Omega Seiki Stream City", "priceBracket": "3-5", "variants": { "petrol": null, "cng": null, "ev": "126" } }
];

let browserSupabaseClient: any = null;

export default function TeamDashboard({ supabaseUrl, supabaseAnonKey }: { supabaseUrl: string; supabaseAnonKey: string }) {
  if (!browserSupabaseClient) {
    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  const supabase = browserSupabaseClient;
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [listings, setListings] = useState<(EvListingRow & { variants: EvVariantRow[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>(emptyListing);
  const [variants, setVariants] = useState<(VariantForm & { id?: string })[]>([]);
  const [copyDetailedVariant, setCopyDetailedVariant] = useState(false);

  const updateVariantField = (idx: number, updatedFields: Partial<VariantForm>) => {
    setVariants((prev) => {
      const arr = [...prev];
      const v = arr[idx];
      if (!v) return prev;
      const parentSlug = (form.slug || getListingSlug(form.brand, form.title)).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      const isSlugDefaultOrEmpty = isVariantSlugDefault(v.slug, parentSlug, v);
      
      const nextVariant = { ...v, ...updatedFields };
      const nextSlug = (updatedFields.slug !== undefined)
        ? updatedFields.slug
        : (isSlugDefaultOrEmpty ? getVariantSlug(parentSlug, nextVariant) : v.slug);
      
      arr[idx] = { ...nextVariant, slug: nextSlug } as any;
      return arr;
    });
  };
  const [saving, setSaving] = useState(false);
  const [rebuildingAI, setRebuildingAI] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [pendingEnquiriesCount, setPendingEnquiriesCount] = useState(0);
  const [pendingForYouCount, setPendingForYouCount] = useState(0);
  const prevPendingEnquiries = useRef(0);
  const prevPendingForYou = useRef(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const [activeSection, setActiveSection] = useState<"listings" | "all_listings" | "leads" | "foryou_leads" | "prices" | "analytics" | "map" | "banners" | "content" | "offers" | "media" | "chargers" | "approvals" | "vehicle_approvals" | "protest">("listings");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [tableBrandFilter, setTableBrandFilter] = useState<string>("");
  const [visibleAllListingsCount, setVisibleAllListingsCount] = useState(10);
  const uniqueBrands = useMemo(() => {
    return [...new Set(listings.map((l) => l.brand).filter(Boolean))].sort();
  }, [listings]);
  const filteredListings = useMemo(() => {
    if (!selectedBrand) return [];
    return listings.filter((l) => l.brand === selectedBrand);
  }, [listings, selectedBrand]);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [energyComps, setEnergyComps] = useState<Array<{ id?: string; category: string; name: string; fuel_type: string; mileage: string; fuel_price: string; model_used: string; brand: string }>>([]);
  const [variantSpecSection, setVariantSpecSection] = useState<Record<number, string>>({});
  const [listingFormTab, setListingFormTab] = useState<"core" | "variants" | "energy" | "media" | "pricing">("core");
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [selectedPresetType, setSelectedPresetType] = useState<"2 Wheeler" | "3 Wheeler" | "4 Wheeler" | "">("");
  const [selectedPresetModel, setSelectedPresetModel] = useState("");
  const [initialSnapshot, setInitialSnapshot] = useState<{form: any, variants: any, energyComps: any} | null>(null);
  const [dbFuelPrices, setDbFuelPrices] = useState<any[]>([]);
  const fetchDbFuelPrices = async () => {
    const { data } = await supabase.from("fuel_prices").select("*").order("city");
    setDbFuelPrices(data || []);
  };

  const [motorClipboard, setMotorClipboard] = useState<any>(null);
  const [chargingClipboard, setChargingClipboard] = useState<any>(null);
  const [dimensionsClipboard, setDimensionsClipboard] = useState<any>(null);

  const [sameForAllMotor, setSameForAllMotor] = useState(false);
  const [sameForAllCharging, setSameForAllCharging] = useState(false);
  const [sameForAllDimensions, setSameForAllDimensions] = useState(false);

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState("");

  // Image toolkit states for TeamDashboard
  const [bgRemovingId, setBgRemovingId] = useState<string | null>(null);
  const [bgRemoveProgress, setBgRemoveProgress] = useState<string>("");
  const [flippingId, setFlippingId] = useState<string | null>(null);
  const [cropImageInfo, setCropImageInfo] = useState<{
    url: string;
    listingTitle: string;
    listingBrand: string;
    type: "main" | "featured" | "gallery";
    index: number;
  } | null>(null);

  const handleCopyFormat = () => {
    const templateForm = {
      title: form.title || "",
      slug: form.slug || "",
      brand: (() => {
        const b = form.brand ? form.brand.trim().toUpperCase() : "";
        return b === "TATA" ? "TATA MOTORS" : b;
      })(),
      body_type: form.body_type || "",
      usage_type: form.usage_type || null,
      commercial: form.commercial ?? false,
      has_baas: form.has_baas ?? false,
      launchdate: form.launchdate || null,
      discontinued: form.discontinued ?? false,
      discontinued_date: form.discontinued_date || null,
      types: form.types || [],
      pros: form.pros || [],
      cons: form.cons || [],
      price_bracket: form.price_bracket || "",
      parent_id: form.parent_id || "",
    };

    const diffVariants = (base: any, current: any) => {
      const diff: any = {};
      const keys = Object.keys(current);
      for (const k of keys) {
        if (k === "variant_name") {
          diff[k] = current[k];
          continue;
        }
        if (k === "features") continue;
        const valBase = base[k];
        const valCurr = current[k];
        const normalize = (v: any) => (v === null || v === undefined ? "" : String(v).trim());
        if (normalize(valBase) !== normalize(valCurr)) {
          diff[k] = valCurr;
        }
      }

      if (current.features) {
        const baseFeatures = base.features || {};
        const currFeatures = current.features;
        const diffFeats: any = {};
        let hasFeatDiff = false;
        for (const fk of Object.keys(currFeatures)) {
          const fBase = baseFeatures[fk];
          const fCurr = currFeatures[fk];
          const normalize = (v: any) => (v === null || v === undefined ? "" : String(v).trim());
          if (normalize(fBase) !== normalize(fCurr)) {
            diffFeats[fk] = fCurr;
            hasFeatDiff = true;
          }
        }
        if (hasFeatDiff) {
          diff.features = diffFeats;
        }
      }
      return diff;
    };

    const cleanedVariants = variants.map((v) => {
      const { id, listing_id, created_at, updated_at, variant_name, version_name, model_year, ...rest } = v as any;
      return {
        variant_name: variant_name || "",
        version_name: version_name || "",
        model_year: model_year || 2026,
        price: rest.price || 0,
        is_detailed_variant: v.is_detailed_variant ?? false,
        baas_monthly_rental: v.baas_monthly_rental ?? null,
        top_speed: rest.top_speed || "",
        battery_capacity_kwh: rest.battery_capacity_kwh || "",
        driving_range_km: rest.driving_range_km || "",
        charging_time_mins: rest.charging_time_mins || "",
        max_power_bhp: rest.max_power_bhp || "",
        max_torque_nm: rest.max_torque_nm || "",
        has_baas: rest.has_baas ?? false,
        baas_price_per_km: rest.baas_price_per_km || "",
        baas_upfront_price: rest.baas_upfront_price || "",
        baas_model_name: rest.baas_model_name || "",
        charging_time_ac_hours: rest.charging_time_ac_hours || "",
        charging_time_dc_mins: rest.charging_time_dc_mins || "",
        max_dc_charging_rate_kw: rest.max_dc_charging_rate_kw || "",

        // Spec details
        acceleration: rest.acceleration || "",
        battery_type: rest.battery_type || "",
        battery_portability: rest.battery_portability || "",
        charger_type: rest.charger_type || "",
        charger_output: rest.charger_output || "",
        charger_cost_included: rest.charger_cost_included || "",

        // Dimensions
        length_mm: rest.length_mm || "",
        width_mm: rest.width_mm || "",
        height_mm: rest.height_mm || "",
        wheelbase_mm: rest.wheelbase_mm || "",
        ground_clearance_mm: rest.ground_clearance_mm || "",
        boot_space_litres: rest.boot_space_litres || "",
        turning_radius_m: rest.turning_radius_m || "",
        kerb_weight_kg: rest.kerb_weight_kg || "",
        seat_length_mm: rest.seat_length_mm || "",
        seat_height_mm: rest.seat_height_mm || "",

        // Chassis & Brakes
        braking_system: rest.braking_system || "",
        wheel_type: rest.wheel_type || "",
        front_wheel_size: rest.front_wheel_size || "",
        rear_wheel_size: rest.rear_wheel_size || "",
        front_suspension: rest.front_suspension || "",
        rear_suspension: rest.rear_suspension || "",
        chassis_type: rest.chassis_type || "",

        // Warranties
        battery_warranty: rest.battery_warranty || "",
        motor_warranty: rest.motor_warranty || "",

        // Custom / Extra structures
        custom_fields: rest.custom_fields || [],
        extra_motor: rest.extra_motor || [],
        extra_charging: rest.extra_charging || [],
        extra_dimensions: rest.extra_dimensions || [],
        extra_sections: rest.extra_sections || [],

        usage_type: rest.usage_type || null,
        continuing_variant_id: rest.continuing_variant_id || null,

        ...rest,
        features: rest.features ? {
          front_brakes: rest.features.front_brakes || "Disc",
          rear_brakes: rest.features.rear_brakes || "Disc",
          drivetrain: rest.features.drivetrain || "FWD",
          seating_capacity: rest.features.seating_capacity || null,
          front_suspension: rest.features.front_suspension || "",
          rear_suspension: rest.features.rear_suspension || "",
          headlight_type: rest.features.headlight_type || "LED",
          has_sunroof: rest.features.has_sunroof ?? false,
          has_climate_control: rest.features.has_climate_control ?? false,
          has_cruise_control: rest.features.has_cruise_control ?? false,
          has_wireless_charger: rest.features.has_wireless_charger ?? false,
          has_keyless_entry: rest.features.has_keyless_entry ?? false,
          screen_size_inches: rest.features.screen_size_inches || null,
          speaker_count: rest.features.speaker_count || "4",
          has_wireless_carplay_android_auto: rest.features.has_wireless_carplay_android_auto ?? false,
          has_connected_car_app: rest.features.has_connected_car_app ?? false,
          has_ota_updates: rest.features.has_ota_updates ?? false,
          airbag_count: rest.features.airbag_count || null,
          has_abs: rest.features.has_abs ?? true,
          has_ebd: rest.features.has_ebd ?? true,
          has_esp: rest.features.has_esp ?? false,
          has_tpms: rest.features.has_tpms ?? false,
          has_360_camera: rest.features.has_360_camera ?? false,
          adas_level: rest.features.adas_level || "0",
          ncap_safety_rating: rest.features.ncap_safety_rating || null,
        } : defaultFeatures,
      };
    });

    const templateVariants = copyDetailedVariant
      ? cleanedVariants
      : cleanedVariants.map((v, idx) => {
          if (idx === 0) return v;
          return diffVariants(cleanedVariants[0], v);
        });

    const templateEnergyComps = energyComps.map((e) => {
      const { id, listing_id, created_at, updated_at, brand, ...rest } = e as any;
      return {
        ...rest,
        brand: (() => {
          const b = brand ? brand.trim().toUpperCase() : "";
          return b === "TATA" ? "TATA MOTORS" : b;
        })()
      };
    });

    const exportData = {
      _instruction: copyDetailedVariant
        ? "Return a detailed JSON where each variant lists its specifications, features, and specs in full. Do not omit common fields."
        : "Return a compact JSON where only the differing fields are updated per variant. All other specifications, features, and specs (like dimensions, brakes, warranties, etc.) are assumed to be inherited from the first variant (index 0). Do not repeat common fields in subsequent variants.",
      _hints: {
        types_options: ["2 Wheeler", "3 Wheeler", "4 Wheeler"],
        price_bracket_options: ["under-2L", "5-10", "5-15", "10-25", "15-30", "30+", "50+"],
        body_type_options: ["Scooter", "Sedan", "SUV", "Hatchback", "Compact SUV", "MUV", "Bike", "Tempo", "Autos", "Other"], usage_type_options: ["Both", "Goods", "Passenger"]
      },
      form: templateForm,
      variants: templateVariants.length > 0 ? templateVariants : [emptyVariant],
      energyComps: templateEnergyComps,
    };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      .then(() => alert("Listing JSON format copied to clipboard!"))
      .catch((err) => alert("Failed to copy format: " + err));
  };

  const handleApplyPaste = (parsedData: any) => {
    if (!parsedData) return;
    
    const updatedForm = {
      ...emptyListing,
      ...parsedData.form,
      photo: parsedData.form?.photo || form.photo || "",
      gallery_images: (parsedData.form?.gallery_images && parsedData.form.gallery_images.length > 0)
        ? parsedData.form.gallery_images
        : form.gallery_images || [],
      city_pricing: form.city_pricing || [],
    };

    let firstVariantParsed: any = null;
    const updatedVariants = Array.isArray(parsedData.variants) 
      ? parsedData.variants.map((v: any, idx: number) => {
          const existingMatch = variants.find(ev => ev.variant_name === v.variant_name) || variants[idx];
          const preservedId = existingMatch?.id;

          if (idx === 0) {
            firstVariantParsed = {
              ...emptyVariant,
              ...v,
              id: preservedId,
              features: v.features ? { ...defaultFeatures, ...v.features } : { ...defaultFeatures },
            };
            return firstVariantParsed;
          } else {
            const baseFeatures = firstVariantParsed?.features || defaultFeatures;
            return {
              ...emptyVariant,
              ...firstVariantParsed,
              ...v,
              id: preservedId,
              features: {
                ...baseFeatures,
                ...(v.features || {}),
              },
            };
          }
        })
      : [{ ...emptyVariant }];

    const updatedEnergyComps = Array.isArray(parsedData.energyComps)
      ? parsedData.energyComps.map((e: any) => ({
          category: e.category || "fuel",
          name: e.name || "",
          fuel_type: e.fuel_type || "",
          mileage: e.mileage || "",
          fuel_price: e.fuel_price || "",
          model_used: e.model_used || "",
          brand: e.brand || "",
        }))
      : [];

    setForm(updatedForm);
    setVariants(updatedVariants);
    setEnergyComps(updatedEnergyComps);
    setActiveVariantIndex(0);
    setIsPasteModalOpen(false);
    setPastedJson("");
    alert("Data successfully applied to the form!");
  };

  const [isPasteVariantModalOpen, setIsPasteVariantModalOpen] = useState(false);
  const [pastedVariantJson, setPastedVariantJson] = useState("");

  const handleCopyVariant = () => {
    const current = variants[activeVariantIndex];
    if (!current) {
      alert("No active variant to copy!");
      return;
    }
    const { id, listing_id, created_at, updated_at, variant_name, version_name, model_year, ...rest } = current as any;
    const cleanVariant = {
      variant_name: variant_name || "",
      version_name: version_name || "",
      model_year: model_year || 2026,
      price: rest.price || 0,
      is_detailed_variant: current.is_detailed_variant ?? false,
      baas_monthly_rental: current.baas_monthly_rental ?? null,
      usage_type: rest.usage_type || null,
      continuing_variant_id: rest.continuing_variant_id || null,
      top_speed: rest.top_speed || "",
      battery_capacity_kwh: rest.battery_capacity_kwh || "",
      driving_range_km: rest.driving_range_km || "",
      charging_time_mins: rest.charging_time_mins || "",
      max_power_bhp: rest.max_power_bhp || "",
      max_torque_nm: rest.max_torque_nm || "",
      has_baas: rest.has_baas ?? false,
      baas_price_per_km: rest.baas_price_per_km || "",
      baas_upfront_price: rest.baas_upfront_price || "",
      baas_model_name: rest.baas_model_name || "",
      charging_time_ac_hours: rest.charging_time_ac_hours || "",
      charging_time_dc_mins: rest.charging_time_dc_mins || "",
      max_dc_charging_rate_kw: rest.max_dc_charging_rate_kw || "",

      // Spec details
      acceleration: rest.acceleration || "",
      battery_type: rest.battery_type || "",
      battery_portability: rest.battery_portability || "",
      charger_type: rest.charger_type || "",
      charger_output: rest.charger_output || "",
      charger_cost_included: rest.charger_cost_included || "",

      // Dimensions
      length_mm: rest.length_mm || "",
      width_mm: rest.width_mm || "",
      height_mm: rest.height_mm || "",
      wheelbase_mm: rest.wheelbase_mm || "",
      ground_clearance_mm: rest.ground_clearance_mm || "",
      boot_space_litres: rest.boot_space_litres || "",
      turning_radius_m: rest.turning_radius_m || "",
      kerb_weight_kg: rest.kerb_weight_kg || "",
      seat_length_mm: rest.seat_length_mm || "",
      seat_height_mm: rest.seat_height_mm || "",

      // Chassis & Brakes
      braking_system: rest.braking_system || "",
      wheel_type: rest.wheel_type || "",
      front_wheel_size: rest.front_wheel_size || "",
      rear_wheel_size: rest.rear_wheel_size || "",
      front_suspension: rest.front_suspension || "",
      rear_suspension: rest.rear_suspension || "",
      chassis_type: rest.chassis_type || "",

      // Warranties
      battery_warranty: rest.battery_warranty || "",
      motor_warranty: rest.motor_warranty || "",

      // Custom / Extra structures
      custom_fields: rest.custom_fields || [],
      extra_motor: rest.extra_motor || [],
      extra_charging: rest.extra_charging || [],
      extra_dimensions: rest.extra_dimensions || [],
      extra_sections: rest.extra_sections || [],

      ...rest,
      features: rest.features ? {
        front_brakes: rest.features.front_brakes || "Disc",
        rear_brakes: rest.features.rear_brakes || "Disc",
        drivetrain: rest.features.drivetrain || "FWD",
        seating_capacity: rest.features.seating_capacity || null,
        front_suspension: rest.features.front_suspension || "",
        rear_suspension: rest.features.rear_suspension || "",
        headlight_type: rest.features.headlight_type || "LED",
        has_sunroof: rest.features.has_sunroof ?? false,
        has_climate_control: rest.features.has_climate_control ?? false,
        has_cruise_control: rest.features.has_cruise_control ?? false,
        has_wireless_charger: rest.features.has_wireless_charger ?? false,
        has_keyless_entry: rest.features.has_keyless_entry ?? false,
        screen_size_inches: rest.features.screen_size_inches || null,
        speaker_count: rest.features.speaker_count || "4",
        has_wireless_carplay_android_auto: rest.features.has_wireless_carplay_android_auto ?? false,
        has_connected_car_app: rest.features.has_connected_car_app ?? false,
        has_ota_updates: rest.features.has_ota_updates ?? false,
        airbag_count: rest.features.airbag_count || null,
        has_abs: rest.features.has_abs ?? true,
        has_ebd: rest.features.has_ebd ?? true,
        has_esp: rest.features.has_esp ?? false,
        has_tpms: rest.features.has_tpms ?? false,
        has_360_camera: rest.features.has_360_camera ?? false,
        adas_level: rest.features.adas_level || "0",
        ncap_safety_rating: rest.features.ncap_safety_rating || null,
      } : defaultFeatures,
    };

    navigator.clipboard.writeText(JSON.stringify(cleanVariant, null, 2))
      .then(() => alert(`Variant "${cleanVariant.variant_name || "Variant"}" JSON copied!`))
      .catch((err) => alert("Failed to copy variant: " + err));
  };

  const handleApplyPasteVariant = (parsedData: any) => {
    if (!parsedData) return;

    const existingVariant = variants[activeVariantIndex] || {};

    const newVariant = {
      ...emptyVariant,
      ...existingVariant,
      ...parsedData,
      id: existingVariant.id,
      features: parsedData.features ? { ...defaultFeatures, ...parsedData.features } : { ...defaultFeatures },
    };

    setVariants((prev) => {
      const next = [...prev];
      if (next.length === 0) {
        next.push(newVariant);
      } else {
        next[activeVariantIndex] = newVariant;
      }
      return next;
    });

    setIsPasteVariantModalOpen(false);
    setPastedVariantJson("");
    alert("Variant details successfully applied!");
  };

  // --- Image Toolkit Functions ---
  const convertToImageBlob = (url: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas conversion to Blob failed"));
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Failed to load source image for decoding"));
      img.src = url;
    });
  };

  const updateFormImageUrl = (type: "main" | "featured" | "gallery", index: number, newUrl: string) => {
    if (type === "main") {
      setForm((prev) => ({ ...prev, photo: newUrl }));
    } else if (type === "featured") {
      setForm((prev) => {
        const arr = [...prev.featured_photos];
        arr[index] = { ...arr[index], url: newUrl };
        return { ...prev, featured_photos: arr };
      });
    } else if (type === "gallery") {
      setForm((prev) => {
        const arr = [...prev.gallery_images];
        arr[index] = { ...arr[index], url: newUrl };
        return { ...prev, gallery_images: arr };
      });
    }
  };

  const handleRemoveBg = async (url: string, type: "main" | "featured" | "gallery", index: number) => {
    if (!url) return;
    const itemKey = `${type}-${index}`;
    setBgRemovingId(itemKey);
    setBgRemoveProgress("Decoding...");

    try {
      const decodedBlob = await convertToImageBlob(url);
      setBgRemoveProgress("Loading AI...");
      const imgly = await import("@imgly/background-removal");
      const removeBackground = imgly.removeBackground as any;

      const filename = `rmbg-${Date.now()}.png`;

      const config = {
        model: "small" as const,
        progress: (key: string, current: number, total: number) => {
          const percent = Math.round((current / total) * 100);
          if (key.includes("fetch")) {
            setBgRemoveProgress(`AI model... ${percent}%`);
          } else {
            setBgRemoveProgress(`Removing... ${percent}%`);
          }
        }
      };

      const blob = await removeBackground(decodedBlob, config);
      setBgRemoveProgress("Uploading...");

      const file = new File([blob], filename, { type: "image/png" });
      const path = `evlistings/${form.slug || Date.now()}/${filename}`;
      const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
        setBgRemovingId(null);
        return;
      }

      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
      updateFormImageUrl(type, index, publicUrl);
    } catch (err: any) {
      alert("Background removal failed: " + err.message);
    }
    setBgRemovingId(null);
    setBgRemoveProgress("");
  };

  const handleFlipHorizontal = async (url: string, type: "main" | "featured" | "gallery", index: number) => {
    if (!url) return;
    const itemKey = `${type}-${index}`;
    setFlippingId(itemKey);
    try {
      const decodedBlob = await convertToImageBlob(url);
      const img = new Image();
      
      const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load source image for flipping"));
        img.src = URL.createObjectURL(decodedBlob);
      });

      const canvas = document.createElement("canvas");
      canvas.width = loadedImg.naturalWidth || loadedImg.width;
      canvas.height = loadedImg.naturalHeight || loadedImg.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D canvas context");

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(loadedImg, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas conversion to blob failed"));
        }, "image/png");
      });

      const filename = `flip-${Date.now()}.png`;
      const path = `evlistings/${form.slug || Date.now()}/${filename}`;
      
      const { data, error } = await supabase.storage.from("evphotos").upload(path, new File([blob], filename, { type: "image/png" }), { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
        setFlippingId(null);
        return;
      }

      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
      updateFormImageUrl(type, index, publicUrl);
    } catch (err: any) {
      alert("Flipping failed: " + err.message);
    }
    setFlippingId(null);
  };
  // --- End Image Toolkit Functions ---

  useEffect(() => { 
    supabase.auth.getUser().then(({ data }: any) => { 
      if (data.user) {
        setUser(data.user);
        // Register FCM device token for background PWA notifications
        setTimeout(async () => {
          try {
            const token = await requestFcmToken();
            if (token) {
              await fetch("/api/team/register-fcm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, userId: data.user.id }),
              });
            }
          } catch (err) {
            console.error("FCM registration error:", err);
          }
        }, 1200);
      }
    }); 

    // Listen for auth events (specifically PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowChangePassword(true);
      }
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (user) {
      fetchListings();
      fetchDbFuelPrices();

      const fetchPendingCount = async () => {
        const triggerLocalNotification = (title: string, body: string) => {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(title, { body, icon: "/favicon.ico" });
            } catch (err) {
              console.warn("Local notification display failed:", err);
            }
          }
        };

        // Fetch general enquiries pending count (excludes /foryou)
        const { count: generalCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .is("assisted_by", null)
          .neq("source", "/foryou Recommendation");
        
        if (generalCount !== null) {
          if (generalCount > prevPendingEnquiries.current && prevPendingEnquiries.current !== 0) {
            triggerLocalNotification("New Enquiry Received", "You have a new general EV enquiry to assist!");
          }
          prevPendingEnquiries.current = generalCount;
          setPendingEnquiriesCount(generalCount);
        }

        // Fetch For You pending count (only /foryou)
        const { count: forYouCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .is("assisted_by", null)
          .eq("source", "/foryou Recommendation");
        
        if (forYouCount !== null) {
          if (forYouCount > prevPendingForYou.current && prevPendingForYou.current !== 0) {
            triggerLocalNotification("New Curation Request", "A new 'For You' wizard submission needs manual confirmation!");
          }
          prevPendingForYou.current = forYouCount;
          setPendingForYouCount(forYouCount);
        }
      };
      
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const updateVariantMotorField = (idx: number, fieldName: string, value: any) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === idx || sameForAllMotor) {
        return { ...v, [fieldName]: value };
      }
      return v;
    }));
  };

  const updateVariantMotorExtra = (idx: number, next: any) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === idx || sameForAllMotor) {
        return { ...v, extra_motor: next };
      }
      return v;
    }));
  };

  const updateVariantChargingField = (idx: number, fieldName: string, value: any) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === idx || sameForAllCharging) {
        return { ...v, [fieldName]: value };
      }
      return v;
    }));
  };

  const updateVariantChargingExtra = (idx: number, next: any) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === idx || sameForAllCharging) {
        return { ...v, extra_charging: next };
      }
      return v;
    }));
  };

  const updateVariantDimensionsField = (idx: number, fieldName: string, value: any) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === idx || sameForAllDimensions) {
        return { ...v, [fieldName]: value };
      }
      return v;
    }));
  };

  const updateVariantDimensionsExtra = (idx: number, next: any) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === idx || sameForAllDimensions) {
        return { ...v, extra_dimensions: next };
      }
      return v;
    }));
  };

  const fetchListings = async () => {
    setLoading(true);
    const { data: ls } = await supabase.from("evlistings").select("*").order("created_at", { ascending: false });
    if (!ls) { setLoading(false); return; }
    const ids = ls.map((l: any) => l.id);
    const { data: vs } = await supabase.from("ev_variants").select("*").in("listing_id", ids).order("price");
    const varMap = new Map<string, EvVariantRow[]>();
    for (const v of (vs ?? []) as EvVariantRow[]) {
      const arr = varMap.get(v.listing_id) ?? [];
      arr.push(v); varMap.set(v.listing_id, arr);
    }
    setListings((ls as any[]).map((l) => ({ ...l, variants: varMap.get(l.id) ?? [] })));
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Password updated successfully!");
      setShowChangePassword(false);
      setNewPassword("");
    }
    setLoading(false);
  };

  const startNew = () => {
    setEditing("new");
    const initialForm = {
      ...emptyListing,
      brand: selectedBrand || "",
    };
    setForm(initialForm);
    setVariants([{ ...emptyVariant }]);
    setActiveVariantIndex(0);
    setEnergyComps([]);
    setListingFormTab("core");
    setVariantSpecSection({});
    setInitialSnapshot({
      form: JSON.parse(JSON.stringify(initialForm)),
      variants: JSON.parse(JSON.stringify([{ ...emptyVariant }])),
      energyComps: [],
    });
  };
  const startEdit = async (l: EvListingRow & { variants: EvVariantRow[] }) => {
    setEditing(l.id);
    setListingFormTab("core");
    const safeParseJson = (val: any, fallback: any = []) => {
      if (!val) return fallback;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch (e) {
          return fallback;
        }
      }
      return val;
    };

    const rawFeaturedPhotos = safeParseJson((l as any).featured_photos, []);
    const rawVideoLinks = safeParseJson((l as any).video_links, []);
    const rawGalleryImages = safeParseJson(l.gallery_images, []);
    const rawCityPricing = safeParseJson((l as any).city_pricing, []);

    const loadedForm = {
      slug: l.slug,
      title: l.title,
      brand: l.brand,
      body_type: l.body_type || "",
      usage_type: (l as any).usage_type || null,
      commercial: l.commercial,
      has_baas: l.has_baas || false,
      launchdate: l.launchdate,
      photo: l.photo,
      gallery_images: rawGalleryImages,
      colors: l.colors ?? [],
      types: Array.isArray((l as any).types)
        ? (l as any).types
        : (typeof (l as any).types === "string" && (l as any).types
            ? (((l as any).types as string).startsWith("[") ? safeParseJson((l as any).types, [(l as any).types]) : [(l as any).types])
            : []),
      pros: l.pros ?? [],
      cons: l.cons ?? [],
      price_bracket: (l as any).price_bracket || "",
      parent_id: l.parent_id || "",
      editors_emails: l.editors_emails ?? [],
      discontinued: l.discontinued || false,
      discontinued_date: l.discontinued_date || null,
      featured: (l as any).featured || false,
      video_links: rawVideoLinks,
      featured_photos: rawFeaturedPhotos.length > 0
        ? rawFeaturedPhotos
        : (l.photo ? [{ url: l.photo, variantId: null }] : []),
      city_pricing: rawCityPricing,
    };
    setForm(loadedForm);
    // Load features for each variant
    const variantIds = l.variants.map((v) => v.id);
    let featuresMap = new Map<string, any>();
    if (variantIds.length) {
      const { data: feats } = await supabase.from("ev_variant_features").select("*").in("variant_id", variantIds);
      for (const f of (feats ?? [])) featuresMap.set(f.variant_id, f);
    }
    const loadedVariants = l.variants.map((v) => {
      const custom_fields = (v as any).custom_fields || [];
      const hasExclusiveColorCf = custom_fields.find((cf: any) => cf.label === "_has_exclusive_color");
      const exclusiveColorsCf = custom_fields.find((cf: any) => cf.label === "_exclusive_colors");
      const isDetailedVariantCf = custom_fields.find((cf: any) => cf.label === "_is_detailed_variant");
      
      const has_exclusive_color = hasExclusiveColorCf?.value === "true";
      const exclusive_colors = exclusiveColorsCf?.value ? exclusiveColorsCf.value.split(",") : [];
      const is_detailed_variant = isDetailedVariantCf?.value === "true";
      const visibleCustomFields = custom_fields.filter((cf: any) => 
        cf.label !== "_has_exclusive_color" && 
        cf.label !== "_exclusive_colors" && 
        cf.label !== "_is_detailed_variant"
      );

      return {
        ...v,
        id: v.id,
        features: featuresMap.get(v.id) || undefined,
        has_exclusive_color,
        exclusive_colors,
        is_detailed_variant,
        baas_monthly_rental: (v as any).baas_monthly_rental ?? null,
        custom_fields: visibleCustomFields
      };
    }) as any;
    setVariants(loadedVariants);
    // Load energy comparisons
    const { data: ec } = await supabase.from("ev_energy_comparisons").select("*").eq("listing_id", l.id).order("created_at");
    const loadedEnergy = (ec ?? []).map((e: any) => ({ id: e.id, category: e.category, name: e.name, fuel_type: e.fuel_type, mileage: e.mileage, fuel_price: e.fuel_price, model_used: e.model_used, brand: e.brand }));
    setEnergyComps(loadedEnergy);

    setInitialSnapshot({
      form: JSON.parse(JSON.stringify(loadedForm)),
      variants: JSON.parse(JSON.stringify(loadedVariants)),
      energyComps: JSON.parse(JSON.stringify(loadedEnergy)),
    });
  };

  const startAddVariant = async (l: EvListingRow & { variants: EvVariantRow[] }) => {
    await startEdit(l);
    setListingFormTab("variants");
    setVariants((prev) => {
      const next = [...prev, { ...emptyVariant }];
      setActiveVariantIndex(next.length - 1);
      return next;
    });
  };

  const handleRebuildAI = async () => {
    setRebuildingAI(true);
    try {
      const res = await fetch("/api/build-summary");
      if (res.ok) {
        alert("AI files successfully rebuilt!");
      } else {
        const err = await res.json();
        alert(`Failed to rebuild AI files: ${err.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Network error rebuilding AI files: ${err.message}`);
    }
    setRebuildingAI(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Sanitize slug by replacing spaces with '-' and removing non-alphanumeric chars
    // Fallback to timestamp if both are empty to avoid unique constraints
    const baseSlug = form.slug || getListingSlug(form.brand, form.title) || `listing-${Date.now()}`;
    const sanitizedSlug = baseSlug
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { parent_id, editors_emails, ...formWithoutParent } = form;
    let listingId = editing === "new" ? null : editing;
    let error;

    let newEditors = editors_emails ? [...editors_emails] : [];
    if (user?.email && !newEditors.includes(user.email)) {
      newEditors.push(user.email);
    }

    const defaultPhoto = form.featured_photos.find((p) => !p.variantId)?.url 
      || form.featured_photos[0]?.url 
      || form.photo 
      || "";

    const listingPayload: any = { 
      ...formWithoutParent, 
      photo: defaultPhoto,
      brand: (() => {
        const b = form.brand ? form.brand.trim().toUpperCase() : "";
        return b === "TATA" ? "TATA MOTORS" : b;
      })(),
      parent_id: parent_id || null,
      slug: sanitizedSlug,
      editors_emails: newEditors,
    };

    if (editing === "new") {
      listingPayload.created_by_email = user.email; // Only set created_by on new
      const res = await supabase.from("evlistings").insert(listingPayload).select("id").single();
      error = res.error; listingId = res.data?.id ?? null;
    } else {
      const res = await supabase.from("evlistings").update(listingPayload).eq("id", editing);
      error = res.error;
    }
    
    if (error) { alert(`Save failed: ${error.message}`); setSaving(false); return; }

    // Save variants under listingId
    if (listingId) {
      // Delete removed variants
      const existingIds = variants.filter((v) => v.id).map((v) => v.id!);
      await supabase.from("ev_variants").delete().eq("listing_id", listingId).not("id", "in", `(${existingIds.join(",")})`);

      for (const v of variants) {
        const features = (v as any).features;
        const variantId = (v as any).id;
        const rawCustomFields = (v as any).custom_fields || [];
        const filteredCustomFields = rawCustomFields.filter((cf: any) => 
          cf.label !== "_has_exclusive_color" && 
          cf.label !== "_exclusive_colors" && 
          cf.label !== "_is_detailed_variant"
        );
        const finalCustomFields = [
          ...filteredCustomFields,
          { label: "_has_exclusive_color", value: (v as any).has_exclusive_color ? "true" : "false" },
          { label: "_exclusive_colors", value: Array.isArray((v as any).exclusive_colors) ? (v as any).exclusive_colors.join(",") : "" },
          { label: "_is_detailed_variant", value: (v as any).is_detailed_variant ? "true" : "false" }
        ];

        const varPayload: any = {
          listing_id: listingId,
          variant_name: v.variant_name,
          version_name: v.version_name || null,
          launch_date: v.launch_date || null,
          usage_type: v.usage_type || null,
          continuing_variant_id: v.continuing_variant_id || null,
          slug: v.slug || getVariantSlug(sanitizedSlug, v),
          model_year: v.model_year,
          price: v.price,
          top_speed: v.top_speed,
          battery_capacity_kwh: v.battery_capacity_kwh,
          driving_range_km: v.driving_range_km,
          charging_time_mins: v.charging_time_mins,
          max_power_bhp: v.max_power_bhp,
          max_torque_nm: v.max_torque_nm || null,
          has_baas: v.has_baas,
          baas_price_per_km: v.baas_price_per_km,
          baas_upfront_price: v.baas_upfront_price,
          baas_model_name: v.baas_model_name,
          charging_time_ac_hours: v.charging_time_ac_hours,
          charging_time_dc_mins: v.charging_time_dc_mins,
          max_dc_charging_rate_kw: v.max_dc_charging_rate_kw,
          baas_monthly_rental: v.baas_monthly_rental || null,
          length_mm: (v as any).length_mm || null,
          width_mm: (v as any).width_mm || null,
          height_mm: (v as any).height_mm || null,
          wheelbase_mm: (v as any).wheelbase_mm || null,
          ground_clearance_mm: (v as any).ground_clearance_mm || null,
          boot_space_litres: (v as any).boot_space_litres || null,
          turning_radius_m: (v as any).turning_radius_m || null,
          acceleration: v.acceleration || null,
          battery_type: v.battery_type || null,
          battery_portability: v.battery_portability || null,
          charger_type: v.charger_type || null,
          charger_output: v.charger_output || null,
          charger_cost_included: v.charger_cost_included || null,
          kerb_weight_kg: v.kerb_weight_kg || null,
          seat_length_mm: v.seat_length_mm || null,
          seat_height_mm: v.seat_height_mm || null,
          braking_system: v.braking_system || null,
          wheel_type: v.wheel_type || null,
          front_wheel_size: v.front_wheel_size || null,
          rear_wheel_size: v.rear_wheel_size || null,
          front_suspension: v.front_suspension || null,
          rear_suspension: v.rear_suspension || null,
          chassis_type: v.chassis_type || null,
          battery_warranty: v.battery_warranty || null,
          motor_warranty: v.motor_warranty || null,
          discontinued: v.discontinued ?? false,
          discontinued_date: v.discontinued_date || null,
          custom_fields: finalCustomFields,
          extra_motor: (v as any).extra_motor || [],
          extra_charging: (v as any).extra_charging || [],
          extra_sections: (v as any).extra_sections || [],
          extra_dimensions: (v as any).extra_dimensions || [],
        };

        let savedVariantId = variantId;
        if (variantId) {
          const res = await supabase.from("ev_variants").update(varPayload).eq("id", variantId);
          if (res.error) { alert(`Variant save failed: ${res.error.message}`); setSaving(false); return; }
        } else {
          const res = await supabase.from("ev_variants").insert(varPayload).select("id").single();
          if (res.error) { alert(`Variant insert failed: ${res.error.message}`); setSaving(false); return; }
          savedVariantId = res.data?.id;
        }
        if (savedVariantId && features) {
          // Remove fields that aren't columns in ev_variant_features
          const { extra_features, ...featurePayload } = features as any;
          const res = await supabase.from("ev_variant_features").upsert({ variant_id: savedVariantId, ...featurePayload });
          if (res.error) { 
            console.warn("Features save error:", res.error.message);
            // Try without unknown fields
            const safePayload: any = { variant_id: savedVariantId };
            const knownKeys = ["front_brakes","rear_brakes","drivetrain","seating_capacity","front_suspension","rear_suspension","headlight_type","has_sunroof","has_climate_control","has_cruise_control","has_wireless_charger","has_keyless_entry","screen_size_inches","speaker_count","has_wireless_carplay_android_auto","has_connected_car_app","has_ota_updates","airbag_count","has_abs","has_ebd","has_esp","has_tpms","has_360_camera","adas_level","ncap_safety_rating","has_gps","has_navigation","has_mode_eco","has_mode_normal","has_mode_sports","has_mode_hyper","has_mode_cruise","has_mode_reverse","front_speakers","rear_speakers","boot_storage_litres","has_speedometer_digital","has_odometer_digital","has_voice_assist","has_stand_alarm","has_low_battery_indicator","has_clock","has_call_sms_alert","has_tripmeter","has_usb_charging_port","has_keyless_lock_unlock","has_start_type_self","has_boot_light","has_tail_light","has_break_light","has_turn_signal","has_drls"];
            for (const k of knownKeys) { if (featurePayload[k] !== undefined) safePayload[k] = featurePayload[k]; }
            const retry = await supabase.from("ev_variant_features").upsert(safePayload);
            if (retry.error) alert(`Features save failed: ${retry.error.message}`);
          }
        }
      }
      // Resolve variantNames to final variant UUIDs for featured_photos, gallery_images, and video_links post-save
      const { data: savedVars } = await supabase.from("ev_variants").select("id, variant_name").eq("listing_id", listingId);
      if (savedVars) {
        const nameToIdMap = new Map<string, string>();
        for (const sv of savedVars) {
          if (sv.variant_name) {
            nameToIdMap.set(sv.variant_name.toLowerCase().trim(), sv.id);
          }
        }

        const updatedFeatured = form.featured_photos.map(p => {
          const nameKey = p.variantName?.toLowerCase().trim();
          const resolvedId = p.variantId || (nameKey ? nameToIdMap.get(nameKey) : null);
          return {
            ...p,
            variantId: resolvedId || null,
            variantName: p.variantName || (resolvedId ? savedVars.find((sv: any) => sv.id === resolvedId)?.variant_name : null) || null
          };
        });

        const updatedGallery = form.gallery_images.map(p => {
          if (typeof p === "object" && p !== null) {
            const nameKey = p.variantName?.toLowerCase().trim();
            const resolvedId = p.variantId || (nameKey ? nameToIdMap.get(nameKey) : null);
            return {
              ...p,
              variantId: resolvedId || null,
              variantName: p.variantName || (resolvedId ? savedVars.find((sv: any) => sv.id === resolvedId)?.variant_name : null) || null
            };
          }
          return p;
        });

        const updatedVideos = form.video_links.map(p => {
          const nameKey = p.variantName?.toLowerCase().trim();
          const resolvedId = p.variantId || (nameKey ? nameToIdMap.get(nameKey) : null);
          return {
            ...p,
            variantId: resolvedId || null,
            variantName: p.variantName || (resolvedId ? savedVars.find((sv: any) => sv.id === resolvedId)?.variant_name : null) || null
          };
        });

        await supabase.from("evlistings").update({
          featured_photos: updatedFeatured,
          gallery_images: updatedGallery,
          video_links: updatedVideos
        }).eq("id", listingId);

        setForm(prev => ({
          ...prev,
          featured_photos: updatedFeatured,
          gallery_images: updatedGallery,
          video_links: updatedVideos
        }));
      }
    }

    // Save energy comparisons (only if not moving/merged to parent)
    if (listingId && !parent_id) {
      const existingEcIds = energyComps.filter((e) => e.id).map((e) => e.id!);
      await supabase.from("ev_energy_comparisons").delete().eq("listing_id", listingId).not("id", "in", `(${existingEcIds.join(",")})`);
      for (const ec of energyComps) {
        const payload = { listing_id: listingId, category: ec.category, name: ec.name, fuel_type: ec.fuel_type, mileage: ec.mileage, fuel_price: ec.fuel_price, model_used: ec.model_used, brand: (() => {
          const b = ec.brand ? ec.brand.trim().toUpperCase() : "";
          return b === "TATA" ? "TATA MOTORS" : b;
        })() };
        if (ec.id) {
          await supabase.from("ev_energy_comparisons").update(payload).eq("id", ec.id);
        } else {
          await supabase.from("ev_energy_comparisons").insert(payload);
        }
      }
    }
    // Auto rebuild search summary
    fetch("/api/build-summary").catch((e) => console.error("Error rebuilding summary:", e));
    setSaving(false); setEditing(null); fetchListings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing and all its variants?")) return;
    
    // Find the listing to get its variants
    const listing = listings.find((l) => l.id === id);
    if (listing && listing.variants.length > 0) {
      const variantIds = listing.variants.map((v) => v.id);
      // Delete variant features first
      await supabase.from("ev_variant_features").delete().in("variant_id", variantIds);
      // Delete variants
      await supabase.from("ev_variants").delete().eq("listing_id", id);
    }
    
    // Delete energy comparisons
    await supabase.from("ev_energy_comparisons").delete().eq("listing_id", id);
    
    // Finally delete the main listing
    const { error } = await supabase.from("evlistings").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
    }
    
    // Auto rebuild search summary
    fetch("/api/build-summary").catch((e) => console.error("Error rebuilding summary:", e));
    fetchListings();
  };

  if (!user) return <LoginScreen supabase={supabase} loginError={loginError} setLoginError={setLoginError} onSuccess={(u) => setUser(u)} />;

  return (
    <div className="min-h-screen bg-slate-200 py-28 px-4">
      {showChangePassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">New Password</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
              </label>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">Team Dashboard</h1>
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[10px] sm:text-xs font-black uppercase px-3 py-1.5 transition-all active:scale-95 shadow-sm shadow-violet-100 cursor-pointer animate-pulse shrink-0"
                >
                  <Download size={12} /> Install App
                </button>
              )}
            </div>             <p className="text-xs sm:text-sm text-slate-500 truncate max-w-[150px] sm:max-w-none">{user.email}</p>
            <div className="flex gap-2.5 mt-1">
              <button 
                onClick={() => setShowChangePassword(true)} 
                className="text-[10px] sm:text-xs font-bold text-sky-600 hover:text-sky-700 transition"
              >
                Change Password
              </button>
              <span className="text-[10px] sm:text-xs text-slate-350">|</span>
              <button 
                onClick={handleLogout} 
                className="text-[10px] sm:text-xs font-bold text-rose-550 hover:text-rose-750 transition"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <button onClick={() => { setActiveSection("all_listings"); setEditing(null); setSelectedBrand(""); setSelectedModelId(""); setTableBrandFilter(""); }} className="inline-flex items-center gap-1 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              View All Listings
            </button>
            <button onClick={() => { setActiveSection("media"); }} className="inline-flex items-center gap-1 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              View All Media
            </button>
            <button onClick={() => { setActiveSection("chargers"); }} className="inline-flex items-center gap-1 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              View All Chargers
            </button>
          </div>
        </div>

        {/* Section tabs - select dropdown on mobile, buttons on desktop */}
        <div className="block sm:hidden mb-6">
          <select
            value={activeSection}
            onChange={(e) => {
              const val = e.target.value as any;
              setActiveSection(val);
              if (val === "listings") {
                setSelectedBrand("");
                setSelectedModelId("");
                setEditing(null);
              }
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none cursor-pointer"
          >            <option value="listings">EV Listings</option>
            <option value="leads">Enquiries {pendingEnquiriesCount > 0 ? `(${pendingEnquiriesCount} new)` : ""}</option>
            <option value="foryou_leads">✨ For You {pendingForYouCount > 0 ? `(${pendingForYouCount} new)` : ""}</option>
            {/* <option value="prices">⛽ Fuel Prices</option> */}
            <option value="analytics">📊 Analytics</option>
            <option value="map">📍 Map</option>
            <option value="banners">🖼️ Banners</option>
            <option value="content">📄 Content</option>
            <option value="offers">🏷️ Offers</option>
            <option value="chargers">🔌 Chargers Compatibility</option>
            <option value="protest">📢 Protest</option>
          </select>
        </div>

        <div className="hidden sm:flex gap-2 mb-6 overflow-x-auto">
          <button onClick={() => { setActiveSection("listings"); setSelectedBrand(""); setSelectedModelId(""); setEditing(null); }}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "listings" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            EV Listings
          </button>
          <button onClick={() => setActiveSection("leads")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 relative ${activeSection === "leads" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            <MessageSquare size={14} /> Enquiries
            {pendingEnquiriesCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </button>
          <button onClick={() => setActiveSection("foryou_leads")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 relative ${activeSection === "foryou_leads" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            <Sparkles size={14} className={activeSection === "foryou_leads" ? "text-violet-400" : "text-violet-600"} /> For You
            {pendingForYouCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-600"></span>
              </span>
            )}
          </button>
          {/* <button onClick={() => setActiveSection("prices")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "prices" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            ⛽ Fuel Prices
          </button> */}
          <button onClick={() => setActiveSection("analytics")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "analytics" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            📊 Analytics
          </button>
          <button onClick={() => setActiveSection("map")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "map" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            📍 Map
          </button>
          <button onClick={() => setActiveSection("banners")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "banners" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            🖼️ Banners
          </button>
          <button onClick={() => setActiveSection("content")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "content" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            📄 Content
          </button>
          <button onClick={() => setActiveSection("offers")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "offers" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            🏷️ Offers
          </button>
          <button onClick={() => setActiveSection("approvals")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 ${activeSection === "approvals" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            🛡️ B2B Approvals
          </button>
          <button onClick={() => setActiveSection("vehicle_approvals")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 relative ${activeSection === "vehicle_approvals" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            🚗 Vehicle Approvals
          </button>
          <button onClick={() => setActiveSection("protest")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all shrink-0 relative ${activeSection === "protest" ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-800 hover:bg-slate-300 hover:text-slate-955 border border-slate-300"}`}>
            📢 Protest
          </button>
        </div>

        {activeSection === "leads" && <LeadsPanel supabase={supabase} userId={user.id} />}
        {activeSection === "foryou_leads" && <ForYouLeadsPanel supabase={supabase} userId={user.id} />}
        {activeSection === "approvals" && <ApprovalsPanel />}
        {activeSection === "vehicle_approvals" && <VehicleApprovalsPanel supabase={supabase} />}
        {activeSection === "protest" && <EventsPanel supabase={supabase} userEmail={user.email || ""} />}
        {activeSection === "prices" && <FuelPricesPanel supabase={supabase} userEmail={user.email || ""} />}
        {activeSection === "analytics" && <AnalyticsPanel supabase={supabase} />}
        {activeSection === "map" && <MapPanel supabase={supabase} userEmail={user.email || ""} />}
        {activeSection === "chargers" && <ChargersPanel supabase={supabase} userEmail={user.email || ""} listings={listings} />}
        {activeSection === "banners" && <BannersPanel supabase={supabase} />}
        {activeSection === "content" && <ContentPanel supabase={supabase} />}
        {activeSection === "offers" && <OffersPanel supabase={supabase} uniqueBrands={uniqueBrands} />}
        {activeSection === "media" && <MediaPanel supabase={supabase} />}
        {activeSection === "all_listings" && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{tableBrandFilter ? `${tableBrandFilter} Models` : `All EV Listings`} ({listings.filter((l) => tableBrandFilter ? l.brand === tableBrandFilter : true).length})</h3>
              <select
                value={tableBrandFilter}
                onChange={(e) => { setTableBrandFilter(e.target.value); setVisibleAllListingsCount(10); }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="">All Brands</option>
                {uniqueBrands.map((ub) => (
                  <option key={ub} value={ub}>{ub}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Brand</th>
                    <th className="px-6 py-3">Model</th>
                    <th className="px-6 py-3">Variants</th>
                    <th className="px-6 py-3">Featured</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listings.filter((l) => tableBrandFilter ? l.brand === tableBrandFilter : true).slice(0, visibleAllListingsCount).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-900">{l.brand}</td>
                      <td className="px-6 py-3 font-bold text-sky-700">{l.title} {(l as any).discontinued ? <span className="ml-2 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 uppercase tracking-wider font-bold">Discontinued</span> : null}</td>
                      <td className="px-6 py-3 text-slate-500">{l.variants?.length || 0} variants</td>
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={!!(l as any).featured}
                          onChange={async () => {
                            const newFeatured = !(l as any).featured;
                            const { error } = await supabase
                              .from("evlistings")
                              .update({ featured: newFeatured })
                              .eq("id", l.id);
                            if (!error) {
                              setListings(prev => prev.map(item => item.id === l.id ? { ...item, featured: newFeatured } : item));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => { setActiveSection("listings"); setSelectedBrand(l.brand); setSelectedModelId(l.id); }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {listings.filter((l) => tableBrandFilter ? l.brand === tableBrandFilter : true).length > visibleAllListingsCount && (
              <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50">
                <button 
                  onClick={() => setVisibleAllListingsCount(prev => prev + 10)}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors shadow-sm cursor-pointer"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === "listings" && (
        <>
        {/* {!editing && (
          <div className="mb-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 mt-1">
                  Rebuild structured files (`summary.json` and `llms.txt`) for external AI crawlers (ChatGPT, Gemini, Perplexity).
                </p>
              </div>
              <button
                type="button"
                onClick={handleRebuildAI}
                disabled={rebuildingAI}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors px-4 py-2.5 text-xs font-bold shrink-0 cursor-pointer"
              >
                {rebuildingAI ? "Rebuilding..." : "Rebuild AI Files"}
              </button>
            </div>
          </div>
        )} */}
        {/* Brand & Model Management Panel */}
        {!editing && (() => {
          if (listings.length === 0) {
            return (
              <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-4">
                  <Plus size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No EV Listings Found</h3>
                <p className="text-slate-500 mb-6 text-sm text-center max-w-md">Get started by adding your very first brand and EV model to the platform.</p>
                <button onClick={startNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white hover:bg-sky-700 transition-colors shadow-sm cursor-pointer">
                  <Plus size={18} /> Add First Brand & Model
                </button>
              </div>
            );
          }
          const selectedModel = listings.find((l) => l.id === selectedModelId);
          return (
            <>
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sky-700 mb-1">Select Brand</label>
                  <select
                    className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                    value={selectedBrand}
                    onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModelId(""); }}
                  >
                    <option value="">Select a brand...</option>
                    {uniqueBrands.map((ub) => (
                      <option key={ub} value={ub}>{ub}</option>
                    ))}
                  </select>
                </div>
                
                {selectedBrand ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sky-700 mb-1">Select Model</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        className="w-full sm:flex-1 min-w-0 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                      >
                        <option value="">Select a model...</option>
                        {filteredListings.map((l) => {
                          const years = Array.from(new Set(l.variants.map((v) => v.model_year).filter(Boolean))).sort();
                          const yearsStr = years.length > 0 ? ` [${years.join(", ")}]` : "";
                          const discStr = (l as any).discontinued ? " (Discontinued)" : "";
                          return (
                            <option key={l.id} value={l.id}>{l.brand} {l.title} ({l.variants.length} variants){yearsStr}{discStr}</option>
                          );
                        })}
                      </select>
                      <button onClick={startNew} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-sky-600 px-3.5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-sky-700 transition-colors shrink-0">
                        <Plus size={16} /> Add Model
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <button onClick={startNew} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white hover:bg-sky-700 transition-colors">
                      <Plus size={16} /> Add Brand
                    </button>
                  </div>
                )}
              </div>

              {selectedBrand && (
                <div className="mt-4 pt-4 border-t border-sky-200/50">
                  <div className="flex items-center gap-1.5 mb-3">
                    {selectedModel && (
                      <button 
                        onClick={() => { if (confirm(`Delete "${selectedModel.brand} ${selectedModel.title}" and all its variants?`)) { handleDelete(selectedModel.id); setSelectedModelId(""); } }}
                        className="p-1 rounded text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Delete ${selectedModel.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <p className="text-sm font-bold text-sky-700 flex items-center flex-wrap gap-2">
                      {selectedModel ? `${selectedModel.brand} ${selectedModel.title}` : `Manage Models (${selectedBrand})`}
                      {selectedModel && (selectedModel as any).discontinued && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                          Discontinued {(selectedModel as any).discontinued_date ? `(${ (selectedModel as any).discontinued_date })` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-4">
                    {selectedModel && (
                      <>
                        <button onClick={() => { startEdit(selectedModel); setListingFormTab("variants"); setEditingVariantId(null); }}
                          className="inline-flex items-center gap-1 sm:gap-2 rounded-xl bg-sky-600 px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-white hover:bg-sky-700 shrink-0">
                          <Plus size={14} /> Add Variant
                        </button>
                        <button onClick={() => { startEdit(selectedModel); setListingFormTab("core"); setEditingVariantId(null); }}
                          className="inline-flex items-center gap-1 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 shrink-0">
                          Edit Model
                        </button>
                      </>
                    )}
                  </div>

                  {/* Variants list for selected model */}
                  {selectedModel && selectedModel.variants.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      {selectedModel.variants.map((v) => (
                        <div key={v.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={async () => { if (!confirm(`Delete variant "${v.variant_name}"?`)) return; await supabase.from("ev_variants").delete().eq("id", v.id); fetchListings(); }}
                              className="p-1 rounded text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={`Delete variant ${v.variant_name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                            <div>
                              <p className="text-sm font-extrabold text-slate-900 flex items-center flex-wrap gap-1.5">
                                {v.variant_name}
                                {(v as any).version_name && <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">{(v as any).version_name}</span>}
                                {v.model_year && <span className="text-xs font-bold text-slate-850 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{v.model_year}</span>}
                                {(v as any).discontinued && <span className="text-xs font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">Discontinued</span>}
                              </p>
                              <p className="text-xs font-bold text-slate-800 mt-0.5">₹{v.price}L · {v.driving_range_km}km · {v.battery_capacity_kwh}kWh {v.has_baas && <span className="text-emerald-700 font-black bg-emerald-50 px-1 rounded border border-emerald-200">· BAAS</span>}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { startEdit(selectedModel); setListingFormTab("variants"); setEditingVariantId(v.id); }}
                              className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer">Edit</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedModel && selectedModel.variants.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No variants yet. Click &quot;Add Variant&quot; to add one.</p>
                  )}
                </div>
              )}
            </div>
            </>
          );
        })()}
        
        {/* Edit Form */}
        {editing && (
          <div className="mb-8 rounded-2xl border-2 border-slate-300 bg-slate-50 p-6 shadow-sm text-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-lg font-bold text-slate-900">{editing === "new" ? "New Listing" : "Edit Listing"}</h2>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyFormat}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                    >
                      Copy Format
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPastedJson("");
                        setIsPasteModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                    >
                      Paste Format
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={copyDetailedVariant}
                      onChange={(e) => setCopyDetailedVariant(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                    />
                    Detailed variant
                  </label>
                </div>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
            </div>

            {/* Tab dropdown for mobile */}
            <div className="block sm:hidden mb-5">
              <select
                value={listingFormTab}
                onChange={(e) => setListingFormTab(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="core">Core Details</option>
                <option value="media">Media</option>
                <option value="pricing">Pricing ({form.city_pricing?.length || 0})</option>
                <option value="variants">Variants ({variants.length})</option>
                <option value="energy">Energy Comparison ({energyComps.length})</option>
              </select>
            </div>

            {/* Tab buttons for desktop */}
            <div className="hidden sm:flex flex-wrap gap-1 rounded-xl border-2 border-slate-400 bg-slate-300 p-1 mb-5">
              {([
                { id: "core" as const, label: "Core Details" },
                { id: "media" as const, label: "Media" },
                { id: "pricing" as const, label: "Pricing", count: form.city_pricing?.length || 0 },
                { id: "variants" as const, label: "Variants", count: variants.length },
                { id: "energy" as const, label: "Energy Comparison", count: energyComps.length },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setListingFormTab(tab.id)}
                  className={`flex-1 min-w-[120px] rounded-lg px-4 py-3 text-sm font-extrabold transition-colors ${
                    listingFormTab === tab.id
                      ? "bg-slate-950 text-white shadow-md"
                      : "text-slate-800 hover:bg-slate-200/80 hover:text-slate-950"
                  }`}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      listingFormTab === tab.id ? "bg-slate-800 text-white" : "bg-slate-400/50 text-slate-900"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[12rem]">
            {listingFormTab === "core" && (
            <>
            {/* Basic fields */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Model"
                value={form.title}
                onChange={(v) => {
                  const oldListingSlug = form.slug || getListingSlug(form.brand, form.title);
                  const newListingSlug = getListingSlug(form.brand, v);
                  
                  if (isListingSlugDefault(form.slug, form.brand, form.title)) {
                    setForm({ ...form, title: v, slug: newListingSlug });

                    const updatedVariants = variants.map((varItem) => {
                      if (isVariantSlugDefault(varItem.slug, oldListingSlug, varItem)) {
                        return {
                          ...varItem,
                          slug: getVariantSlug(newListingSlug, varItem)
                        };
                      }
                      return varItem;
                    });
                    setVariants(updatedVariants);
                  } else {
                    setForm({ ...form, title: v });
                  }
                }}
              />
              <div className="flex flex-col gap-1">
                <Field
                  label="Slug"
                  value={form.slug}
                  onChange={(v) => {
                    const sanitized = v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                    const oldSlug = form.slug || getListingSlug(form.brand, form.title);
                    setForm({ ...form, slug: sanitized });

                    const updatedVariants = variants.map((varItem) => {
                      if (isVariantSlugDefault(varItem.slug, oldSlug, varItem)) {
                        return {
                          ...varItem,
                          slug: getVariantSlug(sanitized, varItem)
                        };
                      }
                      return varItem;
                    });
                    setVariants(updatedVariants);
                  }}
                  placeholder="auto-generated"
                />
                {(() => {
                  const computedListingSlug = form.slug || getListingSlug(form.brand, form.title);
                  if (!computedListingSlug) {
                    return <span className="text-[10px] text-slate-400">ℹ️ Slug will be auto-generated from Brand & Model</span>;
                  }
                  const clashing = listings.find((l) => l.id !== editing && l.slug === computedListingSlug);
                  if (clashing) {
                    const recommended = getNextAvailableListingSlug(computedListingSlug, editing, listings);
                    return (
                      <span className="text-[10px] text-rose-600 font-bold flex flex-col gap-0.5 mt-0.5">
                        <span>⚠️ Taken: clashes with {clashing.brand} {clashing.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const oldSlug = form.slug || getListingSlug(form.brand, form.title);
                            setForm({ ...form, slug: recommended });

                            const updatedVariants = variants.map((varItem) => {
                              if (isVariantSlugDefault(varItem.slug, oldSlug, varItem)) {
                                return {
                                  ...varItem,
                                  slug: getVariantSlug(recommended, varItem)
                                };
                              }
                              return varItem;
                            });
                            setVariants(updatedVariants);
                          }}
                          className="text-sky-600 hover:text-sky-700 underline text-left cursor-pointer"
                        >
                          Use recommended slug: {recommended}
                        </button>
                      </span>
                    );
                  }
                  return (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      ✓ Available: {computedListingSlug}
                    </span>
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <Field
                  label="Brand"
                  value={form.brand}
                  onChange={(v) => {
                    const uBrand = v.toUpperCase();
                    const oldListingSlug = form.slug || getListingSlug(form.brand, form.title);
                    const newListingSlug = getListingSlug(uBrand, form.title);

                    if (isListingSlugDefault(form.slug, form.brand, form.title)) {
                      setForm({ ...form, brand: uBrand, slug: newListingSlug });

                      const updatedVariants = variants.map((varItem) => {
                        if (isVariantSlugDefault(varItem.slug, oldListingSlug, varItem)) {
                          return {
                            ...varItem,
                            slug: getVariantSlug(newListingSlug, varItem)
                          };
                        }
                        return varItem;
                      });
                      setVariants(updatedVariants);
                    } else {
                      setForm({ ...form, brand: uBrand });
                    }
                  }}
                />
                {uniqueBrands.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">Quick Select:</span>
                    <select
                      value=""
                      onChange={(e) => {
                        const ub = e.target.value;
                        if (!ub) return;
                        const oldListingSlug = form.slug || getListingSlug(form.brand, form.title);
                        const newListingSlug = getListingSlug(ub, form.title);
                        if (isListingSlugDefault(form.slug, form.brand, form.title)) {
                          setForm({ ...form, brand: ub, slug: newListingSlug });

                          const updatedVariants = variants.map((varItem) => {
                            if (isVariantSlugDefault(varItem.slug, oldListingSlug, varItem)) {
                              return {
                                ...varItem,
                                slug: getVariantSlug(newListingSlug, varItem)
                              };
                            }
                            return varItem;
                          });
                          setVariants(updatedVariants);
                        } else {
                          setForm({ ...form, brand: ub });
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-white font-semibold text-slate-600 outline-none cursor-pointer max-w-[120px]"
                    >
                      <option value="">Choose Brand</option>
                      {uniqueBrands.map((ub) => (
                        <option key={ub} value={ub}>
                          {ub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <label className="block">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">Type</span>
                <select value={(Array.isArray(form.types) ? form.types[0] : form.types) || ""} onChange={(e) => setForm({ ...form, types: [e.target.value] })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none cursor-pointer">
                  <option value="">Select</option><option value="2 Wheeler">2 Wheeler</option><option value="3 Wheeler">3 Wheeler</option><option value="4 Wheeler">4 Wheeler</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">Price Bracket</span>
                <select value={form.price_bracket} onChange={(e) => setForm({ ...form, price_bracket: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none cursor-pointer">
                  <option value="">Select Bracket</option>
                  <option value="under-1L">Under ₹1 Lakh</option>
                  <option value="1-1.5">₹1L – ₹1.5L</option>
                  <option value="1.5-2">₹1.5L – ₹2L</option>
                  <option value="1-2">₹1L – ₹2L</option>
                  <option value="under-2L">Under ₹2 Lakh</option>
                  <option value="2-3">₹2L – ₹3L</option>
                  <option value="under-3L">Under ₹3 Lakh</option>
                  <option value="3-5">₹3L – ₹5L</option>

                  <option value="5-7">₹5L – ₹7L</option>
                  <option value="7-10">₹7L – ₹10L</option>
                  <option value="5-10">₹5L – ₹10L</option>
                  <option value="5-15">₹5L – ₹15L</option>
                  <option value="10-25">₹10L – ₹25L</option>
                  <option value="15-30">₹15L – ₹30L</option>
                  <option value="30+">₹30L+</option>
                  <option value="50+">₹50L+</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">Vehicle Type</span>
                <select value={form.body_type} onChange={(e) => setForm({ ...form, body_type: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none cursor-pointer">
                  <option value="">Select</option><option value="Scooter">Scooter</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Hatchback">Hatchback</option><option value="Compact SUV">Compact SUV</option><option value="MUV">MUV</option><option value="Bike">Bike</option><option value="Tempo">Tempo</option><option value="Autos">Autos</option><option value="Other">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">Usage Type</span>
                <select value={form.usage_type || ""} onChange={(e) => setForm({ ...form, usage_type: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none cursor-pointer">
                  <option value="">None</option>
                  <option value="Both">Both</option>
                  <option value="Goods">Goods</option>
                  <option value="Passenger">Passenger</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Launch Date</span>
                <input type="date" value={form.launchdate ?? ""} onChange={(e) => setForm({ ...form, launchdate: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Parent Model (Optional)</span>
                <select value={form.parent_id || ""} onChange={(e) => {
                  const newParentId = e.target.value;
                  if (newParentId) {
                    const p = listings.find((l) => l.id === newParentId);
                    if (p) {
                      setForm({
                        ...form,
                        parent_id: newParentId,
                        brand: p.brand,
                        body_type: p.body_type || "",
                        commercial: p.commercial,
                        photo: p.photo,
                        gallery_images: p.gallery_images ?? [],
                        colors: p.colors ?? [],
                        types: p.types ?? [],
                        pros: p.pros ?? [],
                        cons: p.cons ?? [],
                        price_bracket: (p as any).price_bracket || "",
                        has_baas: p.has_baas || false,
                        featured_photos: (p as any).featured_photos && (p as any).featured_photos.length > 0 ? (p as any).featured_photos : (p.photo ? [{ url: p.photo, variantId: null }] : []),
                        video_links: (p as any).video_links ?? [],
                      });
                      return;
                    }
                  }
                  setForm({ ...form, parent_id: newParentId });
                }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="">None (Standalone/Parent)</option>
                  {listings.filter((l) => l.id !== editing).map((l) => (
                    <option key={l.id} value={l.id}>{l.brand} - {l.title} ({l.slug})</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.commercial} onChange={(e) => setForm({ ...form, commercial: e.target.checked })} /> Commercial</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_baas} onChange={(e) => setForm({ ...form, has_baas: e.target.checked })} /> Has BAAS (Battery as a Service)</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.discontinued} onChange={(e) => setForm({ ...form, discontinued: e.target.checked })} /> Discontinued</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
            </div>

            {form.discontinued && (
              <div className="mt-3 max-w-xs">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Discontinued Date</span>
                  <input type="date" value={form.discontinued_date ?? ""} onChange={(e) => setForm({ ...form, discontinued_date: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                </label>
              </div>
            )}


            
            {/* Colors */}
            <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Colors</p>
                <button onClick={() => setForm({ ...form, colors: [...form.colors, ""] })} className="text-[10px] font-bold text-sky-600">+ Add Color</button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {form.colors.map((colorVal, i) => {
                  const parts = colorVal.split("/");
                  const isDual = parts.length > 1;
                  const primary = parts[0] || "FFFFFF";
                  const secondary = parts[1] || "FFFFFF";

                  const primaryHex = primary.startsWith("#") ? primary : `#${primary}`;
                  const secondaryHex = secondary.startsWith("#") ? secondary : `#${secondary}`;

                  return (
                    <div key={i} className="flex flex-col gap-1.5 bg-white rounded-xl border border-slate-200 p-2.5">
                      <div className="flex items-center gap-2">
                        {/* Visual Preview */}
                        <div 
                          className="h-7 w-7 rounded-lg border border-slate-300 shrink-0 shadow-xs" 
                          style={{ 
                            background: isDual 
                              ? `linear-gradient(135deg, ${primaryHex} 50%, ${secondaryHex} 50%)` 
                              : primaryHex 
                          }}
                        />

                        {/* Primary Color Picker & Input */}
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={primaryHex}
                            onChange={(e) => {
                              const newPrim = e.target.value.replace("#", "").toUpperCase();
                              const arr = [...form.colors];
                              arr[i] = isDual ? `${newPrim}/${secondary}` : newPrim;
                              setForm({ ...form, colors: arr });
                            }}
                            className="h-6 w-6 rounded-md border border-slate-200 p-0 cursor-pointer overflow-hidden outline-none shrink-0"
                          />
                          <input
                            value={primary}
                            onChange={(e) => {
                              const newPrim = e.target.value;
                              const arr = [...form.colors];
                              arr[i] = isDual ? `${newPrim}/${secondary}` : newPrim;
                              setForm({ ...form, colors: arr });
                            }}
                            placeholder="Primary"
                            className="w-16 rounded border border-slate-200 px-1 py-0.5 text-[10px] outline-none font-mono text-slate-800 text-center"
                          />
                        </div>

                        {/* Secondary Color Picker & Input (if Dual) */}
                        {isDual && (
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                            <input
                              type="color"
                              value={secondaryHex}
                              onChange={(e) => {
                                const newSec = e.target.value.replace("#", "").toUpperCase();
                                const arr = [...form.colors];
                                arr[i] = `${primary}/${newSec}`;
                                setForm({ ...form, colors: arr });
                              }}
                              className="h-6 w-6 rounded-md border border-slate-200 p-0 cursor-pointer overflow-hidden outline-none shrink-0"
                            />
                            <input
                              value={secondary}
                              onChange={(e) => {
                                const newSec = e.target.value;
                                const arr = [...form.colors];
                                arr[i] = `${primary}/${newSec}`;
                                setForm({ ...form, colors: arr });
                              }}
                              placeholder="Secondary"
                              className="w-16 rounded border border-slate-200 px-1 py-0.5 text-[10px] outline-none font-mono text-slate-800 text-center"
                            />
                          </div>
                        )}
                        
                        {/* Remove color box */}
                        <button type="button" onClick={() => setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })} className="ml-2 text-rose-400 hover:text-rose-600 text-xs font-bold shrink-0 cursor-pointer">×</button>
                      </div>

                      {/* Dualtone Toggle Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const arr = [...form.colors];
                            if (isDual) {
                              arr[i] = primary; // Revert to single
                            } else {
                              arr[i] = `${primary}/FFFFFF`; // Make dual
                            }
                            setForm({ ...form, colors: arr });
                          }}
                          className="text-[9px] font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                        >
                          {isDual ? "Revert to Single" : "Split Dualtone"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between mb-2"><p className="text-[10px] font-bold uppercase text-emerald-600">Pros</p><button onClick={() => { setForm({ ...form, pros: [...form.pros, ""] }); }} className="text-[10px] font-bold text-emerald-600">+ Add</button></div>
                {form.pros.map((p, i) => (<ProConInput key={i} value={p} onChange={(val) => { const arr = [...form.pros]; arr[i] = val; setForm({ ...form, pros: arr }); }} onRemove={() => setForm({ ...form, pros: form.pros.filter((_, j) => j !== i) })} color="emerald" />))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-2"><p className="text-[10px] font-bold uppercase text-amber-600">Cons</p><button onClick={() => { setForm({ ...form, cons: [...form.cons, ""] }); }} className="text-[10px] font-bold text-amber-600">+ Add</button></div>
                {form.cons.map((c, i) => (<ProConInput key={i} value={c} onChange={(val) => { const arr = [...form.cons]; arr[i] = val; setForm({ ...form, cons: arr }); }} onRemove={() => setForm({ ...form, cons: form.cons.filter((_, j) => j !== i) })} color="amber" />))}
              </div>
            </div>
            </>
            )}

            {listingFormTab === "media" && (
              <div className="space-y-4">
                {/* Featured (Photos & Videos) Section */}
                <div className="rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Featured (Photos &amp; Videos)</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, featured_photos: [...form.featured_photos, { url: "", variantId: null }] })}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                      >
                        + Add Photo
                      </button>
                      <span className="text-slate-300 text-xs">|</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, video_links: [...form.video_links, { url: "", title: "", variantId: null, variantName: null }] })}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                      >
                        + Add Video
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Photos Sub-list */}
                    {form.featured_photos.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Photos</p>
                        <div className="space-y-3">
                          {form.featured_photos.map((item, idx) => (
                            <div key={`photo-${idx}`} className="flex flex-col sm:flex-row gap-3 rounded-lg border border-slate-200 bg-white p-3 items-start sm:items-center">
                              {item.url && (
                                <img src={item.url} alt="preview" className="h-12 w-16 rounded-md object-cover border shrink-0 bg-slate-50" />
                              )}
                              <div className="flex-1 min-w-0 w-full space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const path = `evlistings/${form.slug || Date.now()}/featured-${Date.now()}-${file.name}`;
                                      const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });
                                      if (data) {
                                        const { data: u } = supabase.storage.from("evphotos").getPublicUrl(data.path);
                                        const arr = [...form.featured_photos];
                                        arr[idx] = { ...arr[idx], url: u.publicUrl };
                                        setForm({ ...form, featured_photos: arr });
                                      }
                                    }}
                                    className="w-full sm:w-auto text-xs cursor-pointer file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600 min-w-0"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Or paste image URL"
                                    value={item.url}
                                    onChange={(e) => {
                                      const arr = [...form.featured_photos];
                                      arr[idx] = { ...arr[idx], url: e.target.value };
                                      setForm({ ...form, featured_photos: arr });
                                    }}
                                    className="w-full sm:flex-1 min-w-0 rounded border border-slate-200 px-2.5 py-1 text-xs outline-none"
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Variant:</span>
                                  <select
                                    value={item.variantId || item.variantName || ""}
                                    onChange={(e) => {
                                      const selectedVal = e.target.value;
                                      const selectedVar = variants.find(v => v.id === selectedVal || v.variant_name === selectedVal);
                                      const arr = [...form.featured_photos];
                                      arr[idx] = { 
                                        ...arr[idx], 
                                        variantId: selectedVar?.id || null, 
                                        variantName: selectedVar?.variant_name || null 
                                      };
                                      setForm({ ...form, featured_photos: arr });
                                    }}
                                    className="rounded border border-slate-200 px-2 py-1 text-xs outline-none bg-slate-50 cursor-pointer"
                                  >
                                    <option value="">Model (Default)</option>
                                    {variants.filter(v => v.variant_name).map((v, vidx) => (
                                      <option key={v.id || vidx} value={v.id || v.variant_name}>{v.variant_name} {v.model_year ? `(${v.model_year})` : ""}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                {/* Image Toolkit (4 Actions) */}
                                {item.url && (
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1">
                                    {/* Remove BG */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBg(item.url, "featured", idx)}
                                      disabled={bgRemovingId !== null || flippingId !== null}
                                      className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-650 text-[10px] font-bold transition-colors border border-slate-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                                    >
                                      {bgRemovingId === `featured-${idx}` ? (
                                        <>
                                          <Loader2 size={12} className="animate-spin text-violet-600" />
                                          <span>{bgRemoveProgress}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles size={12} className="text-violet-600" />
                                          Remove BG
                                        </>
                                      )}
                                    </button>

                                    {/* Crop */}
                                    <button
                                      type="button"
                                      onClick={() => setCropImageInfo({ url: item.url, listingTitle: form.title, listingBrand: form.brand, type: "featured", index: idx })}
                                      disabled={bgRemovingId !== null || flippingId !== null}
                                      className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-650 text-[10px] font-bold transition-colors border border-slate-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                                    >
                                      <Crop size={12} className="text-amber-600" />
                                      Crop
                                    </button>

                                    {/* Flip Horizontal */}
                                    <button
                                      type="button"
                                      onClick={() => handleFlipHorizontal(item.url, "featured", idx)}
                                      disabled={bgRemovingId !== null || flippingId !== null}
                                      className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-650 text-[10px] font-bold transition-colors border border-slate-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                                    >
                                      {flippingId === `featured-${idx}` ? (
                                        <Loader2 size={12} className="animate-spin text-sky-600" />
                                      ) : (
                                        <>
                                          <FlipHorizontal size={12} className="text-sky-600" />
                                          Flip
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, featured_photos: form.featured_photos.filter((_, i) => i !== idx) })}
                                className="text-rose-400 hover:text-rose-600 text-sm font-bold shrink-0 self-start sm:self-center"
                              >
                                × Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos Sub-list */}
                    {form.video_links.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Videos</p>
                        <div className="space-y-3">
                          {form.video_links.map((item, idx) => (
                            <div key={`video-${idx}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                                <input
                                  type="text"
                                  placeholder="Video Title / Label (e.g. Walkaround, Review)"
                                  value={item.title || ""}
                                  onChange={(e) => {
                                    const arr = [...form.video_links];
                                    arr[idx] = { ...arr[idx], title: e.target.value };
                                    setForm({ ...form, video_links: arr });
                                  }}
                                  className="w-full sm:w-1/3 min-w-0 rounded border border-slate-200 px-2.5 py-1 text-xs outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Paste Video URL (e.g. YouTube link)"
                                  value={item.url}
                                  onChange={(e) => {
                                    const arr = [...form.video_links];
                                    arr[idx] = { ...arr[idx], url: e.target.value };
                                    setForm({ ...form, video_links: arr });
                                  }}
                                  className="flex-1 min-w-0 rounded border border-slate-200 px-2.5 py-1 text-xs outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setForm({ ...form, video_links: form.video_links.filter((_, i) => i !== idx) })}
                                  className="text-rose-400 hover:text-rose-600 text-sm font-bold shrink-0 self-end sm:self-center"
                                >
                                  × Remove
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Variant</span>
                                <select
                                  value={item.variantId || item.variantName || ""}
                                  onChange={(e) => {
                                    const selectedVal = e.target.value;
                                    const selectedVar = variants.find(v => v.id === selectedVal || v.variant_name === selectedVal);
                                    const arr = [...form.video_links];
                                    arr[idx] = { 
                                      ...arr[idx], 
                                      variantId: selectedVar?.id || null, 
                                      variantName: selectedVar?.variant_name || null 
                                    };
                                    setForm({ ...form, video_links: arr });
                                  }}
                                  className="rounded border border-slate-200 px-2 py-1 text-xs outline-none bg-slate-50 cursor-pointer"
                                >
                                  <option value="">Model (Default)</option>
                                  {variants.filter(v => v.variant_name).map((v, vidx) => (
                                    <option key={v.id || vidx} value={v.id || v.variant_name}>{v.variant_name} {v.model_year ? `(${v.model_year})` : ""}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty state when neither photos nor videos exist */}
                    {form.featured_photos.length === 0 && form.video_links.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-500 bg-white/50 rounded-lg border border-dashed border-slate-300">
                        No featured media added yet. Use &quot;+ Add Photo&quot; or &quot;+ Add Video&quot; above.
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Section */}
                <div className="rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Gallery</p>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, gallery_images: [...form.gallery_images, { url: "", type: "", colorCode: "", variantId: null }] })}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                    >
                      + Add Image
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {form.gallery_images.map((item, idx) => {
                      const isObj = typeof item === "object" && item !== null;
                      const url = isObj ? (item as any).url : item;
                      const imgType = isObj ? (item as any).type || "" : "";
                      const colorCode = isObj ? (item as any).colorCode || "" : "";
                      const variantId = isObj ? (item as any).variantId || "" : "";
                      const variantName = isObj ? (item as any).variantName || "" : "";

                      return (
                        <div key={idx} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            {url && (
                              <img src={url} alt="preview" className="h-12 w-16 rounded-md object-cover border shrink-0 bg-slate-50" />
                            )}
                            <div className="flex-1 min-w-0 w-full flex flex-col sm:flex-row gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const path = `evlistings/${form.slug || Date.now()}/gallery-${Date.now()}-${file.name}`;
                                  const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });
                                  if (data) {
                                    const { data: u } = supabase.storage.from("evphotos").getPublicUrl(data.path);
                                    const arr = [...form.gallery_images];
                                    arr[idx] = { url: u.publicUrl, type: imgType, colorCode, variantId, variantName };
                                    setForm({ ...form, gallery_images: arr });
                                  }
                                }}
                                className="text-xs max-w-xs cursor-pointer file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600 min-w-0"
                              />
                              <input
                                type="text"
                                placeholder="Paste gallery image URL"
                                value={url}
                                onChange={(e) => {
                                  const arr = [...form.gallery_images];
                                  arr[idx] = { url: e.target.value, type: imgType, colorCode, variantId, variantName };
                                  setForm({ ...form, gallery_images: arr });
                                }}
                                className="flex-1 min-w-0 rounded border border-slate-200 px-2.5 py-1 text-xs outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, gallery_images: form.gallery_images.filter((_, i) => i !== idx) })}
                              className="text-rose-400 hover:text-rose-600 text-sm font-bold shrink-0 self-start sm:self-center"
                            >
                              × Remove
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Tag:</span>
                              <select
                                value={imgType}
                                onChange={(e) => {
                                  const arr = [...form.gallery_images];
                                  arr[idx] = { url, type: e.target.value, colorCode, variantId, variantName };
                                  setForm({ ...form, gallery_images: arr });
                                }}
                                className="rounded border border-slate-200 px-2 py-1 text-xs outline-none bg-slate-50"
                              >
                                <option value="">No tag</option>
                                <option value="color">Color</option>
                                <option value="interior">Interior</option>
                                <option value="exterior">Exterior</option>
                              </select>
                            </div>
                            
                            {imgType === "color" && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Color:</span>
                                <select
                                  value={colorCode}
                                  onChange={(e) => {
                                    const arr = [...form.gallery_images];
                                    arr[idx] = { url, type: imgType, colorCode: e.target.value, variantId, variantName };
                                    setForm({ ...form, gallery_images: arr });
                                  }}
                                  className="rounded border border-slate-200 px-2 py-1 text-xs outline-none bg-slate-50"
                                >
                                  <option value="">Pick color</option>
                                  {form.colors.map((c, ci) => (<option key={ci} value={c}>{c}</option>))}
                                </select>
                                {colorCode && (
                                  <div className="h-5 w-5 rounded border" style={{ backgroundColor: colorCode.startsWith("#") ? colorCode : `#${colorCode}` }} />
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Variant:</span>
                              <select
                                value={variantId || variantName || ""}
                                onChange={(e) => {
                                  const selectedVal = e.target.value;
                                  const selectedVar = variants.find(v => v.id === selectedVal || v.variant_name === selectedVal);
                                  const arr = [...form.gallery_images];
                                  arr[idx] = { 
                                    url, 
                                    type: imgType, 
                                    colorCode, 
                                    variantId: selectedVar?.id || null, 
                                    variantName: selectedVar?.variant_name || null 
                                  };
                                  setForm({ ...form, gallery_images: arr });
                                }}
                                className="rounded border border-slate-200 px-2 py-1 text-xs outline-none bg-slate-50"
                              >
                                <option value="">Model (Default)</option>
                                {variants.filter(v => v.variant_name).map((v, vidx) => (
                                  <option key={v.id || vidx} value={v.id || v.variant_name}>{v.variant_name} {v.model_year ? `(${v.model_year})` : ""}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          {/* Image Toolkit (4 Actions) */}
                          {url && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1">
                              {/* Remove BG */}
                              <button
                                type="button"
                                onClick={() => handleRemoveBg(url, "gallery", idx)}
                                disabled={bgRemovingId !== null || flippingId !== null}
                                className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-650 text-[10px] font-bold transition-colors border border-slate-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                              >
                                {bgRemovingId === `gallery-${idx}` ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin text-violet-600" />
                                    <span>{bgRemoveProgress}</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={12} className="text-violet-600" />
                                    Remove BG
                                  </>
                                )}
                              </button>

                              {/* Crop */}
                              <button
                                type="button"
                                onClick={() => setCropImageInfo({ url, listingTitle: form.title, listingBrand: form.brand, type: "gallery", index: idx })}
                                disabled={bgRemovingId !== null || flippingId !== null}
                                className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-650 text-[10px] font-bold transition-colors border border-slate-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                              >
                                <Crop size={12} className="text-amber-600" />
                                Crop
                              </button>

                              {/* Flip Horizontal */}
                              <button
                                type="button"
                                onClick={() => handleFlipHorizontal(url, "gallery", idx)}
                                disabled={bgRemovingId !== null || flippingId !== null}
                                className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-650 text-[10px] font-bold transition-colors border border-slate-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                              >
                                {flippingId === `gallery-${idx}` ? (
                                  <Loader2 size={12} className="animate-spin text-sky-600" />
                                ) : (
                                  <>
                                    <FlipHorizontal size={12} className="text-sky-600" />
                                    Flip
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {form.gallery_images.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-500 bg-white/50 rounded-lg border border-dashed border-slate-300">
                        No gallery images added yet. Click "+ Add Image" to add one, or select files.
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        const urls: any[] = [];
                        for (const file of files) {
                          const path = `evlistings/${form.slug || Date.now()}/gallery-${Date.now()}-${file.name}`;
                          const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });
                          if (data) {
                            const { data: u } = supabase.storage.from("evphotos").getPublicUrl(data.path);
                            urls.push({ url: u.publicUrl, type: "", colorCode: "", variantId: null });
                          }
                        }
                        setForm({ ...form, gallery_images: [...form.gallery_images, ...urls] });
                      }}
                      className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600"
                    />
                  </div>
                </div>


              </div>
            )}

            {listingFormTab === "variants" && (
            <div className="rounded-xl border-2 border-sky-300 bg-sky-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-sky-700">
                  {editingVariantId ? `Editing: ${variants.find((v) => (v as any).id === editingVariantId)?.variant_name || "Variant"}` : `Variants (${variants.length})`}
                </p>
              </div>
              {/* Actions row */}
              <div className="grid grid-cols-2 gap-2 mb-4 rounded-xl bg-white border border-sky-200 p-3 sm:flex sm:flex-wrap">
                <button onClick={() => { setVariants([...variants, { ...emptyVariant }]); setActiveVariantIndex(variants.length); setEditingVariantId(null); }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer transition-colors w-full sm:w-auto">
                  <Plus size={12} className="shrink-0" /> Add New
                </button>
                <button onClick={() => { const current = variants[activeVariantIndex]; if (current) { const clone = { ...current, variant_name: `${current.variant_name} (Copy)`, slug: "", id: undefined } as any; delete clone.id; setVariants([...variants, clone]); setActiveVariantIndex(variants.length); setEditingVariantId(null); } }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 cursor-pointer transition-colors w-full sm:w-auto">
                  <Copy size={12} className="shrink-0" /> Clone Current
                </button>
                <button onClick={handleCopyVariant}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 cursor-pointer transition-colors w-full sm:w-auto">
                  <Clipboard size={12} className="shrink-0" /> Copy Variant
                </button>
                <button onClick={() => { setPastedVariantJson(""); setIsPasteVariantModalOpen(true); }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 cursor-pointer transition-colors w-full sm:w-auto">
                  <Clipboard size={12} className="shrink-0 opacity-70" /> Paste Variant
                </button>
                {variants.length > 1 && (
                  <button onClick={() => { if (!confirm(`Remove "${variants[activeVariantIndex]?.variant_name || "this variant"}"?`)) return; const arr = variants.filter((_, j) => j !== activeVariantIndex); setVariants(arr); setActiveVariantIndex(Math.max(0, activeVariantIndex - 1)); setEditingVariantId(null); }}
                    className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors w-full sm:col-span-auto sm:w-auto">
                    <Trash2 size={12} className="shrink-0" /> Remove Variant
                  </button>
                )}
                {editingVariantId && (
                  <button onClick={() => setEditingVariantId(null)}
                    className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors w-full sm:col-span-auto sm:w-auto">
                    <Eye size={12} className="shrink-0" /> Show All
                  </button>
                )}
              </div>

              {variants.length > 0 && !editingVariantId && (
                <div className="mb-4">
                  <select
                    value={activeVariantIndex}
                    onChange={(e) => setActiveVariantIndex(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-sky-400 bg-white px-4 py-3 text-sm font-bold text-sky-900 outline-none shadow-md focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
                  >
                    {variants.map((v, idx) => (
                      <option key={idx} value={idx}>
                        {v.variant_name || `Variant ${idx + 1}`} {v.price ? `(₹${v.price}L)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {variants.map((v, i) => (
                i === (activeVariantIndex < variants.length ? activeVariantIndex : 0) && (
                <div key={i} className="mb-4 rounded-lg border-2 border-slate-300 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-200 border-b border-slate-300">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      {v.variant_name || `Variant ${i + 1}`}
                      {v.price ? <span className="text-[10px] font-medium text-slate-400">₹{v.price}L</span> : null}
                    </span>
                  </div>
                  <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                    <MiniInput
                      label="Variant Name"
                      value={v.variant_name}
                      onChange={(val) => updateVariantField(i, { variant_name: val })}
                    />
                    <div className="flex flex-col gap-1">
                      <MiniInput
                        label="Variant Slug"
                        value={v.slug || ""}
                        placeholder="auto-generated"
                        onChange={(val) => updateVariantField(i, { slug: val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                      />
                      {(() => {
                        const parentSlug = (form.slug || getListingSlug(form.brand, form.title)).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                        const computedVariantSlug = v.slug || getVariantSlug(parentSlug, v);
                        
                        if (!computedVariantSlug) {
                          return <span className="text-[10px] text-slate-400">ℹ️ Auto-generated on save</span>;
                        }
                        
                        const localClashIdx = variants.findIndex((varItem, idx) => {
                          if (idx === i) return false;
                          const otherComputed = varItem.slug || getVariantSlug(parentSlug, varItem);
                          return otherComputed === computedVariantSlug;
                        });
                        
                        let dbClashStr = null;
                        if (localClashIdx === -1) {
                          for (const l of listings) {
                            if (l.id === editing) continue;
                            for (const otherV of l.variants) {
                              if ((otherV.slug || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") === computedVariantSlug) {
                                dbClashStr = `${l.brand} ${l.title} (${otherV.variant_name})`;
                                break;
                              }
                            }
                            if (dbClashStr) break;
                          }
                        }
                        
                        if (localClashIdx !== -1 || dbClashStr) {
                          const recommended = getNextAvailableVariantSlug(computedVariantSlug, i, parentSlug, variants, listings, editing);
                          const clashMsg = localClashIdx !== -1 
                            ? `Variant ${localClashIdx + 1}`
                            : dbClashStr;
                          return (
                            <span className="text-[10px] text-rose-600 font-bold flex flex-col gap-0.5 mt-0.5">
                              <span>⚠️ Taken: clashes with {clashMsg}</span>
                              <button
                                type="button"
                                onClick={() => updateVariantField(i, { slug: recommended })}
                                className="text-sky-600 hover:text-sky-700 underline text-left cursor-pointer"
                              >
                                Use recommended slug: {recommended}
                              </button>
                            </span>
                          );
                        }
                        
                        return (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            ✓ Available: {computedVariantSlug}
                          </span>
                        );
                      })()}
                    </div>
                    <MiniInput label="Version/Refresh" value={v.version_name || ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], version_name: val }; setVariants(arr); }} />
                    <MiniInput label="Launch Date" value={v.launch_date || ""} onChange={(val) => updateVariantField(i, { launch_date: val })} />
                    <MiniInput label="Model Year" value={String(v.model_year)} onChange={(val) => updateVariantField(i, { model_year: cleanInt(val, 2026) })} />
                    <MiniInput label="Price (Lakh)" value={String(v.price || "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], price: cleanPriceLakh(val) }; setVariants(arr); }} />
                  </div>
                  
                  {/* Row with Usage Type, Exclusive Color, and Discontinued */}
                  <div className="mb-4 p-4 rounded-xl border border-slate-300 bg-slate-50 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {/* Usage Type Select */}
                      <label className="block">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Usage Type</span>
                        <select
                          value={v.usage_type || ""}
                          onChange={(e) => updateVariantField(i, { usage_type: e.target.value || null })}
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none cursor-pointer h-[34px] leading-tight"
                        >
                          <option value="">None / Unspecified</option>
                          <option value="Both">Both</option>
                          <option value="Goods">Goods</option>
                          <option value="Passenger">Passenger</option>
                        </select>
                      </label>

                      {/* Exclusive Color Toggle */}
                      <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800 cursor-pointer select-none h-full md:mt-5">
                        <input
                          type="checkbox"
                          checked={!!v.has_exclusive_color}
                          onChange={(e) => {
                            const arr = [...variants];
                            arr[i] = { ...arr[i], has_exclusive_color: e.target.checked };
                            setVariants(arr);
                          }}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                        />
                        Has Exclusive Color
                      </label>

                      {/* Discontinued Toggle */}
                      <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800 cursor-pointer select-none h-full md:mt-5">
                        <input
                          type="checkbox"
                          checked={!!v.discontinued}
                          onChange={(e) => {
                            const arr = [...variants];
                            arr[i] = { ...arr[i], discontinued: e.target.checked };
                            setVariants(arr);
                          }}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                        />
                        Discontinued Variant
                      </label>
                    </div>
                  </div>

                  {/* BAAS standalone block */}
                  <div className="mb-4 p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 flex flex-col gap-4">
                    <label className="flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-wider text-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!v.has_baas}
                        onChange={(e) => {
                          const arr = [...variants];
                          arr[i] = { ...arr[i], has_baas: e.target.checked };
                          setVariants(arr);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-5 w-5"
                      />
                      Enable Battery-as-a-Service (BaaS) for this variant
                    </label>

                    {v.has_baas && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        {/* 1. Upfront Price */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Upfront Price (Ex-Battery)</span>
                          <input
                            type="text"
                            value={v.baas_upfront_price ?? ""}
                            onChange={(e) => {
                              const arr = [...variants];
                              arr[i] = { ...arr[i], baas_upfront_price: e.target.value || null };
                              setVariants(arr);
                            }}
                            placeholder="e.g. 10.5 (Lakh)"
                            className="w-full bg-transparent text-sm font-black text-slate-900 leading-tight outline-none"
                          />
                        </div>

                        {/* 2. Capacity */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Battery Capacity (kWh)</span>
                          <input
                            type="text"
                            value={v.battery_capacity_kwh ?? ""}
                            onChange={(e) => {
                              const arr = [...variants];
                              arr[i] = { ...arr[i], battery_capacity_kwh: e.target.value || null };
                              setVariants(arr);
                            }}
                            placeholder="e.g. 40"
                            className="w-full bg-transparent text-sm font-black text-slate-900 leading-tight outline-none"
                          />
                        </div>

                        {/* 3. Range */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Driving Range (km)</span>
                          <input
                            type="text"
                            value={v.driving_range_km ?? ""}
                            onChange={(e) => {
                              const arr = [...variants];
                              arr[i] = { ...arr[i], driving_range_km: e.target.value || null };
                              setVariants(arr);
                            }}
                            placeholder="e.g. 315"
                            className="w-full bg-transparent text-sm font-black text-slate-900 leading-tight outline-none"
                          />
                        </div>

                        {/* 4. Charge */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">DC Charging Time (mins)</span>
                          <input
                            type="text"
                            value={v.charging_time_mins ?? ""}
                            onChange={(e) => {
                              const arr = [...variants];
                              arr[i] = { ...arr[i], charging_time_mins: e.target.value || null };
                              setVariants(arr);
                            }}
                            placeholder="e.g. 60"
                            className="w-full bg-transparent text-sm font-black text-slate-900 leading-tight outline-none"
                          />
                        </div>

                        {/* 5. Rental Rate */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Rental Rate (₹/km)</span>
                          <input
                            type="text"
                            value={v.baas_price_per_km ?? ""}
                            onChange={(e) => {
                              const arr = [...variants];
                              arr[i] = { ...arr[i], baas_price_per_km: e.target.value || null };
                              setVariants(arr);
                            }}
                            placeholder="e.g. 2.5"
                            className="w-full bg-transparent text-sm font-black text-slate-900 leading-tight outline-none"
                          />
                        </div>

                        {/* 6. Min. Commitment */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Min. Commitment (km/mo)</span>
                          <input
                            type="text"
                            value={(() => {
                              const rental = parseFloat(String(v.baas_monthly_rental || ""));
                              const rate = parseFloat(String(v.baas_price_per_km || ""));
                              if (rental > 0 && rate > 0) return String(Math.round(rental / rate));
                              return v.baas_monthly_rental !== null ? "" : "1500";
                            })()}
                            onChange={(e) => {
                              const km = parseFloat(e.target.value);
                              const rate = parseFloat(String(v.baas_price_per_km || "0"));
                              const arr = [...variants];
                              if (!isNaN(km) && rate > 0) {
                                arr[i] = { ...arr[i], baas_monthly_rental: Math.round(km * rate) };
                              } else {
                                arr[i] = { ...arr[i], baas_monthly_rental: null };
                              }
                              setVariants(arr);
                            }}
                            placeholder="e.g. 1500"
                            className="w-full bg-transparent text-sm font-black text-slate-900 leading-tight outline-none"
                          />
                        </div>

                        {/* 7. Min. Monthly Bill (₹/mo) */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Min. Monthly Bill (₹/mo)</span>
                          <input
                            type="text"
                            value={v.baas_monthly_rental ?? ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const arr = [...variants];
                              arr[i] = { ...arr[i], baas_monthly_rental: isNaN(val) ? null : val };
                              setVariants(arr);
                            }}
                            placeholder="e.g. 5250"
                            className="w-full bg-transparent text-sm font-black text-slate-900 leading-tight outline-none"
                          />
                        </div>

                        {/* 8. Battery Ownership */}
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Battery Ownership</span>
                            <p className="text-xs font-black text-slate-800 leading-tight">
                              Leased ({v.baas_model_name || "OEM"} Leasing Partner)
                            </p>
                          </div>
                          <input
                            type="text"
                            value={v.baas_model_name ?? ""}
                            onChange={(e) => {
                              const arr = [...variants];
                              arr[i] = { ...arr[i], baas_model_name: e.target.value };
                              setVariants(arr);
                            }}
                            placeholder="Partner Name (e.g. OEM)"
                            className="w-full bg-transparent text-xs font-medium outline-none text-slate-500 mt-2 border-t border-slate-100 pt-1"
                          />
                        </div>

                        {/* 9. Battery Warranty */}
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 shadow-xs opacity-75">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Battery Warranty (Preview)</span>
                          <p className="text-xs font-black text-slate-700 leading-tight">
                            Lifetime Warranty <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">(Free Replacement &lt;70% Health)</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Conditional inputs */}
                    {(v.has_exclusive_color || v.discontinued) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                        {v.has_exclusive_color ? (
                          <div className="w-full">
                            <MiniInput
                              label="Exclusive Colors (comma/slash separated hex codes)"
                              value={Array.isArray(v.exclusive_colors) ? v.exclusive_colors.join(", ") : ""}
                              onChange={(val) => {
                                const arr = [...variants];
                                arr[i] = {
                                  ...arr[i],
                                  exclusive_colors: val.split(",").map((c) => c.trim()).filter(Boolean),
                                };
                                setVariants(arr);
                              }}
                            />
                          </div>
                        ) : <div />}

                        {v.discontinued && (
                          <div className="flex flex-col gap-3">
                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Discontinued Date</span>
                              <input
                                type="date"
                                value={v.discontinued_date ?? ""}
                                onChange={(e) => {
                                  const arr = [...variants];
                                  arr[i] = { ...arr[i], discontinued_date: e.target.value || null };
                                  setVariants(arr);
                                }}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs outline-none h-[34px] text-slate-900 bg-white"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Continuing Model/Slug/URL</span>
                              <select
                                value={v.continuing_variant_id || ""}
                                onChange={(e) => {
                                  const arr = [...variants];
                                  arr[i] = { ...arr[i], continuing_variant_id: e.target.value || null };
                                  setVariants(arr);
                                }}
                                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none cursor-pointer h-[34px] leading-tight"
                              >
                                <option value="">Select Continuing Variant...</option>
                                {variants.filter((itemV, idx) => idx !== i && itemV.variant_name).map((itemV, idx) => (
                                  <option key={itemV.id || idx} value={itemV.id || itemV.slug || itemV.variant_name}>
                                    {itemV.variant_name} ({itemV.model_year})
                                  </option>
                                ))}
                                <option value="__custom__">-- Custom Slug or URL --</option>
                              </select>
                            </label>
                            {/* If custom is selected or if they entered something not in the options list, let them edit custom text */}
                            {(v.continuing_variant_id && 
                              (v.continuing_variant_id === "__custom__" ||
                              !variants.some(itemV => itemV.id === v.continuing_variant_id || itemV.slug === v.continuing_variant_id || itemV.variant_name === v.continuing_variant_id))
                            ) && (
                              <div className="mt-1">
                                <MiniInput
                                  label="Custom Slug or Redirect URL"
                                  value={v.continuing_variant_id === "__custom__" ? "" : v.continuing_variant_id}
                                  placeholder="e.g. nexon-ev-2026 or https://..."
                                  onChange={(val) => {
                                    const arr = [...variants];
                                    arr[i] = { ...arr[i], continuing_variant_id: val || null };
                                    setVariants(arr);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const activeSpec = variantSpecSection[i] ?? "motor";
                    const setActiveSpec = (section: string) => setVariantSpecSection((prev) => ({ ...prev, [i]: section }));
                    const customSections: Array<{ title: string; fields: Array<{ label: string; value: string }> }> =
                      (v as any).extra_sections || [];
                    const legacyCustomFields: Array<{ label: string; value: string }> =
                      (v as any).custom_fields || [];
                    const specOptions: { value: string; label: string }[] = [
                      { value: "motor", label: "Motor & Engine" },
                      { value: "charging", label: "Charging & Battery" },
                      { value: "dimensions", label: "Dimension" },
                      { value: "brakes_wheels", label: "Brakes & Wheels" },
                      { value: "suspension", label: "Suspension & Chassis" },
                      { value: "warranty", label: "Warranty" },
                      { value: "features_safety", label: "Features & Safety" },
                      { value: "lights", label: "Lights" },
                      { value: "modes", label: "Driving Modes" },
                      ...customSections.map((s, idx) => ({
                        value: `custom-${idx}`,
                        label: s.title?.trim() || `Custom Section ${idx + 1}`,
                      })),
                      ...(legacyCustomFields.length > 0
                        ? [{ value: "extra_specs", label: "Extra Specs" }]
                        : []),
                    ];
                    const resolvedSpec = specOptions.some((o) => o.value === activeSpec) ? activeSpec : "motor";
                    const customIndex = resolvedSpec.startsWith("custom-")
                      ? parseInt(resolvedSpec.slice(7), 10)
                      : -1;
                    const addSection = () => {
                      const arr = [...variants];
                      const secs = [...((arr[i] as any).extra_sections || [])];
                      secs.push({ title: "", fields: [] });
                      (arr[i] as any).extra_sections = secs;
                      setVariants(arr);
                      setActiveSpec(`custom-${secs.length - 1}`);
                    };
                    const pushExtra = (kind: "field" | "checkbox") => {
                      const arr = [...variants];
                      if (resolvedSpec === "motor") {
                        (arr[i] as any).extra_motor = appendExtra(normalizeExtras((arr[i] as any).extra_motor), kind);
                      } else if (resolvedSpec === "charging") {
                        (arr[i] as any).extra_charging = appendExtra(normalizeExtras((arr[i] as any).extra_charging), kind);
                      } else if (resolvedSpec === "dimensions") {
                        (arr[i] as any).extra_dimensions = appendExtra(normalizeExtras((arr[i] as any).extra_dimensions), kind);
                      } else if (resolvedSpec === "features" || resolvedSpec === "features_safety") {
                        const ef = appendExtra(normalizeExtras((arr[i] as any).features?.extra_features), kind);
                        arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, extra_features: ef } };
                      } else if (resolvedSpec === "brakes_wheels") {
                        (arr[i] as any).extra_brakes = appendExtra(normalizeExtras((arr[i] as any).extra_brakes), kind);
                      } else if (resolvedSpec === "suspension") {
                        (arr[i] as any).extra_suspension = appendExtra(normalizeExtras((arr[i] as any).extra_suspension), kind);
                      } else if (resolvedSpec === "warranty") {
                        (arr[i] as any).extra_warranty = appendExtra(normalizeExtras((arr[i] as any).extra_warranty), kind);
                      } else if (resolvedSpec === "lights") {
                        (arr[i] as any).extra_lights = appendExtra(normalizeExtras((arr[i] as any).extra_lights), kind);
                      } else if (resolvedSpec === "modes") {
                        (arr[i] as any).extra_modes = appendExtra(normalizeExtras((arr[i] as any).extra_modes), kind);
                      } else if (resolvedSpec === "extra_specs") {
                        (arr[i] as any).custom_fields = appendExtra(normalizeExtras((arr[i] as any).custom_fields), kind);
                      } else if (customIndex >= 0 && customSections[customIndex]) {
                        const secs = [...((arr[i] as any).extra_sections || [])];
                        const fields = appendExtra(normalizeExtras(secs[customIndex].fields), kind);
                        secs[customIndex] = { ...secs[customIndex], fields };
                        (arr[i] as any).extra_sections = secs;
                      } else return;
                      setVariants(arr);
                    };
                    return (
                  <>
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <label className="block flex-1 min-w-[160px]">
                      <span className="text-[8px] font-bold uppercase text-slate-400">Spec section</span>
                      <select
                        value={resolvedSpec}
                        onChange={(e) => setActiveSpec(e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400"
                      >
                        {specOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={addSection}
                      className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
                    >
                      + Section
                    </button>
                    <button
                      type="button"
                      onClick={() => pushExtra("field")}
                      className="shrink-0 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] font-bold text-sky-700 hover:bg-sky-100"
                    >
                      + Extra field
                    </button>
                    <button
                      type="button"
                      onClick={() => pushExtra("checkbox")}
                      className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-[11px] font-bold text-violet-700 hover:bg-violet-100"
                    >
                      + Extra checkbox
                    </button>
                  </div>

                  {resolvedSpec === "motor" && (
                  <div className="mt-4 rounded-xl border-2 border-sky-300 bg-sky-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-sky-600">⚡ Motor & Engine</p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setMotorClipboard({ max_power_bhp: v.max_power_bhp, max_torque_nm: v.max_torque_nm, top_speed: v.top_speed, battery_capacity_kwh: v.battery_capacity_kwh, driving_range_km: v.driving_range_km, extra_motor: (v as any).extra_motor })} className="text-[10px] font-bold text-sky-600 hover:text-sky-700">📋 Copy</button>
                        {motorClipboard && (
                          <button type="button" onClick={() => {
                            setVariants(prev => prev.map((vr, vi) => {
                              if (vi === i || sameForAllMotor) {
                                return {
                                  ...vr,
                                  max_power_bhp: motorClipboard.max_power_bhp,
                                  max_torque_nm: motorClipboard.max_torque_nm,
                                  top_speed: motorClipboard.top_speed,
                                  battery_capacity_kwh: motorClipboard.battery_capacity_kwh,
                                  driving_range_km: motorClipboard.driving_range_km,
                                  extra_motor: motorClipboard.extra_motor,
                                };
                              }
                              return vr;
                            }));
                          }} className="text-[10px] font-bold text-sky-600 hover:text-sky-700">📋 Paste</button>
                        )}
                        <label className="flex items-center gap-1 text-[10px] font-bold text-violet-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sameForAllMotor}
                            onChange={(e) => {
                              setSameForAllMotor(e.target.checked);
                              if (e.target.checked) {
                                const src = variants[i];
                                setVariants(variants.map((vr) => ({
                                  ...vr,
                                  max_power_bhp: src.max_power_bhp,
                                  max_torque_nm: src.max_torque_nm,
                                  top_speed: src.top_speed,
                                  battery_capacity_kwh: src.battery_capacity_kwh,
                                  driving_range_km: src.driving_range_km,
                                  extra_motor: (src as any).extra_motor,
                                })));
                              }
                            }}
                          />
                          Same for all
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <MiniInput label="Max Power (bhp)" value={v.max_power_bhp ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], max_power_bhp: val }; setVariants(arr); }} />
                      <MiniInput label="Max Torque (Nm)" value={v.max_torque_nm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], max_torque_nm: val }; setVariants(arr); }} />
                      <MiniInput label="Top Speed (km/h)" value={v.top_speed ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], top_speed: val }; setVariants(arr); }} />
                      <MiniInput label="Range (km)" value={v.driving_range_km ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], driving_range_km: val }; setVariants(arr); }} />
                      <MiniInput label="Acceleration(sec)" value={v.acceleration ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], acceleration: val }; setVariants(arr); }} />
                      <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Motor Type / Drivetrain</span><select value={v.features?.drivetrain ?? "FWD"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, drivetrain: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none"><option value="FWD">FWD</option><option value="RWD">RWD</option><option value="AWD">AWD</option><option value="IPM">IPM</option><option value="PMSM">PMSM</option><option value="Hub Motor">Hub Motor</option></select></label>
                    </div>
                    <VariantExtrasEditor
                      extras={normalizeExtras((v as any).extra_motor)}
                      inputBorder="border-sky-200"
                      onChange={(next) => updateVariantMotorExtra(i, next)}
                    />
                  </div>
                  )}

                  {resolvedSpec === "charging" && (
                  <>
                  <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">🔋 Charging</p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setChargingClipboard({ charging_time_mins: v.charging_time_mins, charging_time_ac_hours: v.charging_time_ac_hours, charging_time_dc_mins: v.charging_time_dc_mins, max_dc_charging_rate_kw: v.max_dc_charging_rate_kw, has_baas: v.has_baas, baas_model_name: v.baas_model_name, baas_price_per_km: v.baas_price_per_km, baas_upfront_price: v.baas_upfront_price, extra_charging: (v as any).extra_charging || [] })} className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800">📋 Copy</button>
                        {chargingClipboard && (
                          <button type="button" onClick={() => {
                            setVariants(prev => prev.map((vr, vi) => {
                              if (vi === i || sameForAllCharging) {
                                return {
                                  ...vr,
                                  charging_time_mins: chargingClipboard.charging_time_mins,
                                  charging_time_ac_hours: chargingClipboard.charging_time_ac_hours,
                                  charging_time_dc_mins: chargingClipboard.charging_time_dc_mins,
                                  max_dc_charging_rate_kw: chargingClipboard.max_dc_charging_rate_kw,
                                  has_baas: chargingClipboard.has_baas,
                                  baas_model_name: chargingClipboard.baas_model_name,
                                  baas_price_per_km: chargingClipboard.baas_price_per_km,
                                  baas_upfront_price: chargingClipboard.baas_upfront_price,
                                  extra_charging: chargingClipboard.extra_charging,
                                };
                              }
                              return vr;
                            }));
                          }} className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800">📋 Paste</button>
                        )}
                        <label className="flex items-center gap-1 text-[10px] font-bold text-violet-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sameForAllCharging}
                            onChange={(e) => {
                              setSameForAllCharging(e.target.checked);
                              if (e.target.checked) {
                                const src = variants[i];
                                setVariants(variants.map((vr) => ({
                                  ...vr,
                                  charging_time_mins: src.charging_time_mins,
                                  charging_time_ac_hours: src.charging_time_ac_hours,
                                  charging_time_dc_mins: src.charging_time_dc_mins,
                                  max_dc_charging_rate_kw: src.max_dc_charging_rate_kw,
                                  has_baas: src.has_baas,
                                  baas_model_name: src.baas_model_name,
                                  baas_price_per_km: src.baas_price_per_km,
                                  baas_upfront_price: src.baas_upfront_price,
                                  extra_charging: (src as any).extra_charging || [],
                                })));
                              }
                            }}
                          />
                          Same for all
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <MiniInput label="Battery Capacity" value={v.battery_capacity_kwh ?? ""} onChange={(val) => updateVariantField(i, { battery_capacity_kwh: val })} />
                      <MiniInput label="AC Charge (hrs)" value={v.charging_time_ac_hours ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charging_time_ac_hours: val }; setVariants(arr); }} />
                      <MiniInput label="DC Charge (min)" value={v.charging_time_dc_mins ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charging_time_dc_mins: val }; setVariants(arr); }} />
                      <MiniInput label="Max DC Rate" value={v.max_dc_charging_rate_kw ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], max_dc_charging_rate_kw: val }; setVariants(arr); }} />
                      <MiniInput label="Battery Type" value={v.battery_type ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], battery_type: val }; setVariants(arr); }} />
                      <MiniInput label="Battery Portability" value={v.battery_portability ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], battery_portability: val }; setVariants(arr); }} />
                      <MiniInput label="Charger Type" value={v.charger_type ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charger_type: val }; setVariants(arr); }} />
                      <MiniInput label="Charger Output" value={v.charger_output ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charger_output: val }; setVariants(arr); }} />
                      <MiniInput label="Charger Cost Included" value={v.charger_cost_included ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charger_cost_included: val }; setVariants(arr); }} />
                    </div>
                    {((v as any).extra_charging || []).map((ef: any, ei: number) => (
                      <div key={ei} className="flex items-center gap-2 mt-1.5">
                        <input value={ef.label} onChange={(e) => {
                          const next = [...((v as any).extra_charging || [])];
                          next[ei] = { ...next[ei], label: e.target.value };
                          updateVariantChargingExtra(i, next);
                        }} placeholder="Label" className="flex-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs outline-none" />
                        <input value={ef.value} onChange={(e) => {
                          const next = [...((v as any).extra_charging || [])];
                          next[ei] = { ...next[ei], value: e.target.value };
                          updateVariantChargingExtra(i, next);
                        }} placeholder="Value" className="flex-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs outline-none" />
                        <button onClick={() => {
                          const next = [...((v as any).extra_charging || [])];
                          next.splice(ei, 1);
                          updateVariantChargingExtra(i, next);
                        }} className="text-rose-400 text-xs">×</button>
                      </div>
                    ))}
                  </div>

                  </>
                  )}

                  {resolvedSpec === "dimensions" && (
                  <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Capacity & Dimensions</p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setDimensionsClipboard({ length_mm: (v as any).length_mm, width_mm: (v as any).width_mm, height_mm: (v as any).height_mm, wheelbase_mm: (v as any).wheelbase_mm, ground_clearance_mm: (v as any).ground_clearance_mm, boot_space_litres: (v as any).boot_space_litres, turning_radius_m: (v as any).turning_radius_m, extra_dimensions: (v as any).extra_dimensions || [] })} className="text-[10px] font-bold text-slate-600 hover:text-slate-700">📋 Copy</button>
                        {dimensionsClipboard && (
                          <button type="button" onClick={() => {
                            setVariants(prev => prev.map((vr, vi) => {
                              if (vi === i || sameForAllDimensions) {
                                return {
                                  ...vr,
                                  length_mm: dimensionsClipboard.length_mm,
                                  width_mm: dimensionsClipboard.width_mm,
                                  height_mm: dimensionsClipboard.height_mm,
                                  wheelbase_mm: dimensionsClipboard.wheelbase_mm,
                                  ground_clearance_mm: dimensionsClipboard.ground_clearance_mm,
                                  boot_space_litres: dimensionsClipboard.boot_space_litres,
                                  turning_radius_m: dimensionsClipboard.turning_radius_m,
                                  extra_dimensions: dimensionsClipboard.extra_dimensions,
                                };
                              }
                              return vr;
                            }));
                          }} className="text-[10px] font-bold text-slate-600 hover:text-slate-700">📋 Paste</button>
                        )}
                        <label className="flex items-center gap-1 text-[10px] font-bold text-violet-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sameForAllDimensions}
                            onChange={(e) => {
                              setSameForAllDimensions(e.target.checked);
                              if (e.target.checked) {
                                const src = variants[i];
                                setVariants(variants.map((vr) => ({
                                  ...vr,
                                  length_mm: (src as any).length_mm,
                                  width_mm: (src as any).width_mm,
                                  height_mm: (src as any).height_mm,
                                  wheelbase_mm: (src as any).wheelbase_mm,
                                  ground_clearance_mm: (src as any).ground_clearance_mm,
                                  boot_space_litres: (src as any).boot_space_litres,
                                  turning_radius_m: (src as any).turning_radius_m,
                                  extra_dimensions: (src as any).extra_dimensions || [],
                                })));
                              }
                            }}
                          />
                          Same for all
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <MiniInput label="Length (mm)" value={v.length_mm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], length_mm: val }; setVariants(arr); }} />
                      <MiniInput label="Width (mm)" value={v.width_mm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], width_mm: val }; setVariants(arr); }} />
                      <MiniInput label="Height (mm)" value={v.height_mm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], height_mm: val }; setVariants(arr); }} />
                      <MiniInput label="Ground Clearance (mm)" value={v.ground_clearance_mm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], ground_clearance_mm: val }; setVariants(arr); }} />
                      <MiniInput label="Wheelbase (mm)" value={v.wheelbase_mm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], wheelbase_mm: val }; setVariants(arr); }} />
                      <MiniInput label="Min Turning Radius" value={v.turning_radius_m ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], turning_radius_m: val }; setVariants(arr); }} />
                      <MiniInput label="Kerb Weight (kg)" value={v.kerb_weight_kg ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], kerb_weight_kg: val }; setVariants(arr); }} />
                      <MiniInput label="Seat Length (mm)" value={v.seat_length_mm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], seat_length_mm: val }; setVariants(arr); }} />
                      <MiniInput label="Seat Height (mm)" value={v.seat_height_mm ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], seat_height_mm: val }; setVariants(arr); }} />
                    </div>
                    <VariantExtrasEditor
                      extras={normalizeExtras((v as any).extra_dimensions)}
                      inputBorder="border-slate-300"
                      onChange={(next) => updateVariantDimensionsExtra(i, next)}
                    />
                  </div>
                  )}

                  {customIndex >= 0 && customSections[customIndex] && (
                  <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-100 p-4">
                    {(() => {
                    const si = customIndex;
                    const sec = customSections[si];
                    return (
                    <>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <input
                        value={sec.title}
                        onChange={(e) => {
                          const arr = [...variants];
                          const secs = [...((arr[i] as any).extra_sections || [])];
                          secs[si] = { ...secs[si], title: e.target.value };
                          (arr[i] as any).extra_sections = secs;
                          setVariants(arr);
                        }}
                        placeholder="Section name (e.g. Warranty)"
                        className="flex-1 rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs font-bold text-amber-800 outline-none"
                      />
                      <div className="flex gap-2 shrink-0">
                        {variants.length > 1 && i === 0 && (
                          <button
                            onClick={() => {
                              const src = (variants[0] as any).extra_sections || [];
                              setVariants(variants.map((vr, vi) => vi === 0 ? vr : { ...vr, extra_sections: JSON.parse(JSON.stringify(src)) } as any));
                            }}
                            className="text-[8px] font-bold text-violet-600 hover:text-violet-700"
                          >
                            📋 Copy to all
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const arr = [...variants];
                            const secs = [...((arr[i] as any).extra_sections || [])];
                            secs.splice(si, 1);
                            (arr[i] as any).extra_sections = secs;
                            setVariants(arr);
                            if (resolvedSpec === `custom-${si}`) {
                              setActiveSpec(secs.length ? `custom-${Math.min(si, secs.length - 1)}` : "motor");
                            }
                          }}
                          className="text-[9px] font-bold text-rose-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <VariantExtrasEditor
                      extras={normalizeExtras(sec.fields)}
                      inputBorder="border-amber-200"
                      onChange={(next) => {
                        const arr = [...variants];
                        const secs = [...((arr[i] as any).extra_sections || [])];
                        secs[si] = { ...secs[si], fields: next };
                        (arr[i] as any).extra_sections = secs;
                        setVariants(arr);
                      }}
                    />
                    </>
                    );
                    })()}
                  </div>
                  )}

                  {resolvedSpec === "extra_specs" && (
                  <div className="mt-4 rounded-xl border-2 border-violet-300 bg-violet-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-2">Extra Specs</p>
                    <VariantExtrasEditor
                      extras={normalizeExtras((v as any).custom_fields)}
                      inputBorder="border-violet-200"
                      onChange={(next) => {
                        const arr = [...variants];
                        (arr[i] as any).custom_fields = next;
                        setVariants(arr);
                        if (!next.length && resolvedSpec === "extra_specs") setActiveSpec("motor");
                      }}
                    />
                  </div>
                  )}

                  {resolvedSpec === "brakes_wheels" && (
                    <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <MiniInput label="Braking System" value={v.braking_system ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], braking_system: val }; setVariants(arr); }} />
                        <MiniInput label="Wheel Type" value={v.wheel_type ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], wheel_type: val }; setVariants(arr); }} />
                        <label className="block"><span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">Front Brakes</span><select value={v.features?.front_brakes || "Disc"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, front_brakes: e.target.value } }; setVariants(arr); }} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2.5 text-sm font-semibold text-slate-900 outline-none"><option value="Disc">Disc</option><option value="Ventilated Disc">Ventilated Disc</option><option value="Drum">Drum</option></select></label>
                        <label className="block"><span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">Rear Brakes</span><select value={v.features?.rear_brakes || "Disc"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, rear_brakes: e.target.value } }; setVariants(arr); }} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2.5 text-sm font-semibold text-slate-900 outline-none"><option value="Disc">Disc</option><option value="Solid Disc">Solid Disc</option><option value="Drum">Drum</option></select></label>
                        <MiniInput label="Front Wheel Size" value={v.front_wheel_size ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], front_wheel_size: val }; setVariants(arr); }} />
                        <MiniInput label="Rear Wheel Size" value={v.rear_wheel_size ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], rear_wheel_size: val }; setVariants(arr); }} />
                      </div>
                      <VariantExtrasEditor extras={normalizeExtras((v as any).extra_brakes)} inputBorder="border-slate-300" onChange={(next) => { const arr = [...variants]; (arr[i] as any).extra_brakes = next; setVariants(arr); }} />
                    </div>
                  )}

                  {resolvedSpec === "suspension" && (
                    <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <MiniInput label="Front Suspension" value={v.front_suspension ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], front_suspension: val }; setVariants(arr); }} />
                        <MiniInput label="Rear Suspension" value={v.rear_suspension ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], rear_suspension: val }; setVariants(arr); }} />
                        <MiniInput label="Chassis Type" value={v.chassis_type ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], chassis_type: val }; setVariants(arr); }} />
                      </div>
                      <VariantExtrasEditor extras={normalizeExtras((v as any).extra_suspension)} inputBorder="border-slate-300" onChange={(next) => { const arr = [...variants]; (arr[i] as any).extra_suspension = next; setVariants(arr); }} />
                    </div>
                  )}

                  {resolvedSpec === "warranty" && (
                    <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <MiniInput label="Battery Warranty" value={v.battery_warranty ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], battery_warranty: val }; setVariants(arr); }} />
                        <MiniInput label="Motor Warranty" value={v.motor_warranty ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], motor_warranty: val }; setVariants(arr); }} />
                      </div>
                      <VariantExtrasEditor extras={normalizeExtras((v as any).extra_warranty)} inputBorder="border-slate-300" onChange={(next) => { const arr = [...variants]; (arr[i] as any).extra_warranty = next; setVariants(arr); }} />
                    </div>
                  )}

                  {resolvedSpec === "features_safety" && (
                    <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <MiniInput label="Screen Size (inches)" value={v.features?.screen_size_inches ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, screen_size_inches: val } }; setVariants(arr); }} />
                        <MiniInput label="Boot Storage (L)" value={(v.features as any)?.boot_storage_litres ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, boot_storage_litres: val } }; setVariants(arr); }} />
                        <MiniInput label="Front Speakers" value={(v.features as any)?.front_speakers ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, front_speakers: val } }; setVariants(arr); }} />
                        <MiniInput label="Rear Speakers" value={(v.features as any)?.rear_speakers ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, rear_speakers: val } }; setVariants(arr); }} />
                        <MiniInput label="Airbags Count" value={(v.features as any)?.airbag_count ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, airbag_count: val } }; setVariants(arr); }} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                        {([
                          ["has_speedometer_digital", "Speedometer"],
                          ["has_odometer_digital", "Odometer"],
                          ["has_voice_assist", "Voice assist"],
                          ["has_stand_alarm", "Stand alarm"],
                          ["has_low_battery_indicator", "Low battery indicator"],
                          ["has_clock", "Clock"],
                          ["has_call_sms_alert", "Call/Sms Alert"],
                          ["has_tripmeter", "Tripmeter"],
                          ["has_usb_charging_port", "USB charging"],
                          ["has_keyless_lock_unlock", "Keyless"],
                          ["has_cruise_control", "Cruise control"],
                          ["has_start_type_self", "Start type Self"],
                          ["has_abs", "ABS"],
                          ["has_ebd", "EBD"],
                          ["has_esp", "ESP"],
                          ["has_tpms", "TPMS"],
                          ["has_360_camera", "360° Camera"],
                          ["has_gps", "GPS Connectivity"],
                          ["has_navigation", "Navigation"],
                        ] as [string,string][]).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-1.5 text-sm text-slate-700 w-full sm:w-[48%] lg:w-[31%]">
                            <input type="checkbox" checked={!!(v.features as any)?.[key]} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, [key]: e.target.checked } }; setVariants(arr); }} />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Extra Features</p>
                        <VariantExtrasEditor extras={normalizeExtras((v.features as any)?.extra_features)} inputBorder="border-slate-300" onChange={(next) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, extra_features: next } }; setVariants(arr); }} />
                      </div>
                    </div>
                  )}

                  {resolvedSpec === "lights" && (
                    <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <label className="block"><span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">Headlights</span><select value={v.features?.headlight_type || "LED"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, headlight_type: e.target.value } }; setVariants(arr); }} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2.5 text-sm font-semibold text-slate-900 outline-none"><option value="Halogen">Halogen</option><option value="LED">LED</option><option value="Projector LED">Projector LED</option></select></label>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                        {([
                          ["has_boot_light", "Boot light"],
                          ["has_tail_light", "Tail Light"],
                          ["has_break_light", "Break Light"],
                          ["has_turn_signal", "Turn signal"],
                          ["has_drls", "DRLs(Daytime Running Lights)"],
                        ] as [string,string][]).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-1.5 text-sm text-slate-700 w-full sm:w-[48%] lg:w-[31%]">
                            <input type="checkbox" checked={!!(v.features as any)?.[key]} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, [key]: e.target.checked } }; setVariants(arr); }} />
                            {label}
                          </label>
                        ))}
                      </div>
                      <VariantExtrasEditor extras={normalizeExtras((v as any).extra_lights)} inputBorder="border-slate-300" onChange={(next) => { const arr = [...variants]; (arr[i] as any).extra_lights = next; setVariants(arr); }} />
                    </div>
                  )}

                  {resolvedSpec === "modes" && (
                    <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Driving Modes</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {([
                          ["has_mode_eco", "Eco"],
                          ["has_mode_normal", "Normal"],
                          ["has_mode_sports", "Sports"],
                          ["has_mode_hyper", "Hyper"],
                          ["has_mode_cruise", "Cruise"],
                          ["has_mode_reverse", "Reverse"],
                        ] as [string,string][]).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-1.5 text-sm text-slate-600">
                            <input type="checkbox" checked={!!(v.features as any)?.[key]} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, [key]: e.target.checked } }; setVariants(arr); }} />
                            {label}
                          </label>
                        ))}
                      </div>
                      <VariantExtrasEditor extras={normalizeExtras((v as any).extra_modes)} inputBorder="border-slate-300" onChange={(next) => { const arr = [...variants]; (arr[i] as any).extra_modes = next; setVariants(arr); }} />
                    </div>
                  )}
                  </>
                  );
                  })()}
                  </div>
                </div>
              )
              ))}
            </div>
            )}

            {listingFormTab === "energy" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              {form.price_bracket && (() => {
                const isBracketMatch = (presetB: string, formB: string) => {
                  if (presetB === formB) return true;
                  const pb = presetB.toLowerCase().replace(/\s+/g, "");
                  const fb = formB.toLowerCase().replace(/\s+/g, "");
                  if (pb === fb) return true;

                  if (fb === "under-5l" || fb === "0-5" || fb === "under-5lakh" || fb === "under5l") {
                    return ["under-1l", "1-1.5", "1.5-2", "1-2", "under-2l", "2-3", "under-3l", "3-5", "3l+", "under-5l"].includes(pb);
                  }
                  if (fb === "under-2l" || fb === "under-2lakh" || fb === "under2l" || fb === "0-2") {
                    return ["under-1l", "1-1.5", "1.5-2", "1-2", "under-2l"].includes(pb);
                  }
                  if (fb === "under-3l" || fb === "under-3lakh" || fb === "under3l" || fb === "0-3") {
                    return ["under-1l", "1-1.5", "1.5-2", "1-2", "under-2l", "2-3", "under-3l"].includes(pb);
                  }
                  if (fb === "under-1l" || fb === "under-1lakh" || fb === "under1l" || fb === "under-1L") {
                    return ["under-1l"].includes(pb);
                  }
                  if (fb === "5-10" || fb === "5l-10l" || fb === "5-10l") {
                    return ["5-7", "7-10", "5-10"].includes(pb);
                  }
                  if (fb === "5-15" || fb === "5l-15l" || fb === "5-15l") {
                    return ["5-7", "7-10", "5-10", "5-15"].includes(pb);
                  }
                  if (fb === "10-25" || fb === "10l-25l" || fb === "10-25l") {
                    return ["10-25", "15-30"].includes(pb);
                  }
                  if (fb === "15-30" || fb === "15l-30l" || fb === "15-30l") {
                    return ["15-30", "10-25"].includes(pb);
                  }
                  if (fb === "30+" || fb === "30l+") {
                    return ["30+", "50+"].includes(pb);
                  }
                  if (fb === "50+" || fb === "50l+") {
                    return ["50+", "30+"].includes(pb);
                  }
                  return false;
                };

                const currentType = Array.isArray(form.types) ? form.types[0] : (typeof form.types === "string" ? form.types : "");
                const matchedPresets = PRESET_COMPETITORS.filter(
                  pc => isBracketMatch(pc.priceBracket, form.price_bracket) && 
                        (!currentType || pc.type === currentType)
                );
                if (matchedPresets.length === 0) return null;
                const getBracketLabel = (b: string) => {
                  switch(b) {
                    case "under-1L": return "Under ₹1 Lakh";
                    case "1-1.5": return "₹1L – ₹1.5L";
                    case "1.5-2": return "₹1.5L – ₹2L";
                    case "1-2": return "₹1L – ₹2L";
                    case "under-2L": return "Under ₹2 Lakh";
                    case "2-3": return "₹2L – ₹3L";
                    case "under-3L": return "Under ₹3 Lakh";
                    case "3-5": return "₹3L – ₹5L";
                    case "3L+": return "₹3L+";
                    case "under-5L": return "Under ₹5 Lakh";
                    case "5-7": return "₹5L – ₹7L";
                    case "7-10": return "₹7L – ₹10L";
                    case "5-10": return "₹5L – ₹10L";
                    case "5-15": return "₹5L – ₹15L";
                    case "10-25": return "₹10L – ₹25L";
                    case "15-30": return "₹15L – ₹30L";
                    case "30+": return "₹30L+";
                    case "50+": return "₹50L+";
                    default: return b;
                  }
                };
                return (
                  <div className="mb-4 p-4 bg-sky-50 rounded-xl border border-sky-200">
                    <p className="text-xs font-extrabold text-sky-800 uppercase tracking-wider mb-3">Quick Add Recommended Presets ({getBracketLabel(form.price_bracket)}):</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {matchedPresets.map((pc) => {
                        const brandParts = pc.model.split(" ");
                        const brand = brandParts[0] || "";
                        return (
                          <div key={pc.model} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-lg border border-sky-100 shadow-xs">
                            <span className="text-xs font-bold text-slate-800">{pc.model}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {pc.variants.petrol && (
                                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                                  <span>Petrol ({pc.variants.petrol})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEnergyComps([
                                        ...energyComps,
                                        {
                                          category: "fuel",
                                          name: `${pc.model} Petrol`,
                                          fuel_type: "Petrol",
                                          mileage: pc.variants.petrol || "",
                                          fuel_price: "100",
                                          model_used: pc.model,
                                          brand: brand
                                        }
                                      ]);
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-md px-1.5 py-0.5 transition-colors cursor-pointer"
                                  >
                                    + Add
                                  </button>
                                </div>
                              )}
                              {pc.variants.cng && (
                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                                  <span>CNG ({pc.variants.cng})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEnergyComps([
                                        ...energyComps,
                                        {
                                          category: "fuel",
                                          name: `${pc.model} CNG`,
                                          fuel_type: "CNG",
                                          mileage: pc.variants.cng || "",
                                          fuel_price: "85",
                                          model_used: pc.model,
                                          brand: brand
                                        }
                                      ]);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-md px-1.5 py-0.5 transition-colors cursor-pointer"
                                  >
                                    + Add
                                  </button>
                                </div>
                              )}
                              {pc.variants.ev && (
                                <div className="flex items-center gap-1 bg-sky-50 text-sky-900 border border-sky-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                                  <span>EV ({pc.variants.ev})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEnergyComps([
                                        ...energyComps,
                                        {
                                          category: "fuel",
                                          name: `${pc.model} EV`,
                                          fuel_type: "EV",
                                          mileage: pc.variants.ev || "",
                                          fuel_price: "8",
                                          model_used: pc.model,
                                          brand: brand
                                        }
                                      ]);
                                    }}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-md px-1.5 py-0.5 transition-colors cursor-pointer"
                                  >
                                    + Add
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between mb-4 mt-6">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedPresetType}
                    onChange={(e) => {
                      setSelectedPresetType(e.target.value as any);
                      setSelectedPresetModel("");
                    }}
                    className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 outline-none cursor-pointer focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">-- Vehicle Type --</option>
                    <option value="2 Wheeler">2 Wheeler</option>
                    <option value="3 Wheeler">3 Wheeler</option>
                    <option value="4 Wheeler">4 Wheeler</option>
                  </select>

                  <select
                    value={selectedPresetModel}
                    onChange={(e) => setSelectedPresetModel(e.target.value)}
                    disabled={!selectedPresetType}
                    className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 outline-none cursor-pointer disabled:opacity-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">-- Choose Model --</option>
                    {PRESET_COMPETITORS.filter(pc => pc.type === selectedPresetType).map((pc) => (
                      <option key={pc.model} value={pc.model}>{pc.model}</option>
                    ))}
                  </select>

                  {dbFuelPrices.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        const cityName = e.target.value;
                        if (!cityName) return;
                        const cityPrice = dbFuelPrices.find(p => p.city === cityName);
                        if (!cityPrice) return;
                        
                        const updated = energyComps.map(ec => {
                          let newPrice = ec.fuel_price;
                          if (ec.fuel_type === "Petrol") newPrice = String(cityPrice.petrol_per_litre ?? "");
                          else if (ec.fuel_type === "Diesel") newPrice = String(cityPrice.diesel_per_litre ?? "");
                          else if (ec.fuel_type === "CNG") newPrice = String(cityPrice.cng_per_kg ?? "");
                          else if (ec.fuel_type === "EV" || ec.fuel_type === "self") newPrice = String(cityPrice.electricity_per_kwh ?? "");
                          
                          return { ...ec, fuel_price: newPrice };
                        });
                        
                        setEnergyComps(updated);
                        alert(`Applied ${cityName} fuel & electricity prices to all items!`);
                      }}
                      className="text-xs px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 font-bold text-emerald-800 outline-none cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">⚡ Apply City Rates</option>
                      {dbFuelPrices.map((p) => (
                        <option key={p.id} value={p.city}>{p.city}</option>
                      ))}
                    </select>
                  )}

                  <button onClick={() => setEnergyComps([...energyComps, { category: "fuel", name: "", fuel_type: "Petrol", mileage: "", fuel_price: "", model_used: "", brand: "" }])} className="text-xs bg-slate-900 text-white font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">+ Custom Fuel Type</button>
                </div>
              </div>

              {selectedPresetModel && (() => {
                const pc = PRESET_COMPETITORS.find(p => p.model === selectedPresetModel);
                if (!pc) return null;
                const brandParts = pc.model.split(" ");
                const brand = brandParts[0] || "";
                return (
                  <div className="mb-4 p-4 bg-sky-50 rounded-xl border border-sky-200 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-sky-100 pb-2">
                      <span className="text-xs font-extrabold text-sky-900">Add Competitor Model: <span className="underline font-black">{pc.model}</span></span>
                      <button
                        type="button"
                        onClick={() => setSelectedPresetModel("")}
                        className="text-xs font-extrabold text-slate-500 hover:text-rose-500 bg-white border border-slate-200 hover:border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {pc.variants.petrol && (
                        <div className="flex items-center gap-2 bg-white text-slate-900 border border-amber-200 rounded-lg p-2 text-xs font-bold shadow-xs">
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px]">Petrol</span>
                          <span>{pc.variants.petrol} kmpl</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEnergyComps([
                                ...energyComps,
                                {
                                  category: "fuel",
                                  name: `${pc.model} Petrol`,
                                  fuel_type: "Petrol",
                                  mileage: pc.variants.petrol || "",
                                  fuel_price: "100",
                                  model_used: pc.model,
                                  brand: brand
                                }
                              ]);
                              setSelectedPresetModel("");
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-md px-2 py-1 transition-colors cursor-pointer text-[10px]"
                          >
                            Add +
                          </button>
                        </div>
                      )}
                      {pc.variants.cng && (
                        <div className="flex items-center gap-2 bg-white text-slate-900 border border-emerald-200 rounded-lg p-2 text-xs font-bold shadow-xs">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px]">CNG</span>
                          <span>{pc.variants.cng} km/kg</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEnergyComps([
                                ...energyComps,
                                {
                                  category: "fuel",
                                  name: `${pc.model} CNG`,
                                  fuel_type: "CNG",
                                  mileage: pc.variants.cng || "",
                                  fuel_price: "85",
                                  model_used: pc.model,
                                  brand: brand
                                }
                              ]);
                              setSelectedPresetModel("");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-md px-2 py-1 transition-colors cursor-pointer text-[10px]"
                          >
                            Add +
                          </button>
                        </div>
                      )}
                      {pc.variants.ev && (
                        <div className="flex items-center gap-2 bg-white text-slate-900 border border-sky-200 rounded-lg p-2 text-xs font-bold shadow-xs">
                          <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded text-[10px]">EV</span>
                          <span>{pc.variants.ev}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEnergyComps([
                                ...energyComps,
                                {
                                  category: "fuel",
                                  name: `${pc.model} EV`,
                                  fuel_type: "EV",
                                  mileage: pc.variants.ev || "",
                                  fuel_price: "8",
                                  model_used: pc.model,
                                  brand: brand
                                }
                              ]);
                              setSelectedPresetModel("");
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-md px-2 py-1 transition-colors cursor-pointer text-[10px]"
                          >
                            Add +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              {energyComps.map((ec, i) => (
                <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer" onClick={() => { const arr = [...energyComps]; (arr[i] as any).collapsed = !(arr[i] as any).collapsed; setEnergyComps(arr); }}>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      {(ec as any).collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      {ec.name || "Untitled"} <span className={`text-[9px] px-1.5 py-0.5 rounded ${ec.category === "model" ? "bg-sky-100 text-sky-600" : "bg-amber-100 text-amber-600"}`}>{ec.fuel_type}</span>
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); setEnergyComps(energyComps.filter((_, j) => j !== i)); }} className="text-[10px] text-rose-500 font-bold">Remove</button>
                  </div>
                  {!(ec as any).collapsed && (
                  <div className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <MiniInput label="Name" value={ec.name} onChange={(val) => { const arr = [...energyComps]; arr[i] = { ...arr[i], name: val }; setEnergyComps(arr); }} />
                    <label className="block"><span className="text-[10px] font-bold uppercase text-slate-400">Fuel Type</span><select value={ec.fuel_type} onChange={(e) => { const arr = [...energyComps]; arr[i] = { ...arr[i], fuel_type: e.target.value }; setEnergyComps(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none"><option value="self">Self (this EV)</option><option value="EV">EV</option><option value="Petrol">Petrol</option><option value="Diesel">Diesel</option><option value="CNG">CNG</option></select></label>
                    <MiniInput label={ec.fuel_type === "EV" || ec.fuel_type === "self" ? "Range (km) or Mileage (Rs/km)" : "Mileage (km/L)"} value={ec.mileage} onChange={(val) => { const arr = [...energyComps]; arr[i] = { ...arr[i], mileage: val }; setEnergyComps(arr); }} />
                    <MiniInput label={ec.fuel_type === "EV" || ec.fuel_type === "self" ? "₹/km (Running Cost)" : "₹/L or ₹/kg"} value={ec.fuel_price} onChange={(val) => { const arr = [...energyComps]; arr[i] = { ...arr[i], fuel_price: val }; setEnergyComps(arr); }} />
                    <MiniInput label="Model Used" value={ec.model_used} onChange={(val) => { const arr = [...energyComps]; arr[i] = { ...arr[i], model_used: val }; setEnergyComps(arr); }} />
                    {ec.category === "model" && <MiniInput label="Brand" value={ec.brand} onChange={(val) => { const arr = [...energyComps]; arr[i] = { ...arr[i], brand: val }; setEnergyComps(arr); }} />}
                  </div>
                  </div>
                  )}
                </div>
              ))}
              {energyComps.length === 0 && <p className="text-[10px] text-amber-600/60">No comparisons added. Add fuel type or model competitors.</p>}
            </div>
            )}

            {listingFormTab === "pricing" && (
            <div className="rounded-xl border-2 border-sky-300 bg-sky-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700">City & District Pricing ({form.city_pricing?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => {
                    const defaultCities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Kochi", "Jaipur", "Ahmedabad"];
                    const variantNames = variants.map(v => v.variant_name).filter(Boolean);
                    
                    // Map existing pricing to help with lookup
                    const existingMap = new Map<string, string>(); // key: "city|variantName", value: on_road_price
                    if (form.city_pricing) {
                      form.city_pricing.forEach(p => {
                        const vName = p.variant_id 
                          ? (variants.find(v => v.id === p.variant_id || v.variant_name === p.variant_id)?.variant_name || p.variant_id)
                          : "Main Model / Base";
                        const key = `${p.location_name.toLowerCase().trim()}|${vName.toLowerCase().trim()}`;
                        existingMap.set(key, p.on_road_price);
                      });
                    }

                    const pricingList: any[] = [];

                    // Populate 10 default cities
                    defaultCities.forEach(city => {
                      // 1. Base model
                      const baseKey = `${city.toLowerCase()}|main model / base`;
                      pricingList.push({
                        location_name: city,
                        location_type: "City",
                        variant_name: "Main Model / Base",
                        on_road_price: existingMap.get(baseKey) || "",
                      });

                      // 2. Variants
                      variantNames.forEach(vName => {
                        const varKey = `${city.toLowerCase()}|${vName.toLowerCase()}`;
                        pricingList.push({
                          location_name: city,
                          location_type: "City",
                          variant_name: vName,
                          on_road_price: existingMap.get(varKey) || "",
                        });
                      });
                    });

                    // Append any other cities that exist in current pricing but are not in defaultCities
                    if (form.city_pricing) {
                      form.city_pricing.forEach(p => {
                        const isDefault = defaultCities.some(dc => dc.toLowerCase() === p.location_name.toLowerCase().trim());
                        if (!isDefault) {
                          const vName = p.variant_id 
                            ? (variants.find(v => v.id === p.variant_id || v.variant_name === p.variant_id)?.variant_name || p.variant_id)
                            : "Main Model / Base";
                          pricingList.push({
                            location_name: p.location_name,
                            location_type: p.location_type,
                            variant_name: vName,
                            on_road_price: p.on_road_price,
                          });
                        }
                      });
                    }

                    const exportData = {
                      brand: form.brand || "",
                      model: form.title || "",
                      variants_available: ["Main Model / Base", ...variantNames],
                      pricing: pricingList,
                    };

                    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
                      .then(() => alert("Pricing template copied to clipboard!"))
                      .catch((err) => alert("Failed to copy pricing: " + err));
                  }} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50 cursor-pointer shadow-xs transition-colors">
                    <Copy size={12} /> Copy Pricing
                  </button>
                  <button type="button" onClick={() => {
                    const text = prompt("Paste your pricing JSON here:");
                    if (text === null) return;
                    try {
                      let cleanedText = text.trim();
                      
                      // Extract JSON block out of text containing markdown, prefaces, or notes
                      const extractJson = (str: string): string => {
                        let candidate = str.trim();
                        // Strip markdown code block wrappers if they exist
                        if (candidate.startsWith("```")) {
                          candidate = candidate.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
                        }
                        
                        try {
                          JSON.parse(candidate);
                          return candidate;
                        } catch (e) {
                          // Find first { or [ and last } or ]
                          const firstBrace = candidate.indexOf('{');
                          const firstBracket = candidate.indexOf('[');
                          let start = -1;
                          if (firstBrace !== -1 && firstBracket !== -1) {
                            start = Math.min(firstBrace, firstBracket);
                          } else if (firstBrace !== -1) {
                            start = firstBrace;
                          } else if (firstBracket !== -1) {
                            start = firstBracket;
                          }

                          const lastBrace = candidate.lastIndexOf('}');
                          const lastBracket = candidate.lastIndexOf(']');
                          let end = -1;
                          if (lastBrace !== -1 && lastBracket !== -1) {
                            end = Math.max(lastBrace, lastBracket);
                          } else if (lastBrace !== -1) {
                            end = lastBrace;
                          } else if (lastBracket !== -1) {
                            end = lastBracket;
                          }

                          if (start !== -1 && end !== -1 && end > start) {
                            const sub = candidate.substring(start, end + 1);
                            try {
                              JSON.parse(sub);
                              return sub;
                            } catch (err) {
                              return candidate;
                            }
                          }
                          return candidate;
                        }
                      };

                      cleanedText = extractJson(cleanedText);
                      const parsed = JSON.parse(cleanedText);
                      
                      // Handle both wrapped object and direct array format
                      const rawList = Array.isArray(parsed) ? parsed : (parsed.pricing || null);
                      if (!Array.isArray(rawList)) {
                        alert("Invalid format: JSON must be an array or contain a 'pricing' array.");
                        return;
                      }

                      const cleanAndConvertToLakh = (valStr: string): string => {
                        if (!valStr || valStr.trim() === "") return "";
                        // Remove currency symbols, commas, letters (like L or lakh) and spaces
                        const cleaned = valStr.replace(/[₹\s,a-zA-Z]/g, "");
                        const num = parseFloat(cleaned);
                        if (isNaN(num)) return "";
                        // If it's full rupees (e.g. > 1000), convert to lakhs
                        if (num > 1000) {
                          const numLakh = num / 100000;
                          return parseFloat(numLakh.toFixed(2)).toString();
                        }
                        return parseFloat(num.toFixed(2)).toString();
                      };

                      const validated = rawList
                        .map((item: any) => {
                          const rawLocationName = String(item.location_name || "").trim();
                          const rawOnRoadPrice = item.on_road_price !== undefined && item.on_road_price !== null ? String(item.on_road_price) : "";
                          const cleanedOnRoadPrice = cleanAndConvertToLakh(rawOnRoadPrice);

                          // Resolve variant name to ID
                          let resolvedVariantId: string | null = null;
                          const vName = item.variant_name || item.variant_id;
                          if (vName && vName !== "Main Model / Base") {
                            const matched = variants.find(v => 
                              v.variant_name?.toLowerCase().trim() === String(vName).toLowerCase().trim() ||
                              v.id === vName
                            );
                            resolvedVariantId = matched ? (matched.id || matched.variant_name) : String(vName);
                          }

                          return {
                            id: item.id || Math.random().toString(36).substring(2, 9),
                            location_name: rawLocationName,
                            location_type: (item.location_type === "District" ? "District" : "City") as "City" | "District",
                            showroom_price: String(item.showroom_price || ""),
                            on_road_price: cleanedOnRoadPrice,
                            variant_id: resolvedVariantId,
                          };
                        })
                        .filter((entry: any) => entry.location_name !== "" && entry.on_road_price !== "");

                      setForm({ ...form, city_pricing: validated });
                      alert(`Successfully applied ${validated.length} pricing entries!`);
                    } catch (e: any) {
                      alert("Invalid JSON format: " + e.message);
                    }
                  }} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50 cursor-pointer shadow-xs transition-colors">
                    <Clipboard size={12} className="opacity-75" /> Paste Pricing
                  </button>
                  <button type="button" onClick={() => {
                    const newEntry = {
                      id: Math.random().toString(36).substring(2, 9),
                      location_name: "",
                      location_type: "City" as const,
                      showroom_price: "",
                      on_road_price: "",
                      variant_id: null,
                    };
                    setForm({ ...form, city_pricing: [...(form.city_pricing || []), newEntry] });
                  }} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer shadow-xs transition-colors">
                    <Plus size={12} /> Add Pricing Entry
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {form.city_pricing && form.city_pricing.map((p, index) => (
                  <div key={p.id || index} className="rounded-xl border border-sky-200 bg-white p-3 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                      <MiniInput 
                        label="Location Name" 
                        value={p.location_name} 
                        onChange={(val) => {
                          const arr = [...form.city_pricing];
                          arr[index] = { ...arr[index], location_name: val };
                          setForm({ ...form, city_pricing: arr });
                        }} 
                        placeholder="e.g. Bangalore, Kochi" 
                      />

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location Type</span>
                        <select 
                          value={p.location_type} 
                          onChange={(e) => {
                            const arr = [...form.city_pricing];
                            arr[index] = { ...arr[index], location_type: e.target.value as "City" | "District" };
                            setForm({ ...form, city_pricing: arr });
                          }} 
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none bg-slate-50 cursor-pointer h-9 mt-0.5"
                        >
                          <option value="City">City</option>
                          <option value="District">District</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apply To (Variant)</span>
                        <select 
                          value={p.variant_id || ""} 
                          onChange={(e) => {
                            const arr = [...form.city_pricing];
                            arr[index] = { ...arr[index], variant_id: e.target.value || null };
                            setForm({ ...form, city_pricing: arr });
                          }} 
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none bg-slate-50 cursor-pointer h-9 mt-0.5"
                        >
                          <option value="">Main Model / Base</option>
                          {variants.map((v, vidx) => (
                            <option key={v.id || vidx} value={v.id || v.variant_name}>
                              {v.variant_name} ({v.model_year})
                            </option>
                          ))}
                        </select>
                      </div>

                      <MiniInput 
                        label="On-Road Price (Lakh)" 
                        value={p.on_road_price} 
                        onChange={(val) => {
                          const arr = [...form.city_pricing];
                          arr[index] = { ...arr[index], on_road_price: val };
                          setForm({ ...form, city_pricing: arr });
                        }} 
                        placeholder="e.g. 13.20" 
                      />
                    </div>

                    <div className="mt-2.5 flex justify-start">
                      <button 
                        type="button" 
                        onClick={() => {
                          const arr = form.city_pricing.filter((_, idx) => idx !== index);
                          setForm({ ...form, city_pricing: arr });
                        }} 
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
                      >
                        ✕ Remove Entry
                      </button>
                    </div>
                  </div>
                ))}
                {(!form.city_pricing || form.city_pricing.length === 0) && (
                  <div className="text-center py-6 bg-white/50 rounded-xl border border-dashed border-sky-300 text-sky-600/70 text-xs font-semibold">
                    No city or district-wise pricing added yet. Click "+ Add Pricing Entry" to begin.
                  </div>
                )}
              </div>
            </div>
            )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-slate-300 pt-4">
              <p className="text-[10px] text-slate-500">Changes apply to all tabs when you save.</p>
              <div className="flex items-center gap-3">
                {initialSnapshot && (
                  <button type="button" onClick={() => {
                    if (confirm("Are you sure you want to undo all unsaved changes?")) {
                      setForm(JSON.parse(JSON.stringify(initialSnapshot.form)));
                      setVariants(JSON.parse(JSON.stringify(initialSnapshot.variants)));
                      setEnergyComps(JSON.parse(JSON.stringify(initialSnapshot.energyComps)));
                      setActiveVariantIndex(0);
                    }
                  }} className="inline-flex items-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-colors">
                    Undo Changes
                  </button>
                )}
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editing === "new" ? "Create Listing" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Old listings table — hidden, using "Manage Variants" dropdown above */}
        {loading && <div className="text-center py-12 text-slate-400">Loading...</div>}
        {!loading && listings.length === 0 && !editing && <div className="text-center py-12 text-slate-400">No listings yet. Add your first one!</div>}
        </>)}
      </div>

      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-950">Paste EV Listing JSON</h3>
              <button
                type="button"
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPastedJson("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1.5">PASTE JSON DATA</p>
                <textarea
                  rows={8}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='Paste listing JSON here (e.g. {"form": {...}, "variants": [...]})'
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition-colors resize-y"
                />
              </div>

              {(() => {
                if (!pastedJson.trim()) {
                  return (
                    <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4 text-center">
                      <p className="text-xs text-slate-500">Paste valid listing JSON to see a preview of the contents.</p>
                    </div>
                  );
                }

                try {
                  const parsed = JSON.parse(pastedJson);
                  const formTitle = parsed.form?.title || "(Untitled Model)";
                  const formBrand = parsed.form?.brand || "(Unknown Brand)";
                  const formType = parsed.form?.types?.[0] || "(No Type)";
                  const numVariants = Array.isArray(parsed.variants) ? parsed.variants.length : 0;
                  const numEnergy = Array.isArray(parsed.energyComps) ? parsed.energyComps.length : 0;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 w-fit">
                        <span>✓ Valid JSON Format</span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                        <p className="font-bold text-slate-800 border-b border-slate-200 pb-2">Parsed Content Summary</p>
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-400">Model:</span> {formBrand} {formTitle}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Vehicle Type:</span> {formType}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Price Bracket:</span> {parsed.form?.price_bracket || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Body Type:</span> {parsed.form?.body_type || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Variants:</span> {numVariants} variant(s)
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Competitors:</span> {numEnergy} item(s)
                          </div>
                        </div>

                        {numVariants > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="font-semibold text-slate-500 mb-1">Variants detected:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {parsed.variants.map((v: any, idx: number) => (
                                <span key={idx} className="bg-sky-50 border border-sky-100 text-sky-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                  {v.variant_name || `Variant ${idx + 1}`}{v.version_name ? ` (${v.version_name})` : ""}{v.model_year ? ` '${String(v.model_year).slice(-2)}` : ""} {v.price ? `· ₹${v.price}L` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleApplyPaste(parsed)}
                          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-700 transition-colors shadow-sm cursor-pointer"
                        >
                          Apply to Form
                        </button>
                      </div>
                    </div>
                  );
                } catch (err: any) {
                  return (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-rose-700 text-xs space-y-1">
                      <p className="font-bold">✗ Invalid JSON Structure</p>
                      <p className="font-mono text-[10px] break-all">{err.message}</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {isPasteVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-950">Paste EV Variant JSON</h3>
              <button
                type="button"
                onClick={() => {
                  setIsPasteVariantModalOpen(false);
                  setPastedVariantJson("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1.5">PASTE VARIANT JSON DATA</p>
                <textarea
                  rows={8}
                  value={pastedVariantJson}
                  onChange={(e) => setPastedVariantJson(e.target.value)}
                  placeholder='Paste variant JSON here (e.g. {"variant_name": "Pro", "price": 15, "driving_range_km": "400", "features": {...}})'
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition-colors resize-y"
                />
              </div>

              {(() => {
                if (!pastedVariantJson.trim()) {
                  return (
                    <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4 text-center">
                      <p className="text-xs text-slate-500">Paste valid variant JSON to see a preview of the contents.</p>
                    </div>
                  );
                }

                try {
                  const parsed = JSON.parse(pastedVariantJson);
                  const varName = parsed.variant_name || "(Untitled Variant)";
                  const price = parsed.price ? `₹${parsed.price}L` : "N/A";
                  const modelYear = parsed.model_year || "N/A";
                  const drivingRange = parsed.driving_range_km ? `${parsed.driving_range_km} km` : "N/A";
                  const batteryCapacity = parsed.battery_capacity_kwh ? `${parsed.battery_capacity_kwh} kWh` : "N/A";
                  const hasBaas = parsed.has_baas ? "Yes" : "No";

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 w-fit">
                        <span>✓ Valid Variant JSON Format</span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                        <p className="font-bold text-slate-800 border-b border-slate-200 pb-2">Parsed Variant Summary</p>
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-400">Variant Name:</span> {varName}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Version:</span> {parsed.version_name || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Price:</span> {price}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Model Year:</span> {modelYear}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Driving Range:</span> {drivingRange}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Battery Capacity:</span> {batteryCapacity}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Has BAAS:</span> {hasBaas}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Top Speed:</span> {parsed.top_speed || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">Drivetrain:</span> {parsed.features?.drivetrain || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleApplyPasteVariant(parsed)}
                          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-700 transition-colors shadow-sm cursor-pointer"
                        >
                          Apply to Active Variant
                        </button>
                      </div>
                    </div>
                  );
                } catch (err: any) {
                  return (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-rose-700 text-xs space-y-1">
                      <p className="font-bold">✗ Invalid JSON Structure</p>
                      <p className="font-mono text-[10px] break-all">{err.message}</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal for Image Toolkit */}
      {cropImageInfo && (
        <CropModal
          image={{
            id: `crop-${cropImageInfo.type}-${cropImageInfo.index}`,
            listingId: "temp",
            listingTitle: cropImageInfo.listingTitle || "Draft Listing",
            listingBrand: cropImageInfo.listingBrand || "Draft",
            url: cropImageInfo.url,
            type: cropImageInfo.type,
            index: cropImageInfo.index,
          }}
          supabase={supabase}
          listings={[]} 
          fetchListings={async () => {}} 
          onClose={() => setCropImageInfo(null)}
          onSaveCallback={(newUrl) => {
            updateFormImageUrl(cropImageInfo.type, cropImageInfo.index, newUrl);
            setCropImageInfo(null);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [micActive, setMicActive] = useState(false);
  const startMic = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (micActive) return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-IN";
    r.onresult = (e: any) => { onChange(e.results[0][0].transcript.trim()); };
    r.onend = () => setMicActive(false); r.onerror = () => setMicActive(false);
    r.start(); setMicActive(true);
  };
  return (<label className="block"><span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">{label}</span><div className="mt-1 flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5"><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 text-sm sm:text-base font-semibold text-slate-900 outline-none bg-transparent" /><button type="button" onClick={startMic} className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-all ${micActive ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-400 hover:bg-sky-100 hover:text-sky-600"}`}>{micActive ? <MicOff size={10} /> : <Mic size={10} />}</button></div></label>);
}

function MiniInput({ label, value, onChange, placeholder, onBlur }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; onBlur?: () => void }) {
  const [micActive, setMicActive] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (value !== localValue) {
      const parentNum = parseFloat(value);
      const localNum = parseFloat(localValue);
      const bothValid = !isNaN(parentNum) && !isNaN(localNum);
      if (bothValid) {
        if (parentNum !== localNum) {
          setLocalValue(value);
        }
      } else {
        if (value === "" || isNaN(parentNum)) {
          setLocalValue(value);
        }
      }
    }
  }, [value, localValue]);

  const startMic = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (micActive) return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-IN";
    r.onresult = (e: any) => {
      const txt = e.results[0][0].transcript.trim();
      setLocalValue(txt);
      onChange(txt);
    };
    r.onend = () => setMicActive(false); r.onerror = () => setMicActive(false);
    r.start(); setMicActive(true);
  };
  return (<label className="block"><span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">{label}</span><div className="mt-1 flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-2"><input value={localValue} onChange={(e) => { setLocalValue(e.target.value); onChange(e.target.value); }} onBlur={() => { if (onBlur) onBlur(); }} placeholder={placeholder} className="flex-1 text-sm sm:text-base font-semibold text-slate-900 outline-none bg-transparent min-w-0" /><button type="button" onClick={startMic} className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all ${micActive ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-400 hover:bg-sky-100 hover:text-sky-600"}`}>{micActive ? <MicOff size={9} /> : <Mic size={9} />}</button></div></label>);
}

function VariantExtrasEditor({
  extras,
  onChange,
  inputBorder = "border-slate-300",
}: {
  extras: SpecExtraItem[];
  onChange: (next: SpecExtraItem[]) => void;
  inputBorder?: string;
}) {
  if (!extras.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {extras.map((ef, ei) => (
        isCheckboxExtra(ef) ? (
          <div key={ei} className="flex items-center gap-2">
            <input
              value={ef.label}
              onChange={(e) => {
                const next = [...extras];
                next[ei] = { ...ef, label: e.target.value };
                onChange(next);
              }}
              placeholder="Checkbox label"
              className={`flex-1 rounded-md border ${inputBorder} bg-white px-3 py-2 text-xs outline-none`}
            />
            <label className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isExtraChecked(ef.value)}
                onChange={(e) => {
                  const next = [...extras];
                  next[ei] = { ...ef, value: e.target.checked ? "1" : "0" };
                  onChange(next);
                }}
              />
              Tick
            </label>
            <button type="button" onClick={() => onChange(extras.filter((_, j) => j !== ei))} className="text-rose-400 text-xs">×</button>
          </div>
        ) : (
          <div key={ei} className="flex items-center gap-2">
            <input
              value={ef.label}
              onChange={(e) => {
                const next = [...extras];
                next[ei] = { ...ef, label: e.target.value };
                onChange(next);
              }}
              placeholder="Label"
              className={`flex-1 rounded-md border ${inputBorder} bg-white px-3 py-2 text-xs outline-none`}
            />
            <input
              value={ef.value}
              onChange={(e) => {
                const next = [...extras];
                next[ei] = { ...ef, value: e.target.value };
                onChange(next);
              }}
              placeholder="Value"
              className={`flex-1 rounded-md border ${inputBorder} bg-white px-3 py-2 text-xs outline-none`}
            />
            <button type="button" onClick={() => onChange(extras.filter((_, j) => j !== ei))} className="text-rose-400 text-xs">×</button>
          </div>
        )
      ))}
    </div>
  );
}

function ExtraFieldRow({ label, value, onLabelChange, onValueChange, onRemove }: { label: string; value: string; onLabelChange: (v: string) => void; onValueChange: (v: string) => void; onRemove: () => void }) {
  const [micField, setMicField] = useState<"label" | "value" | null>(null);
  const startMic = (field: "label" | "value") => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-IN";
    r.onresult = (e: any) => { const text = e.results[0][0].transcript.trim(); field === "label" ? onLabelChange(text) : onValueChange(text); };
    r.onend = () => setMicField(null); r.onerror = () => setMicField(null);
    r.start(); setMicField(field);
  };
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <div className="flex-1 flex items-center gap-1 rounded-md border border-violet-200 bg-white px-2 py-1.5">
        <input value={label} onChange={(e) => onLabelChange(e.target.value)} placeholder="Label" className="flex-1 text-sm outline-none min-w-0" />
        <button type="button" onClick={() => startMic("label")} className={`shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${micField === "label" ? "bg-rose-500 text-white animate-pulse" : "bg-violet-100 text-violet-400 hover:bg-violet-200"}`}><Mic size={8} /></button>
      </div>
      <div className="flex-1 flex items-center gap-1 rounded-md border border-violet-200 bg-white px-2 py-1.5">
        <input value={value} onChange={(e) => onValueChange(e.target.value)} placeholder="Value" className="flex-1 text-sm outline-none min-w-0" />
        <button type="button" onClick={() => startMic("value")} className={`shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${micField === "value" ? "bg-rose-500 text-white animate-pulse" : "bg-violet-100 text-violet-400 hover:bg-violet-200"}`}><Mic size={8} /></button>
      </div>
      <button onClick={onRemove} className="text-rose-400 text-xs shrink-0">×</button>
    </div>
  );
}

function ProConInput({ value, onChange, onRemove, color }: { value: string; onChange: (v: string) => void; onRemove: () => void; color: "emerald" | "amber" }) {
  const [mic, setMic] = useState(false);
  const startMic = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (mic) return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-IN";
    r.onresult = (e: any) => { onChange(e.results[0][0].transcript.trim()); };
    r.onend = () => setMic(false); r.onerror = () => setMic(false);
    r.start(); setMic(true);
  };
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`flex-1 rounded-md border bg-white px-2 py-1.5 text-sm outline-none ${color === "emerald" ? "border-emerald-200" : "border-amber-200"}`} />
      <button type="button" onClick={startMic} className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all ${mic ? "bg-rose-500 text-white animate-pulse" : color === "emerald" ? "bg-emerald-100 text-emerald-500 hover:bg-emerald-200" : "bg-amber-100 text-amber-500 hover:bg-amber-200"}`}><Mic size={9} /></button>
      <button onClick={onRemove} className="text-rose-400 text-xs">×</button>
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────────────────────────────

type LoginMode = "password" | "otp" | "forgot";

function LoginScreen({ supabase, loginError, setLoginError, onSuccess }: { supabase: any; loginError: string; setLoginError: (v: string) => void; onSuccess: (user: any) => void; }) {
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePasswordLogin = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setLoginError(""); const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) { setLoginError(error.message); setLoading(false); return; } onSuccess(data.user); setLoading(false); };
  const handleSendOtp = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setLoginError(""); setMessage(""); const { error } = await supabase.auth.signInWithOtp({ email }); if (error) { setLoginError(error.message); setLoading(false); return; } setMessage("Check your email for the login code."); setLoading(false); };
  const handleVerifyOtp = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setLoginError(""); const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" }); if (error) { setLoginError(error.message); setLoading(false); return; } onSuccess(data.user); setLoading(false); };
  const handleForgotPassword = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setLoginError(""); setMessage(""); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/team` }); if (error) { setLoginError(error.message); setLoading(false); return; } setMessage("Password reset link sent."); setLoading(false); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Team Login</h1>
        <p className="text-sm text-slate-500 mb-6">Access the EV Listings dashboard</p>
        {loginError && <p className="text-sm text-rose-600 mb-4 rounded-lg bg-rose-50 px-3 py-2">{loginError}</p>}
        {message && <p className="text-sm text-emerald-600 mb-4 rounded-lg bg-emerald-50 px-3 py-2">{message}</p>}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 mb-6">
          <button onClick={() => { setMode("password"); setLoginError(""); setMessage(""); }} className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${mode === "password" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Password</button>
          <button onClick={() => { setMode("otp"); setLoginError(""); setMessage(""); }} className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${mode === "otp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Email OTP</button>
        </div>
        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <label className="block"><span className="text-[10px] font-bold uppercase text-slate-500">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" /></label>
            <label className="block"><span className="text-[10px] font-bold uppercase text-slate-500">Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">{loading ? "Signing in..." : "Sign In"}</button>
            <button type="button" onClick={() => { setMode("forgot"); setLoginError(""); setMessage(""); }} className="w-full text-center text-xs text-sky-600 font-medium">Forgot password?</button>
          </form>
        )}
        {mode === "otp" && !message && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <label className="block"><span className="text-[10px] font-bold uppercase text-slate-500">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">{loading ? "Sending..." : "Send Login Code"}</button>
          </form>
        )}
        {mode === "otp" && message && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <label className="block"><span className="text-[10px] font-bold uppercase text-slate-500">6-digit code</span><input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} inputMode="numeric" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-center font-mono tracking-[0.5em] outline-none focus:border-sky-400" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{loading ? "Verifying..." : "Verify & Login"}</button>
          </form>
        )}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <label className="block"><span className="text-[10px] font-bold uppercase text-slate-500">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">{loading ? "Sending..." : "Send Reset"}</button>
            <button type="button" onClick={() => { setMode("password"); setMessage(""); }} className="w-full text-center text-xs text-slate-500">← Back to login</button>
          </form>
        )}
      </div>
    </div>
  );
}
