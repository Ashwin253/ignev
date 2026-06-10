"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Pencil, Trash2, LogOut, Save, X, Loader2, ChevronDown, ChevronUp, MessageSquare, Mic, MicOff } from "lucide-react";
import type { EvListingRow, EvVariantRow } from "../lib/supabase";
import LeadsPanel from "./LeadsPanel";
import FuelPricesPanel from "./FuelPricesPanel";
import AnalyticsPanel from "./AnalyticsPanel";
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
  slug: string; title: string; brand: string; body_type: string;
  commercial: boolean; has_baas: boolean; launchdate: string | null; photo: string;
  gallery_images: any[]; colors: string[]; types: string[];
  pros: string[]; cons: string[];
  price_bracket: string;
  parent_id?: string;
  editors_emails?: string[];
};

export type VariantForm = {
  id?: string;
  variant_name: string;
  version_name?: string | null;
  launch_date?: string | null;
  slug: string; model_year: number; price: number;
  top_speed: string | null; battery_capacity_kwh: string | null;
  driving_range_km: string | null; charging_time_mins: string | null;
  max_power_bhp: string | null; max_torque_nm: string | null;
  has_baas: boolean; baas_price_per_km: string | null;
  baas_upfront_price: string | null; baas_model_name: string;
  charging_time_ac_hours: string | null; charging_time_dc_mins: string | null;
  max_dc_charging_rate_kw: string | null;
  acceleration?: string | null; battery_type?: string | null; battery_portability?: string | null;
  charger_type?: string | null; charger_output?: string | null; charger_cost_included?: string | null;
  kerb_weight_kg?: string | null; seat_length_mm?: string | null; seat_height_mm?: string | null;
  length_mm?: string | null; width_mm?: string | null; height_mm?: string | null;
  ground_clearance_mm?: string | null; wheelbase_mm?: string | null; turning_radius_m?: string | null;
  braking_system?: string | null; wheel_type?: string | null; front_wheel_size?: string | null; rear_wheel_size?: string | null;
  front_suspension?: string | null; rear_suspension?: string | null; chassis_type?: string | null;
  battery_warranty?: string | null; motor_warranty?: string | null;
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
};

const emptyListing: ListingForm = {
  slug: "", title: "", brand: "", body_type: "", commercial: false, has_baas: false,
  launchdate: null, photo: "", gallery_images: [], colors: [],
  types: [], pros: [], cons: [], price_bracket: "",
  parent_id: "",
  editors_emails: [],
};

const emptyVariant: VariantForm = {
  variant_name: "", version_name: "", launch_date: "", slug: "", model_year: 2026, price: 0,
  top_speed: null, battery_capacity_kwh: null, driving_range_km: null,
  charging_time_mins: null, max_power_bhp: null, max_torque_nm: null,
  has_baas: false, baas_price_per_km: null, baas_upfront_price: null,
  baas_model_name: "", charging_time_ac_hours: null,
  charging_time_dc_mins: null, max_dc_charging_rate_kw: null,
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

let browserSupabaseClient: any = null;

export default function TeamDashboard({ supabaseUrl, supabaseAnonKey }: { supabaseUrl: string; supabaseAnonKey: string }) {
  if (!browserSupabaseClient) {
    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  const supabase = browserSupabaseClient;
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState("");
  const [listings, setListings] = useState<(EvListingRow & { variants: EvVariantRow[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>(emptyListing);
  const [variants, setVariants] = useState<(VariantForm & { id?: string })[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"listings" | "leads" | "prices" | "analytics">("listings");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [energyComps, setEnergyComps] = useState<Array<{ id?: string; category: string; name: string; fuel_type: string; mileage: string; fuel_price: string; model_used: string; brand: string }>>([]);
  const [variantSpecSection, setVariantSpecSection] = useState<Record<number, string>>({});
  const [listingFormTab, setListingFormTab] = useState<"core" | "variants" | "energy">("core");
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [initialSnapshot, setInitialSnapshot] = useState<{form: any, variants: any, energyComps: any} | null>(null);

  const [motorClipboard, setMotorClipboard] = useState<any>(null);
  const [chargingClipboard, setChargingClipboard] = useState<any>(null);
  const [dimensionsClipboard, setDimensionsClipboard] = useState<any>(null);

  const [sameForAllMotor, setSameForAllMotor] = useState(false);
  const [sameForAllCharging, setSameForAllCharging] = useState(false);
  const [sameForAllDimensions, setSameForAllDimensions] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }: any) => { if (data.user) setUser(data.user); }); }, []);
  useEffect(() => { if (user) fetchListings(); }, [user]);

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

  const startNew = () => {
    setEditing("new");
    setForm(emptyListing);
    setVariants([{ ...emptyVariant }]);
    setActiveVariantIndex(0);
    setEnergyComps([]);
    setListingFormTab("core");
    setVariantSpecSection({});
    setInitialSnapshot({
      form: JSON.parse(JSON.stringify(emptyListing)),
      variants: JSON.parse(JSON.stringify([{ ...emptyVariant }])),
      energyComps: [],
    });
  };
  const startEdit = async (l: EvListingRow & { variants: EvVariantRow[] }) => {
    setEditing(l.id);
    setListingFormTab("core");
    const loadedForm = { slug: l.slug, title: l.title, brand: l.brand, body_type: l.body_type || "", commercial: l.commercial, has_baas: l.has_baas || false, launchdate: l.launchdate, photo: l.photo, gallery_images: l.gallery_images ?? [], colors: l.colors ?? [], types: l.types ?? [], pros: l.pros ?? [], cons: l.cons ?? [], price_bracket: (l as any).price_bracket || "", parent_id: l.parent_id || "", editors_emails: l.editors_emails ?? [] };
    setForm(loadedForm);
    // Load features for each variant
    const variantIds = l.variants.map((v) => v.id);
    let featuresMap = new Map<string, any>();
    if (variantIds.length) {
      const { data: feats } = await supabase.from("ev_variant_features").select("*").in("variant_id", variantIds);
      for (const f of (feats ?? [])) featuresMap.set(f.variant_id, f);
    }
    const loadedVariants = l.variants.map((v) => ({ ...v, id: v.id, features: featuresMap.get(v.id) || undefined })) as any;
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

  const handleSave = async () => {
    setSaving(true);
    // Sanitize slug by replacing spaces with '-' and removing non-alphanumeric chars
    // Fallback to timestamp if both are empty to avoid unique constraints
    const baseSlug = form.slug || form.title || `listing-${Date.now()}`;
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

    const listingPayload: any = { 
      ...formWithoutParent, 
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
        const varPayload: any = {
          listing_id: listingId,
          variant_name: v.variant_name,
          version_name: v.version_name || null,
          launch_date: v.launch_date || null,
          slug: v.slug || `${sanitizedSlug}-${v.variant_name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
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
          custom_fields: (v as any).custom_fields || [],
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
    }

    // Save energy comparisons (only if not moving/merged to parent)
    if (listingId && !parent_id) {
      const existingEcIds = energyComps.filter((e) => e.id).map((e) => e.id!);
      await supabase.from("ev_energy_comparisons").delete().eq("listing_id", listingId).not("id", "in", `(${existingEcIds.join(",")})`);
      for (const ec of energyComps) {
        const payload = { listing_id: listingId, category: ec.category, name: ec.name, fuel_type: ec.fuel_type, mileage: ec.mileage, fuel_price: ec.fuel_price, model_used: ec.model_used, brand: ec.brand };
        if (ec.id) {
          await supabase.from("ev_energy_comparisons").update(payload).eq("id", ec.id);
        } else {
          await supabase.from("ev_energy_comparisons").insert(payload);
        }
      }
    }
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
    
    fetchListings();
  };

  if (!user) return <LoginScreen supabase={supabase} loginError={loginError} setLoginError={setLoginError} onSuccess={(u) => setUser(u)} />;

  return (
    <div className="min-h-screen bg-slate-200 py-28 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Team Dashboard</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {activeSection === "listings" && (
              <>
                <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors">
                  <Plus size={16} /> Add Listing
                </button>
                {editing && (
                  <button onClick={() => { setEditing(null); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    View Listings
                  </button>
                )}
              </>
            )}
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveSection("listings")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeSection === "listings" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            EV Listings
          </button>
          <button onClick={() => setActiveSection("leads")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeSection === "leads" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            <MessageSquare size={14} /> Enquiries
          </button>
          <button onClick={() => setActiveSection("prices")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeSection === "prices" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            ⛽ Fuel Prices
          </button>
          <button onClick={() => setActiveSection("analytics")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeSection === "analytics" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            📊 Analytics
          </button>
        </div>

        {activeSection === "leads" && <LeadsPanel supabase={supabase} userId={user.id} />}
        {activeSection === "prices" && <FuelPricesPanel supabase={supabase} userEmail={user.email} />}
        {activeSection === "analytics" && <AnalyticsPanel supabase={supabase} />}

        {activeSection === "listings" && (<>

        {/* Quick Add Variant — select model then add variant */}
        {!editing && listings.length > 0 && (() => {
          const selectedModel = listings.find((l) => l.id === selectedModelId);
          return (
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <p className="text-sm font-bold text-sky-700 mb-3">Manage Variants</p>
              <div className="flex items-center gap-3 mb-4">
                <select
                  className="flex-1 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                >
                  <option value="">Select a model...</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>{l.brand} {l.title} ({l.variants.length} variants)</option>
                  ))}
                </select>
                {selectedModel && (
                  <>
                    <button onClick={() => { startEdit(selectedModel); setListingFormTab("variants"); setEditingVariantId(null); }}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white hover:bg-sky-700 shrink-0">
                      <Plus size={14} /> Add Variant
                    </button>
                    <button onClick={() => { startEdit(selectedModel); setListingFormTab("core"); setEditingVariantId(null); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 shrink-0">
                      Edit Model
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${selectedModel.brand} ${selectedModel.title}" and all its variants?`)) { handleDelete(selectedModel.id); setSelectedModelId(""); } }}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 shrink-0">
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
              </div>
              {/* Variants list for selected model */}
              {selectedModel && selectedModel.variants.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {selectedModel.variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{v.variant_name}</p>
                        <p className="text-[10px] text-slate-500">₹{v.price}L · {v.driving_range_km}km · {v.battery_capacity_kwh}kWh {v.has_baas && <span className="text-emerald-600 font-bold">· BAAS</span>}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { startEdit(selectedModel); setListingFormTab("variants"); setEditingVariantId(v.id); }}
                          className="text-xs font-bold text-sky-600 hover:text-sky-700">Edit</button>
                        <button onClick={async () => { if (!confirm(`Delete variant "${v.variant_name}"?`)) return; await supabase.from("ev_variants").delete().eq("id", v.id); fetchListings(); }}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedModel && selectedModel.variants.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No variants yet. Click &quot;Add Variant&quot; to add one.</p>
              )}
            </div>
          );
        })()}

        {/* Edit Form */}
        {editing && (
          <div className="mb-8 rounded-2xl border-2 border-slate-300 bg-slate-50 p-6 shadow-sm text-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing === "new" ? "New Listing" : "Edit Listing"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="mb-5 flex flex-wrap gap-1 rounded-xl border-2 border-slate-300 bg-slate-200 p-1">
              {([
                { id: "core" as const, label: "Core Details" },
                { id: "variants" as const, label: "Variants", count: variants.length },
                { id: "energy" as const, label: "Energy Comparison", count: energyComps.length },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setListingFormTab(tab.id)}
                  className={`flex-1 min-w-[120px] rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${
                    listingFormTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-slate-300/60"
                  }`}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[9px] ${
                      listingFormTab === tab.id ? "bg-slate-200 text-slate-700" : "bg-slate-400/30 text-slate-600"
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
              <Field label="Model" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto-generated" />
              <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Type</span>
                <select value={form.types[0] || ""} onChange={(e) => setForm({ ...form, types: [e.target.value] })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="">Select</option><option value="Scooter">Scooter</option><option value="2 Wheeler">2 Wheeler</option><option value="3 Wheeler">3 Wheeler</option><option value="4 Wheeler">4 Wheeler</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Price Bracket</span>
                <select value={form.price_bracket} onChange={(e) => setForm({ ...form, price_bracket: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="">Select Bracket</option>
                  <option value="0-5">Under ₹5L</option>
                  <option value="5-15">₹5L – ₹15L</option>
                  <option value="15-30">₹15L – ₹30L</option>
                  <option value="30+">₹30L+</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Body Type</span>
                <select value={form.body_type} onChange={(e) => setForm({ ...form, body_type: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="">Select</option><option value="Scooter">Scooter</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Hatchback">Hatchback</option><option value="Compact SUV">Compact SUV</option><option value="MUV">MUV</option><option value="Bike">Bike</option><option value="Tempo">Tempo</option><option value="Other">Other</option>
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
            <label className="flex items-center gap-2 mt-3 text-sm"><input type="checkbox" checked={form.commercial} onChange={(e) => setForm({ ...form, commercial: e.target.checked })} /> Commercial</label>
            <label className="flex items-center gap-2 mt-1 text-sm"><input type="checkbox" checked={form.has_baas} onChange={(e) => setForm({ ...form, has_baas: e.target.checked })} /> Has BAAS (Battery as a Service)</label>

            {/* Photo */}
            <div className="mt-5 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Featured Photo</p>
              <div className="flex items-center gap-3">
                {form.photo && <img src={form.photo} alt="preview" className="h-16 w-20 rounded-lg object-cover border" />}
                <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const path = `evlistings/${form.slug || Date.now()}/${file.name}`; const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true }); if (data) { const { data: u } = supabase.storage.from("evphotos").getPublicUrl(data.path); setForm({ ...form, photo: u.publicUrl }); } }} className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600" />
                <Field label="" value={form.photo} onChange={(v) => setForm({ ...form, photo: v })} placeholder="Or paste URL" />
              </div>
            </div>

            {/* Gallery */}
            <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Gallery</p>
              <div className="space-y-2 mb-3">
                {form.gallery_images.map((item, i) => {
                  const isObj = typeof item === "object" && item !== null;
                  const url = isObj ? (item as any).url : item;
                  const imgType = isObj ? (item as any).type || "" : "";
                  const colorCode = isObj ? (item as any).colorCode || "" : "";
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                      <img src={url} alt="" className="h-12 w-16 rounded-md object-cover border shrink-0" />
                      <select value={imgType} onChange={(e) => { const arr = [...form.gallery_images]; arr[i] = { url, type: e.target.value, colorCode } as any; setForm({ ...form, gallery_images: arr }); }} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] outline-none">
                        <option value="">No tag</option>
                        <option value="color">Color</option>
                        <option value="interior">Interior</option>
                        <option value="exterior">Exterior</option>
                      </select>
                      {imgType === "color" && (
                        <select value={colorCode} onChange={(e) => { const arr = [...form.gallery_images]; arr[i] = { url, type: imgType, colorCode: e.target.value } as any; setForm({ ...form, gallery_images: arr }); }} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] outline-none">
                          <option value="">Pick color</option>
                          {form.colors.map((c, ci) => (<option key={ci} value={c}>{c}</option>))}
                        </select>
                      )}
                      {imgType === "color" && colorCode && <div className="h-5 w-5 rounded border" style={{ backgroundColor: colorCode.startsWith("#") ? colorCode : `#${colorCode}` }} />}
                      <button onClick={() => setForm({ ...form, gallery_images: form.gallery_images.filter((_, j) => j !== i) })} className="ml-auto text-rose-400 hover:text-rose-600 text-xs font-bold shrink-0">×</button>
                    </div>
                  );
                })}
              </div>
              <input type="file" accept="image/*" multiple onChange={async (e) => { const files = Array.from(e.target.files ?? []); const urls: any[] = []; for (const file of files) { const path = `evlistings/${form.slug || Date.now()}/gallery-${Date.now()}-${file.name}`; const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true }); if (data) { const { data: u } = supabase.storage.from("evphotos").getPublicUrl(data.path); urls.push({ url: u.publicUrl, type: "", colorCode: "" }); } } setForm({ ...form, gallery_images: [...form.gallery_images, ...urls] }); }} className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600" />
            </div>

            {/* Colors */}
            <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Colors</p>
                <button onClick={() => setForm({ ...form, colors: [...form.colors, ""] })} className="text-[10px] font-bold text-sky-600">+ Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colors.map((hex, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-md border" style={{ backgroundColor: hex.startsWith("#") ? hex : `#${hex}` }} />
                    <input value={hex} onChange={(e) => { const arr = [...form.colors]; arr[i] = e.target.value; setForm({ ...form, colors: arr }); }} placeholder="FF5733" className="w-20 rounded-md border border-slate-200 px-2 py-1 text-[11px] outline-none" />
                    <button onClick={() => setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })} className="text-rose-400 text-xs">×</button>
                  </div>
                ))}
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

            {listingFormTab === "variants" && (
            <div className="rounded-xl border-2 border-sky-300 bg-sky-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-sky-700">
                  {editingVariantId ? `Editing: ${variants.find((v) => (v as any).id === editingVariantId)?.variant_name || "Variant"}` : `Variants (${variants.length})`}
                </p>
              </div>
              {/* Actions row */}
              <div className="flex flex-wrap gap-2 mb-4 rounded-xl bg-white border border-sky-200 p-3">
                <button onClick={() => { setVariants([...variants, { ...emptyVariant }]); setActiveVariantIndex(variants.length); setEditingVariantId(null); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700">
                  <Plus size={12} /> Add New
                </button>
                <button onClick={() => { const current = variants[activeVariantIndex]; if (current) { const clone = { ...current, variant_name: `${current.variant_name} (Copy)`, id: undefined } as any; delete clone.id; setVariants([...variants, clone]); setActiveVariantIndex(variants.length); setEditingVariantId(null); } }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50">
                  📋 Clone Current
                </button>
                {variants.length > 1 && (
                  <button onClick={() => { if (!confirm(`Remove "${variants[activeVariantIndex]?.variant_name || "this variant"}"?`)) return; const arr = variants.filter((_, j) => j !== activeVariantIndex); setVariants(arr); setActiveVariantIndex(Math.max(0, activeVariantIndex - 1)); setEditingVariantId(null); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50">
                    <Trash2 size={12} /> Remove
                  </button>
                )}
                {editingVariantId && <button onClick={() => setEditingVariantId(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">Show All</button>}
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
                    <button onClick={(e) => { e.stopPropagation(); setVariants(variants.filter((_, j) => j !== i)); setActiveVariantIndex(Math.max(0, i - 1)); }} className="text-[10px] text-rose-500 font-bold">Remove Variant</button>
                  </div>
                  <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                    <MiniInput label="Variant Name" value={v.variant_name} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], variant_name: val }; setVariants(arr); }} />
                    <MiniInput label="Version/Refresh" value={v.version_name || ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], version_name: val }; setVariants(arr); }} />
                    <MiniInput label="Launch Date" value={v.launch_date || ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], launch_date: val }; setVariants(arr); }} />
                    <MiniInput label="Model Year" value={String(v.model_year)} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], model_year: cleanInt(val, 2026) }; setVariants(arr); }} />
                    <MiniInput label="Price (Lakh)" value={String(v.price || "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], price: cleanPriceLakh(val) }; setVariants(arr); }} />
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
                      <MiniInput label="Battery Capacity" value={v.battery_capacity_kwh ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], battery_capacity_kwh: val }; setVariants(arr); }} />
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
                  <label className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                    <input type="checkbox" checked={v.has_baas} onChange={(e) => updateVariantChargingField(i, "has_baas", e.target.checked)} />
                    This variant has BAAS option
                  </label>
                  {v.has_baas && (
                    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-[8px] font-bold uppercase text-emerald-600 mb-2">BAAS Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <MiniInput label="BAAS Model Name" value={v.baas_model_name} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], baas_model_name: val }; setVariants(arr); }} />
                        <MiniInput label="₹/km Rate" value={v.baas_price_per_km ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], baas_price_per_km: val }; setVariants(arr); }} />
                        <MiniInput label="Upfront Price (₹)" value={v.baas_upfront_price ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], baas_upfront_price: val }; setVariants(arr); }} />
                      </div>
                    </div>
                  )}
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
                        <label className="block"><span className="text-[8px] font-bold uppercase text-slate-500">Front Brakes</span><select value={v.features?.front_brakes || "Disc"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, front_brakes: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none"><option value="Disc">Disc</option><option value="Ventilated Disc">Ventilated Disc</option><option value="Drum">Drum</option></select></label>
                        <label className="block"><span className="text-[8px] font-bold uppercase text-slate-400">Rear Brakes</span><select value={v.features?.rear_brakes || "Disc"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, rear_brakes: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none"><option value="Disc">Disc</option><option value="Solid Disc">Solid Disc</option><option value="Drum">Drum</option></select></label>
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
                        <label className="block"><span className="text-[8px] font-bold uppercase text-slate-400">Headlights</span><select value={v.features?.headlight_type || "LED"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, headlight_type: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none"><option value="Halogen">Halogen</option><option value="LED">LED</option><option value="Projector LED">Projector LED</option></select></label>
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
            <div className="rounded-xl border-2 border-amber-300 bg-amber-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Energy Comparisons</p>
                <div className="flex gap-2">
                  <button onClick={() => setEnergyComps([...energyComps, { category: "fuel", name: "", fuel_type: "Petrol", mileage: "", fuel_price: "", model_used: "", brand: "" }])} className="text-[10px] font-bold text-amber-600 hover:text-amber-700">+ Fuel Type</button>
                  {/* <button onClick={() => setEnergyComps([...energyComps, { category: "model", name: "", fuel_type: "EV", mileage: "", fuel_price: "", model_used: "", brand: "" }])} className="text-[10px] font-bold text-sky-600 hover:text-sky-700">+ Model</button> */}
                </div>
              </div>
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
                    <MiniInput label={ec.fuel_type === "EV" || ec.fuel_type === "self" ? "Range (km)" : "Mileage (km/L)"} value={ec.mileage} onChange={(val) => { const arr = [...energyComps]; arr[i] = { ...arr[i], mileage: val }; setEnergyComps(arr); }} />
                    <MiniInput label={ec.fuel_type === "EV" || ec.fuel_type === "self" ? "₹/km" : "₹/L or ₹/kg"} value={ec.fuel_price} onChange={(val) => { const arr = [...energyComps]; arr[i] = { ...arr[i], fuel_price: val }; setEnergyComps(arr); }} />
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
  return (<label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><div className="mt-1 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5"><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 text-sm outline-none bg-transparent" /><button type="button" onClick={startMic} className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-all ${micActive ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-400 hover:bg-sky-100 hover:text-sky-600"}`}>{micActive ? <MicOff size={10} /> : <Mic size={10} />}</button></div></label>);
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
  return (<label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span><div className="mt-0.5 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-2"><input value={localValue} onChange={(e) => { setLocalValue(e.target.value); onChange(e.target.value); }} onBlur={() => { if (onBlur) onBlur(); }} placeholder={placeholder} className="flex-1 text-sm outline-none bg-transparent min-w-0" /><button type="button" onClick={startMic} className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all ${micActive ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-400 hover:bg-sky-100 hover:text-sky-600"}`}>{micActive ? <MicOff size={9} /> : <Mic size={9} />}</button></div></label>);
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
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">{loading ? "Sending..." : "Send Reset Link"}</button>
            <button type="button" onClick={() => { setMode("password"); setMessage(""); }} className="w-full text-center text-xs text-slate-500">← Back to login</button>
          </form>
        )}
      </div>
    </div>
  );
}
