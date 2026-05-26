"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Pencil, Trash2, LogOut, Save, X, Loader2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import type { EvListingRow, EvVariantRow } from "../lib/supabase";
import LeadsPanel from "./LeadsPanel";

type ListingForm = {
  slug: string; title: string; brand: string; body_type: string;
  commercial: boolean; launchdate: string | null; photo: string;
  gallery_images: any[]; colors: string[]; types: string[];
  pros: string[]; cons: string[];
};

type VariantForm = {
  variant_name: string; slug: string; model_year: number; price: number;
  top_speed: number | null; battery_capacity_kwh: number | null;
  driving_range_km: number | null; charging_time_mins: number | null;
  max_power_bhp: number | null; max_torque_nm: number | null;
  has_baas: boolean; baas_price_per_km: number | null;
  baas_upfront_price: number | null; baas_model_name: string;
  charging_time_ac_hours: number | null; charging_time_dc_mins: number | null;
  max_dc_charging_rate_kw: number | null;
  // Features
  features?: {
    front_brakes: string; rear_brakes: string; drivetrain: string;
    seating_capacity: number; front_suspension: string; rear_suspension: string;
    headlight_type: string;
    has_sunroof: boolean; has_climate_control: boolean; has_cruise_control: boolean;
    has_wireless_charger: boolean; has_keyless_entry: boolean;
    screen_size_inches: number | null; speaker_count: number;
    has_wireless_carplay_android_auto: boolean; has_connected_car_app: boolean;
    has_ota_updates: boolean; airbag_count: number; has_abs_ebd: boolean;
    has_esp: boolean; has_tpms: boolean; has_360_camera: boolean;
    adas_level: number; ncap_safety_rating: number | null;
  };
  showFeatures?: boolean;
};

const emptyListing: ListingForm = {
  slug: "", title: "", brand: "", body_type: "", commercial: false,
  launchdate: null, photo: "", gallery_images: [], colors: [],
  types: [], pros: [], cons: [],
};

const emptyVariant: VariantForm = {
  variant_name: "", slug: "", model_year: 2026, price: 0,
  top_speed: null, battery_capacity_kwh: null, driving_range_km: null,
  charging_time_mins: null, max_power_bhp: null, max_torque_nm: null,
  has_baas: false, baas_price_per_km: null, baas_upfront_price: null,
  baas_model_name: "", charging_time_ac_hours: null,
  charging_time_dc_mins: null, max_dc_charging_rate_kw: null,
};

const defaultFeatures = {
  front_brakes: "Disc", rear_brakes: "Disc", drivetrain: "FWD",
  seating_capacity: 5, front_suspension: "", rear_suspension: "",
  headlight_type: "LED", has_sunroof: false, has_climate_control: false,
  has_cruise_control: false, has_wireless_charger: false, has_keyless_entry: false,
  screen_size_inches: null, speaker_count: 4,
  has_wireless_carplay_android_auto: false, has_connected_car_app: false,
  has_ota_updates: false, airbag_count: 2, has_abs_ebd: true,
  has_esp: false, has_tpms: false, has_360_camera: false,
  adas_level: 0, ncap_safety_rating: null,
};

export default function TeamDashboard({ supabaseUrl, supabaseAnonKey }: { supabaseUrl: string; supabaseAnonKey: string }) {
  const supabase = useMemo(() => createClient(supabaseUrl, supabaseAnonKey), [supabaseUrl, supabaseAnonKey]);
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState("");
  const [listings, setListings] = useState<(EvListingRow & { variants: EvVariantRow[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>(emptyListing);
  const [variants, setVariants] = useState<(VariantForm & { id?: string })[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"listings" | "leads">("listings");

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user); }); }, []);
  useEffect(() => { if (user) fetchListings(); }, [user]);

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
    // Fetch author emails
    const authorIds = [...new Set(ls.map((l: any) => l.created_by).filter(Boolean))];
    let emailMap = new Map<string, string>();
    if (authorIds.length) {
      // Use a simple approach: current user's email is known, others show as "Team member"
      emailMap.set(user.id, user.email);
    }
    setListings((ls as any[]).map((l) => ({ ...l, variants: varMap.get(l.id) ?? [], author_email: emailMap.get(l.created_by) || "Team member" })));
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  const startNew = () => { setEditing("new"); setForm(emptyListing); setVariants([{ ...emptyVariant }]); };
  const startEdit = async (l: EvListingRow & { variants: EvVariantRow[] }) => {
    setEditing(l.id);
    setForm({ slug: l.slug, title: l.title, brand: l.brand, body_type: l.body_type || "", commercial: l.commercial, launchdate: l.launchdate, photo: l.photo, gallery_images: l.gallery_images ?? [], colors: l.colors ?? [], types: l.types ?? [], pros: l.pros ?? [], cons: l.cons ?? [] });
    // Load features for each variant
    const variantIds = l.variants.map((v) => v.id);
    let featuresMap = new Map<string, any>();
    if (variantIds.length) {
      const { data: feats } = await supabase.from("ev_variant_features").select("*").in("variant_id", variantIds);
      for (const f of (feats ?? [])) featuresMap.set(f.variant_id, f);
    }
    setVariants(l.variants.map((v) => ({ ...v, id: v.id, features: featuresMap.get(v.id) || undefined })) as any);
  };

  const handleSave = async () => {
    setSaving(true);
    const listingPayload = { ...form, slug: form.slug || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") };
    let listingId = editing === "new" ? null : editing;
    let error;

    if (editing === "new") {
      const res = await supabase.from("evlistings").insert(listingPayload).select("id").single();
      error = res.error; listingId = res.data?.id ?? null;
    } else {
      const res = await supabase.from("evlistings").update(listingPayload).eq("id", editing);
      error = res.error;
    }
    if (error) { alert(`Save failed: ${error.message}`); setSaving(false); return; }

    // Save variants
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
          slug: v.slug || `${listingPayload.slug}-${v.variant_name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          model_year: v.model_year,
          price: v.price,
          top_speed: v.top_speed,
          battery_capacity_kwh: v.battery_capacity_kwh,
          driving_range_km: v.driving_range_km,
          charging_time_mins: v.charging_time_mins,
          max_power_bhp: v.max_power_bhp,
          max_torque_nm: v.max_torque_nm,
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
        // Save features if provided
        if (savedVariantId && features) {
          await supabase.from("ev_variant_features").upsert({ variant_id: savedVariantId, ...features });
        }
      }
    }
    setSaving(false); setEditing(null); fetchListings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing and all its variants?")) return;
    await supabase.from("evlistings").delete().eq("id", id);
    fetchListings();
  };

  if (!user) return <LoginScreen supabase={supabase} loginError={loginError} setLoginError={setLoginError} onSuccess={(u) => setUser(u)} />;

  return (
    <div className="min-h-screen bg-slate-50 py-28 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Team Dashboard</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {activeSection === "listings" && (
              <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors">
                <Plus size={16} /> Add Listing
              </button>
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
        </div>

        {activeSection === "leads" && <LeadsPanel supabase={supabase} userId={user.id} />}

        {activeSection === "listings" && (<>

        {/* Edit Form */}
        {editing && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">{editing === "new" ? "New Listing" : "Edit Listing"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {/* Basic fields */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto-generated" />
              <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</span>
                <select value={form.types[0] || ""} onChange={(e) => setForm({ ...form, types: [e.target.value] })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="">Select</option><option value="2 Wheeler">2 Wheeler</option><option value="3 Wheeler">3 Wheeler</option><option value="4 Wheeler">4 Wheeler</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Body Type</span>
                <select value={form.body_type} onChange={(e) => setForm({ ...form, body_type: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="">Select</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Hatchback">Hatchback</option><option value="Compact SUV">Compact SUV</option><option value="MUV">MUV</option><option value="Bike">Bike</option><option value="Tempo">Tempo</option><option value="Other">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Launch Date</span>
                <input type="date" value={form.launchdate ?? ""} onChange={(e) => setForm({ ...form, launchdate: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
              </label>
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm"><input type="checkbox" checked={form.commercial} onChange={(e) => setForm({ ...form, commercial: e.target.checked })} /> Commercial</label>

            {/* Photo */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Featured Photo</p>
              <div className="flex items-center gap-3">
                {form.photo && <img src={form.photo} alt="preview" className="h-16 w-20 rounded-lg object-cover border" />}
                <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const path = `evlistings/${form.slug || Date.now()}/${file.name}`; const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true }); if (data) { const { data: u } = supabase.storage.from("evphotos").getPublicUrl(data.path); setForm({ ...form, photo: u.publicUrl }); } }} className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600" />
                <Field label="" value={form.photo} onChange={(v) => setForm({ ...form, photo: v })} placeholder="Or paste URL" />
              </div>
            </div>

            {/* Gallery */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Gallery</p>
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
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Colors</p>
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
                <div className="flex items-center justify-between mb-2"><p className="text-[10px] font-bold uppercase text-emerald-600">Pros</p><button onClick={() => setForm({ ...form, pros: [...form.pros, ""] })} className="text-[10px] font-bold text-emerald-600">+ Add</button></div>
                {form.pros.map((p, i) => (<div key={i} className="flex items-center gap-1.5 mb-1.5"><input value={p} onChange={(e) => { const arr = [...form.pros]; arr[i] = e.target.value; setForm({ ...form, pros: arr }); }} className="flex-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-[11px] outline-none" /><button onClick={() => setForm({ ...form, pros: form.pros.filter((_, j) => j !== i) })} className="text-rose-400 text-xs">×</button></div>))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-2"><p className="text-[10px] font-bold uppercase text-amber-600">Cons</p><button onClick={() => setForm({ ...form, cons: [...form.cons, ""] })} className="text-[10px] font-bold text-amber-600">+ Add</button></div>
                {form.cons.map((c, i) => (<div key={i} className="flex items-center gap-1.5 mb-1.5"><input value={c} onChange={(e) => { const arr = [...form.cons]; arr[i] = e.target.value; setForm({ ...form, cons: arr }); }} className="flex-1 rounded-md border border-amber-200 bg-white px-2 py-1.5 text-[11px] outline-none" /><button onClick={() => setForm({ ...form, cons: form.cons.filter((_, j) => j !== i) })} className="text-rose-400 text-xs">×</button></div>))}
              </div>
            </div>

            {/* ── Variants ── */}
            <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Variants</p>
                <button onClick={() => setVariants([...variants, { ...emptyVariant }])} className="text-[10px] font-bold text-sky-600 hover:text-sky-700">+ Add Variant</button>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700">{v.variant_name || `Variant ${i + 1}`}</span>
                    <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="text-[10px] text-rose-500 font-bold">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    <MiniInput label="Variant Name" value={v.variant_name} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], variant_name: val }; setVariants(arr); }} />
                    <MiniInput label="Model Year" value={String(v.model_year)} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], model_year: Number(val) || 2026 }; setVariants(arr); }} />
                    <MiniInput label="Price (Lakh)" value={String(v.price || "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], price: Number(val) || 0 }; setVariants(arr); }} />
                    <MiniInput label="Top Speed (km/h)" value={String(v.top_speed ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], top_speed: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="Battery (kWh)" value={String(v.battery_capacity_kwh ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], battery_capacity_kwh: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="Range (km)" value={String(v.driving_range_km ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], driving_range_km: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="Charge Time (min)" value={String(v.charging_time_mins ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charging_time_mins: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="Max Power (bhp)" value={String(v.max_power_bhp ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], max_power_bhp: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="Max Torque (Nm)" value={String(v.max_torque_nm ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], max_torque_nm: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="AC Charge (hrs)" value={String(v.charging_time_ac_hours ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charging_time_ac_hours: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="DC Charge (min)" value={String(v.charging_time_dc_mins ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], charging_time_dc_mins: val ? Number(val) : null }; setVariants(arr); }} />
                    <MiniInput label="Max DC Rate (kW)" value={String(v.max_dc_charging_rate_kw ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], max_dc_charging_rate_kw: val ? Number(val) : null }; setVariants(arr); }} />
                  </div>
                  <label className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                    <input type="checkbox" checked={v.has_baas} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], has_baas: e.target.checked }; setVariants(arr); }} />
                    This variant has BAAS option
                  </label>
                  {v.has_baas && (
                    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-[8px] font-bold uppercase text-emerald-600 mb-2">BAAS Details</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <MiniInput label="BAAS Model Name" value={v.baas_model_name} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], baas_model_name: val }; setVariants(arr); }} />
                        <MiniInput label="₹/km Rate" value={String(v.baas_price_per_km ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], baas_price_per_km: val ? Number(val) : null }; setVariants(arr); }} />
                        <MiniInput label="Upfront Price (₹)" value={String(v.baas_upfront_price ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], baas_upfront_price: val ? Number(val) : null }; setVariants(arr); }} />
                      </div>
                    </div>
                  )}
                  {/* Capacity & Dimensions */}
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-2">Capacity & Dimensions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      <MiniInput label="Length (mm)" value={String((v as any).length_mm ?? "")} onChange={(val) => { const arr = [...variants]; (arr[i] as any).length_mm = val ? Number(val) : null; setVariants(arr); }} />
                      <MiniInput label="Width (mm)" value={String((v as any).width_mm ?? "")} onChange={(val) => { const arr = [...variants]; (arr[i] as any).width_mm = val ? Number(val) : null; setVariants(arr); }} />
                      <MiniInput label="Height (mm)" value={String((v as any).height_mm ?? "")} onChange={(val) => { const arr = [...variants]; (arr[i] as any).height_mm = val ? Number(val) : null; setVariants(arr); }} />
                      <MiniInput label="Wheelbase (mm)" value={String((v as any).wheelbase_mm ?? "")} onChange={(val) => { const arr = [...variants]; (arr[i] as any).wheelbase_mm = val ? Number(val) : null; setVariants(arr); }} />
                      <MiniInput label="Ground Clearance (mm)" value={String((v as any).ground_clearance_mm ?? "")} onChange={(val) => { const arr = [...variants]; (arr[i] as any).ground_clearance_mm = val ? Number(val) : null; setVariants(arr); }} />
                      <MiniInput label="Boot Space (L)" value={String((v as any).boot_space_litres ?? "")} onChange={(val) => { const arr = [...variants]; (arr[i] as any).boot_space_litres = val ? Number(val) : null; setVariants(arr); }} />
                      <MiniInput label="Min Turning Radius (m)" value={String((v as any).turning_radius_m ?? "")} onChange={(val) => { const arr = [...variants]; (arr[i] as any).turning_radius_m = val ? Number(val) : null; setVariants(arr); }} />
                    </div>
                  </div>
                  {/* Features toggle */}
                  <button onClick={() => { const arr = [...variants]; arr[i] = { ...arr[i], showFeatures: !v.showFeatures }; setVariants(arr); }}
                    className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700">
                    {v.showFeatures ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Features & Safety
                  </button>
                  {v.showFeatures && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                        <label className="block"><span className="text-[8px] font-bold uppercase text-slate-400">Front Brakes</span><select value={v.features?.front_brakes || "Disc"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, front_brakes: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none"><option value="Disc">Disc</option><option value="Ventilated Disc">Ventilated Disc</option><option value="Drum">Drum</option></select></label>
                        <label className="block"><span className="text-[8px] font-bold uppercase text-slate-400">Rear Brakes</span><select value={v.features?.rear_brakes || "Disc"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, rear_brakes: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none"><option value="Disc">Disc</option><option value="Solid Disc">Solid Disc</option><option value="Drum">Drum</option></select></label>
                        <label className="block"><span className="text-[8px] font-bold uppercase text-slate-400">Drivetrain</span><select value={v.features?.drivetrain || "FWD"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, drivetrain: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none"><option value="FWD">FWD</option><option value="RWD">RWD</option><option value="AWD">AWD</option></select></label>
                        <MiniInput label="Seating" value={String(v.features?.seating_capacity ?? 5)} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, seating_capacity: Number(val) || 5 } }; setVariants(arr); }} />
                        <MiniInput label="Front Suspension" value={(v.features as any)?.front_suspension ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, front_suspension: val } }; setVariants(arr); }} />
                        <MiniInput label="Rear Suspension" value={(v.features as any)?.rear_suspension ?? ""} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, rear_suspension: val } }; setVariants(arr); }} />
                        <MiniInput label="Screen (inches)" value={String(v.features?.screen_size_inches ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, screen_size_inches: val ? Number(val) : null } }; setVariants(arr); }} />
                        <MiniInput label="Speakers" value={String(v.features?.speaker_count ?? 4)} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, speaker_count: Number(val) || 4 } }; setVariants(arr); }} />
                        <MiniInput label="Airbags" value={String(v.features?.airbag_count ?? 2)} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, airbag_count: Number(val) || 2 } }; setVariants(arr); }} />
                        <MiniInput label="ADAS Level (0/1/2)" value={String(v.features?.adas_level ?? 0)} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, adas_level: Number(val) || 0 } }; setVariants(arr); }} />
                        <MiniInput label="NCAP Rating" value={String(v.features?.ncap_safety_rating ?? "")} onChange={(val) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, ncap_safety_rating: val ? Number(val) : null } }; setVariants(arr); }} />
                        <label className="block"><span className="text-[8px] font-bold uppercase text-slate-400">Headlights</span><select value={v.features?.headlight_type || "LED"} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, headlight_type: e.target.value } }; setVariants(arr); }} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none"><option value="Halogen">Halogen</option><option value="LED">LED</option><option value="Projector LED">Projector LED</option></select></label>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {([["has_sunroof","Sunroof"],["has_climate_control","Climate Control"],["has_cruise_control","Cruise Control"],["has_wireless_charger","Wireless Charger"],["has_keyless_entry","Keyless Entry"],["has_wireless_carplay_android_auto","Wireless CarPlay/AA"],["has_connected_car_app","Connected Car App"],["has_ota_updates","OTA Updates"],["has_abs_ebd","ABS+EBD"],["has_esp","ESP"],["has_tpms","TPMS"],["has_360_camera","360° Camera"]] as [string,string][]).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                            <input type="checkbox" checked={!!(v.features as any)?.[key]} onChange={(e) => { const arr = [...variants]; arr[i] = { ...arr[i], features: { ...defaultFeatures, ...arr[i].features, [key]: e.target.checked } }; setVariants(arr); }} />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={handleSave} disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editing === "new" ? "Create Listing" : "Save Changes"}
            </button>
          </div>
        )}

        {/* Listings Table */}
        {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3">
                  {l.photo && <img src={l.photo} alt="" className="h-12 w-16 rounded-lg object-cover border shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.brand} · {l.types?.[0]} · {l.variants.length} variant{l.variants.length !== 1 ? "s" : ""}</p>
                    <p className="text-[10px] text-slate-400">by {(l as any).author_email || "Unknown"}</p>
                  </div>
                  <button onClick={() => setExpandedListing(expandedListing === l.id ? null : l.id)} className="text-slate-400 hover:text-slate-600">
                    {expandedListing === l.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {(l as any).created_by === user.id && (
                    <>
                      <button onClick={() => startEdit(l)} className="text-sky-600 hover:text-sky-700 text-xs font-bold">Edit</button>
                      <button onClick={() => handleDelete(l.id)} className="text-rose-500 hover:text-rose-600 text-xs font-bold">Delete</button>
                    </>
                  )}
                </div>
                {expandedListing === l.id && l.variants.length > 0 && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Variants</p>
                    <div className="space-y-1">
                      {l.variants.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{v.variant_name}</span>
                          <span>₹{v.price}L</span>
                          <span>{v.driving_range_km}km</span>
                          <span>{v.battery_capacity_kwh}kWh</span>
                          {v.has_baas && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">BAAS</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {listings.length === 0 && <div className="text-center py-12 text-slate-400">No listings yet. Add your first one!</div>}
          </div>
        )}
        </>)}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (<label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" /></label>);
}

function MiniInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (<label className="block"><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-sky-400" /></label>);
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
