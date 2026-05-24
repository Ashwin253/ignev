"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Pencil, Trash2, LogOut, Save, X, Loader2 } from "lucide-react";
import type { EvListingRow } from "../lib/supabase";

type FormData = Omit<EvListingRow, "id" | "created_at" | "updated_at">;

const emptyForm: FormData = {
  slug: "",
  title: "",
  brand: "",
  types: [],
  price: "",
  top_speed: null,
  commercial: false,
  launchdate: null,
  photo: "",
  gallery_images: [],
  colors: [],
  battery_variants: [],
  baas_variants: [],
  has_baas: false,
  pros: [],
  cons: [],
  energy_comparison: [],
  battery_specs: [],
  charging_specs: [],
  body_type: "",
};

export default function TeamDashboard({ supabaseUrl, supabaseAnonKey }: { supabaseUrl: string; supabaseAnonKey: string }) {
  const supabase = useMemo(() => createClient(supabaseUrl, supabaseAnonKey), [supabaseUrl, supabaseAnonKey]);
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState("");
  const [listings, setListings] = useState<EvListingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Check session on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
  }, []);

  // Fetch listings when logged in
  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("evlistings")
      .select("*")
      .order("created_at", { ascending: false });
    setListings((data as EvListingRow[]) ?? []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const startEdit = (listing: EvListingRow) => {
    setEditing(listing.id);
    setForm({
      slug: listing.slug,
      title: listing.title,
      brand: listing.brand,
      types: listing.types,
      price: listing.price,
      top_speed: listing.top_speed,
      commercial: listing.commercial,
      launchdate: listing.launchdate,
      photo: listing.photo,
      gallery_images: listing.gallery_images,
      colors: listing.colors,
      battery_variants: listing.battery_variants,
      baas_variants: listing.baas_variants,
      has_baas: listing.has_baas,
      pros: listing.pros,
      cons: listing.cons,
      energy_comparison: listing.energy_comparison,
      battery_specs: listing.battery_specs,
      charging_specs: listing.charging_specs,
      body_type: listing.body_type || "",
    });
  };

  const startNew = () => {
    setEditing("new");
    setForm(emptyForm);
  };

  const handleSave = async () => {
    setSaving(true);
    const { body_type, ...rest } = form as any;
    const payload = {
      ...rest,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      ...(body_type ? { body_type } : {}),
    };

    let error;
    if (editing === "new") {
      const res = await supabase.from("evlistings").insert(payload);
      error = res.error;
      // If body_type column doesn't exist, retry without it
      if (error?.message?.includes("body_type")) {
        delete payload.body_type;
        const retry = await supabase.from("evlistings").insert(payload);
        error = retry.error;
      }
    } else {
      const res = await supabase.from("evlistings").update(payload).eq("id", editing);
      error = res.error;
      if (error?.message?.includes("body_type")) {
        delete payload.body_type;
        const retry = await supabase.from("evlistings").update(payload).eq("id", editing);
        error = retry.error;
      }
    }
    setSaving(false);
    if (error) {
      alert(`Save failed: ${error.message}\n\nDetails: ${error.details || error.hint || ""}`);
      return;
    }
    setEditing(null);
    fetchListings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await supabase.from("evlistings").delete().eq("id", id);
    fetchListings();
  };

  // ── Login Screen ──
  if (!user) {
    return <LoginScreen
      supabase={supabase}
      loginError={loginError}
      setLoginError={setLoginError}
      onSuccess={(u) => setUser(u)}
    />;
  }

  // ── Dashboard ──
  return (
    <div className="min-h-screen bg-slate-50 py-28 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">EV Listings</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors">
              <Plus size={16} /> Add Listing
            </button>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">{editing === "new" ? "New Listing" : "Edit Listing"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto-generated if empty" />
              <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              <Field label="Price (e.g. 5-10)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</span>
                <select value={form.types[0] || ""} onChange={(e) => setForm({ ...form, types: [e.target.value] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400">
                  <option value="">Select type</option>
                  <option value="2 Wheeler">2 Wheeler</option>
                  <option value="3 Wheeler">3 Wheeler</option>
                  <option value="4 Wheeler">4 Wheeler</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Body Type</span>
                <select value={(form as any).body_type || ""} onChange={(e) => setForm({ ...form, body_type: e.target.value } as any)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400">
                  <option value="">Select body type</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Compact SUV">Compact SUV</option>
                  <option value="MUV">MUV</option>
                  <option value="Bike">Bike</option>
                  <option value="Tempo">Tempo</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <Field label="Top Speed (km/h)" value={String(form.top_speed ?? "")} onChange={(v) => setForm({ ...form, top_speed: v ? Number(v) : null })} />
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Launch Date</span>
                <input type="date" value={form.launchdate ?? ""} onChange={(e) => setForm({ ...form, launchdate: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
              </label>
            </div>

            {/* Colors */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Colors (hex codes)</p>
                <button onClick={() => setForm({ ...form, colors: [...form.colors, ""] })}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700">+ Add Color</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colors.map((hex, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-md border border-slate-300" style={{ backgroundColor: hex.startsWith("#") ? hex : `#${hex}` }} />
                    <input value={hex} onChange={(e) => { const arr = [...form.colors]; arr[i] = e.target.value; setForm({ ...form, colors: arr }); }}
                      placeholder="FF5733" className="w-20 rounded-md border border-slate-200 px-2 py-1 text-[11px] outline-none" />
                    <button onClick={() => setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })}
                      className="text-rose-400 hover:text-rose-600 text-xs">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Pros</p>
                  <button onClick={() => setForm({ ...form, pros: [...form.pros, ""] })}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">+ Add</button>
                </div>
                {form.pros.map((pro, i) => (
                  <div key={i} className="flex items-center gap-1.5 mb-1.5">
                    <input value={pro} onChange={(e) => { const arr = [...form.pros]; arr[i] = e.target.value; setForm({ ...form, pros: arr }); }}
                      placeholder="Good range..." className="flex-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-[11px] outline-none" />
                    <button onClick={() => setForm({ ...form, pros: form.pros.filter((_, j) => j !== i) })}
                      className="text-rose-400 hover:text-rose-600 text-xs">×</button>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Things we dont like</p>
                  <button onClick={() => setForm({ ...form, cons: [...form.cons, ""] })}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700">+ Add</button>
                </div>
                {form.cons.map((con, i) => (
                  <div key={i} className="flex items-center gap-1.5 mb-1.5">
                    <input value={con} onChange={(e) => { const arr = [...form.cons]; arr[i] = e.target.value; setForm({ ...form, cons: arr }); }}
                      placeholder="Limited charging..." className="flex-1 rounded-md border border-amber-200 bg-white px-2 py-1.5 text-[11px] outline-none" />
                    <button onClick={() => setForm({ ...form, cons: form.cons.filter((_, j) => j !== i) })}
                      className="text-rose-400 hover:text-rose-600 text-xs">×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.commercial} onChange={(e) => setForm({ ...form, commercial: e.target.checked })} />
                Commercial
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.has_baas} onChange={(e) => setForm({ ...form, has_baas: e.target.checked })} />
                Has BAAS
              </label>
            </div>

            {/* ── Photo Upload ── */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Featured Photo</p>
              <div className="flex items-center gap-3">
                {form.photo && <img src={form.photo} alt="preview" className="h-16 w-20 rounded-lg object-cover border" />}
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const path = `evlistings/${form.slug || Date.now()}/${file.name}`;
                  const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });
                  if (data) {
                    const { data: urlData } = supabase.storage.from("evphotos").getPublicUrl(data.path);
                    setForm({ ...form, photo: urlData.publicUrl });
                  }
                }} className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 cursor-pointer hover:bg-slate-50 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600" />
                <Field label="" value={form.photo} onChange={(v) => setForm({ ...form, photo: v })} placeholder="Or paste URL" />
              </div>
            </div>

            {/* ── Gallery Upload ── */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Gallery Images</p>
              <div className="space-y-2 mb-3">
                {form.gallery_images.map((item, i) => {
                  // Support both old string format and new object format
                  const isObj = typeof item === "object" && item !== null;
                  const url = isObj ? (item as any).url : item;
                  const imgType = isObj ? (item as any).type || "" : "";
                  const colorCode = isObj ? (item as any).colorCode || "" : "";

                  return (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                      <img src={url} alt={`gallery ${i}`} className="h-12 w-16 rounded-md object-cover border shrink-0" />
                      <select value={imgType} onChange={(e) => {
                        const arr = [...form.gallery_images];
                        arr[i] = { url, type: e.target.value, colorCode } as any;
                        setForm({ ...form, gallery_images: arr });
                      }} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] outline-none">
                        <option value="">No tag</option>
                        <option value="color">Color</option>
                        <option value="interior">Interior</option>
                        <option value="exterior">Exterior</option>
                      </select>
                      {imgType === "color" && (
                        <div className="flex items-center gap-1">
                          <select value={colorCode} onChange={(e) => {
                            const arr = [...form.gallery_images];
                            arr[i] = { url, type: imgType, colorCode: e.target.value } as any;
                            setForm({ ...form, gallery_images: arr });
                          }} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] outline-none">
                            <option value="">Pick color</option>
                            {form.colors.map((c, ci) => (
                              <option key={ci} value={c}>{c}</option>
                            ))}
                            <option value="custom">Custom hex...</option>
                          </select>
                          {colorCode === "custom" || (colorCode && !form.colors.includes(colorCode)) ? (
                            <input value={colorCode === "custom" ? "" : colorCode} onChange={(e) => {
                              const arr = [...form.gallery_images];
                              arr[i] = { url, type: imgType, colorCode: e.target.value } as any;
                              setForm({ ...form, gallery_images: arr });
                            }} placeholder="hex" className="w-16 rounded-md border border-slate-200 px-1.5 py-1 text-[10px] outline-none" />
                          ) : colorCode ? (
                            <div className="h-5 w-5 rounded border border-slate-300" style={{ backgroundColor: colorCode.startsWith("#") ? colorCode : `#${colorCode}` }} />
                          ) : null}
                        </div>
                      )}
                      <button onClick={() => setForm({ ...form, gallery_images: form.gallery_images.filter((_, j) => j !== i) })}
                        className="ml-auto text-rose-400 hover:text-rose-600 text-xs font-bold shrink-0">×</button>
                    </div>
                  );
                })}
              </div>
              <input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                const newItems: any[] = [];
                for (const file of files) {
                  const path = `evlistings/${form.slug || Date.now()}/gallery-${Date.now()}-${file.name}`;
                  const { data } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });
                  if (data) {
                    const { data: urlData } = supabase.storage.from("evphotos").getPublicUrl(data.path);
                    newItems.push({ url: urlData.publicUrl, type: "", colorCode: "" });
                  }
                }
                setForm({ ...form, gallery_images: [...form.gallery_images, ...newItems] as any });
              }} className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 cursor-pointer hover:bg-slate-50 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-sky-600" />
            </div>

            {/* ── Battery Variants List ── */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Battery Variants</p>
                <button onClick={() => setForm({ ...form, battery_variants: [...form.battery_variants, { modelName: "", capacity: "", range: "", charge: "", price: "", has_baas: false } as any] })}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700">+ Add Variant</button>
              </div>
              {form.battery_variants.map((v: any, i: number) => (
                <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500">Variant {i + 1}</span>
                    <button onClick={() => setForm({ ...form, battery_variants: form.battery_variants.filter((_, j) => j !== i) })}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MiniInput label="Model Name" value={v.modelName || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).modelName = val; setForm({ ...form, battery_variants: arr }); }} />
                    <MiniInput label="Capacity (kWh)" value={v.capacity || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).capacity = val; setForm({ ...form, battery_variants: arr }); }} />
                    <MiniInput label="Range (km)" value={v.range || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).range = val; setForm({ ...form, battery_variants: arr }); }} />
                    <MiniInput label="Charge (min)" value={v.charge || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).charge = val; setForm({ ...form, battery_variants: arr }); }} />
                    <MiniInput label="Standard Price (Lakh)" value={v.price || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).price = val; setForm({ ...form, battery_variants: arr }); }} />
                    <MiniInput label="Max Power (bhp)" value={v.maxPower || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).maxPower = val; setForm({ ...form, battery_variants: arr }); }} />
                    <MiniInput label="Max Torque (Nm)" value={v.maxTorque || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).maxTorque = val; setForm({ ...form, battery_variants: arr }); }} />
                  </div>
                  <label className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                    <input type="checkbox" checked={!!(v as any).has_baas} onChange={(e) => { const arr = [...form.battery_variants]; (arr[i] as any).has_baas = e.target.checked; setForm({ ...form, battery_variants: arr }); }} />
                    This variant has BAAS option
                  </label>
                  {!!(v as any).has_baas && (
                    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 mb-2">BAAS Details (Battery Excluded)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <MiniInput label="Model Name" value={v.baas_modelName || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).baas_modelName = val; setForm({ ...form, battery_variants: arr }); }} />
                        <MiniInput label="₹/km Rate" value={v.price_baas || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).price_baas = val; setForm({ ...form, battery_variants: arr }); }} />
                        <MiniInput label="Upfront Price (₹)" value={v.baseprice || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).baseprice = val; setForm({ ...form, battery_variants: arr }); }} />
                        <MiniInput label="Charge Time (min)" value={v.baas_charge || v.charge || ""} onChange={(val) => { const arr = [...form.battery_variants]; (arr[i] as any).baas_charge = val; setForm({ ...form, battery_variants: arr }); }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Energy Comparison List ── */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Energy Comparison</p>
                <button onClick={() => setForm({ ...form, energy_comparison: [...form.energy_comparison, { name: "", fuelType: "", mileage: "", fuelPrice: "", modelused: "" } as any] })}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700">+ Add Entry</button>
              </div>
              {form.energy_comparison.map((c: any, i: number) => (
                <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500">Entry {i + 1}</span>
                    <button onClick={() => setForm({ ...form, energy_comparison: form.energy_comparison.filter((_, j) => j !== i) })}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MiniInput label="Name" value={c.name || ""} onChange={(val) => { const arr = [...form.energy_comparison]; (arr[i] as any).name = val; setForm({ ...form, energy_comparison: arr }); }} />
                    <label className="block">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Fuel Type</span>
                      <select value={c.fuelType || ""} onChange={(e) => { const arr = [...form.energy_comparison]; (arr[i] as any).fuelType = e.target.value; setForm({ ...form, energy_comparison: arr }); }}
                        className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-sky-400">
                        <option value="">Select</option>
                        <option value="self">Self (this EV)</option>
                        <option value="EV">EV (competitor)</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                      </select>
                    </label>
                    <MiniInput label="Mileage/Range" value={c.mileage || ""} onChange={(val) => { const arr = [...form.energy_comparison]; (arr[i] as any).mileage = val; setForm({ ...form, energy_comparison: arr }); }} />
                    <MiniInput label="Fuel Price (₹/km or ₹/L)" value={c.fuelPrice || ""} onChange={(val) => { const arr = [...form.energy_comparison]; (arr[i] as any).fuelPrice = val; setForm({ ...form, energy_comparison: arr }); }} />
                    <MiniInput label="Model Used" value={c.modelused || ""} onChange={(val) => { const arr = [...form.energy_comparison]; (arr[i] as any).modelused = val; setForm({ ...form, energy_comparison: arr }); }} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Battery Specs (Motor & Engine per variant) ── */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Battery / Motor Specs</p>
                <button onClick={() => setForm({ ...form, battery_specs: [...form.battery_specs, { variantName: "", electricMotor: "", maxPower: "", maxTorque: "", engine: "", emissionStandard: "", turboSupercharger: "0", idleStartStop: "0" } as any] })}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700">+ Add Variant Spec</button>
              </div>
              {form.battery_specs.map((s: any, i: number) => (
                <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500">Spec {i + 1}</span>
                    <button onClick={() => setForm({ ...form, battery_specs: form.battery_specs.filter((_, j) => j !== i) })}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MiniInput label="Variant Name" value={s.variantName || ""} onChange={(val) => { const arr = [...form.battery_specs]; (arr[i] as any).variantName = val; setForm({ ...form, battery_specs: arr }); }} />
                    <MiniInput label="Electric Motor" value={s.electricMotor || ""} onChange={(val) => { const arr = [...form.battery_specs]; (arr[i] as any).electricMotor = val; setForm({ ...form, battery_specs: arr }); }} />
                    <MiniInput label="Max Power (bhp@rpm)" value={s.maxPower || ""} onChange={(val) => { const arr = [...form.battery_specs]; (arr[i] as any).maxPower = val; setForm({ ...form, battery_specs: arr }); }} />
                    <MiniInput label="Max Torque (Nm@rpm)" value={s.maxTorque || ""} onChange={(val) => { const arr = [...form.battery_specs]; (arr[i] as any).maxTorque = val; setForm({ ...form, battery_specs: arr }); }} />
                    <MiniInput label="Engine" value={s.engine || ""} onChange={(val) => { const arr = [...form.battery_specs]; (arr[i] as any).engine = val; setForm({ ...form, battery_specs: arr }); }} />
                    <MiniInput label="Emission Standard" value={s.emissionStandard || ""} onChange={(val) => { const arr = [...form.battery_specs]; (arr[i] as any).emissionStandard = val; setForm({ ...form, battery_specs: arr }); }} />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-[11px] text-slate-600">
                      <input type="checkbox" checked={s.turboSupercharger === "1" || s.turboSupercharger === true} onChange={(e) => { const arr = [...form.battery_specs]; (arr[i] as any).turboSupercharger = e.target.checked ? "1" : "0"; setForm({ ...form, battery_specs: arr }); }} />
                      Turbo/Supercharger
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-600">
                      <input type="checkbox" checked={s.idleStartStop === "1" || s.idleStartStop === true} onChange={(e) => { const arr = [...form.battery_specs]; (arr[i] as any).idleStartStop = e.target.checked ? "1" : "0"; setForm({ ...form, battery_specs: arr }); }} />
                      Idle Start/Stop (IAC with ESS)
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charging Specs (per variant) ── */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Charging Specs</p>
                <button onClick={() => setForm({ ...form, charging_specs: [...form.charging_specs, { variantName: "", acRegularCharging: "", dcFastCharging: "", acFastCharging: "", drivingRange: "", chargingOptions: "", chargerIncluded: "0", chargerConnectionType: "" } as any] })}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700">+ Add Variant Spec</button>
              </div>
              {form.charging_specs.map((s: any, i: number) => (
                <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500">Spec {i + 1}</span>
                    <button onClick={() => setForm({ ...form, charging_specs: form.charging_specs.filter((_, j) => j !== i) })}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MiniInput label="Variant Name" value={s.variantName || ""} onChange={(val) => { const arr = [...form.charging_specs]; (arr[i] as any).variantName = val; setForm({ ...form, charging_specs: arr }); }} />
                    <MiniInput label="AC Regular Charging" value={s.acRegularCharging || ""} onChange={(val) => { const arr = [...form.charging_specs]; (arr[i] as any).acRegularCharging = val; setForm({ ...form, charging_specs: arr }); }} />
                    <MiniInput label="DC Fast Charging" value={s.dcFastCharging || ""} onChange={(val) => { const arr = [...form.charging_specs]; (arr[i] as any).dcFastCharging = val; setForm({ ...form, charging_specs: arr }); }} />
                    <MiniInput label="AC Fast Charging" value={s.acFastCharging || ""} onChange={(val) => { const arr = [...form.charging_specs]; (arr[i] as any).acFastCharging = val; setForm({ ...form, charging_specs: arr }); }} />
                    <MiniInput label="Driving Range" value={s.drivingRange || ""} onChange={(val) => { const arr = [...form.charging_specs]; (arr[i] as any).drivingRange = val; setForm({ ...form, charging_specs: arr }); }} />
                    <MiniInput label="Charging Options" value={s.chargingOptions || ""} onChange={(val) => { const arr = [...form.charging_specs]; (arr[i] as any).chargingOptions = val; setForm({ ...form, charging_specs: arr }); }} />
                    <MiniInput label="Charger Connection Type" value={s.chargerConnectionType || ""} onChange={(val) => { const arr = [...form.charging_specs]; (arr[i] as any).chargerConnectionType = val; setForm({ ...form, charging_specs: arr }); }} />
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
                    <input type="checkbox" checked={s.chargerIncluded === "1" || s.chargerIncluded === "Yes" || s.chargerIncluded === true} onChange={(e) => { const arr = [...form.charging_specs]; (arr[i] as any).chargerIncluded = e.target.checked ? "Yes" : "No"; setForm({ ...form, charging_specs: arr }); }} />
                    Charger Included with Vehicle
                  </label>
                </div>
              ))}
            </div>

            <button onClick={handleSave} disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editing === "new" ? "Create Listing" : "Save Changes"}
            </button>
          </div>
        )}

        {/* Listings Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase">Vehicle</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase">Brand</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase">Price</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{l.title}</td>
                    <td className="px-4 py-3 text-slate-600">{l.brand}</td>
                    <td className="px-4 py-3 text-slate-600">₹{l.price} L</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(l)} className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 mr-3">
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600">
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {listings.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No listings yet. Add your first one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
      />
    </label>
  );
}

function MiniInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-sky-400"
      />
    </label>
  );
}

// ── Login Screen with Password, OTP, and Forgot Password ─────────────────────

type LoginMode = "password" | "otp" | "forgot";

function LoginScreen({ supabase, loginError, setLoginError, onSuccess }: {
  supabase: any;
  loginError: string;
  setLoginError: (v: string) => void;
  onSuccess: (user: any) => void;
}) {
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoginError(error.message); setLoading(false); return; }
    onSuccess(data.user);
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) { setLoginError(error.message); setLoading(false); return; }
    setMessage("Check your email for the login link or code.");
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) { setLoginError(error.message); setLoading(false); return; }
    onSuccess(data.user);
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/team`,
    });
    if (error) { setLoginError(error.message); setLoading(false); return; }
    setMessage("Password reset link sent to your email.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Team Login</h1>
        <p className="text-sm text-slate-500 mb-6">Access the EV Listings dashboard</p>

        {loginError && <p className="text-sm text-rose-600 mb-4 rounded-lg bg-rose-50 px-3 py-2">{loginError}</p>}
        {message && <p className="text-sm text-emerald-600 mb-4 rounded-lg bg-emerald-50 px-3 py-2">{message}</p>}

        {/* Mode tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 mb-6">
          <button onClick={() => { setMode("password"); setLoginError(""); setMessage(""); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${mode === "password" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            Password
          </button>
          <button onClick={() => { setMode("otp"); setLoginError(""); setMessage(""); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${mode === "otp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            Email OTP
          </button>
        </div>

        {/* Password login */}
        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 transition-colors disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button type="button" onClick={() => { setMode("forgot"); setLoginError(""); setMessage(""); }}
              className="w-full text-center text-xs text-sky-600 hover:text-sky-700 font-medium">
              Forgot password?
            </button>
          </form>
        )}

        {/* OTP login */}
        {mode === "otp" && !message && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 transition-colors disabled:opacity-50">
              {loading ? "Sending..." : "Send Login Code"}
            </button>
          </form>
        )}

        {/* OTP verification */}
        {mode === "otp" && message && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enter 6-digit code</span>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required
                maxLength={6} inputMode="numeric" placeholder="000000"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-center font-mono tracking-[0.5em] outline-none focus:border-sky-400" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button type="button" onClick={() => setMessage("")}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700">
              Resend code
            </button>
          </form>
        )}

        {/* Forgot password */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-sky-600 transition-colors disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => { setMode("password"); setMessage(""); }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700">
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
