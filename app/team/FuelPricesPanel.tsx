"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Loader2, Copy, Clipboard, Download, Sparkles, Check } from "lucide-react";

type FuelPrice = {
  id: string;
  city: string;
  petrol_per_litre: number;
  diesel_per_litre: number;
  cng_per_kg: number;
  electricity_per_kwh: number;
  updated_by_email: string;
  updated_at: string;
};

const LOOKUP_CITIES = [
  { value: "delhi", label: "Delhi" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bangalore", label: "Bangalore" },
  { value: "chennai", label: "Chennai" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "pune", label: "Pune" },
  { value: "kolkata", label: "Kolkata" },
  { value: "ahmedabad", label: "Ahmedabad" },
  { value: "jaipur", label: "Jaipur" },
  { value: "kochi", label: "Kochi" },
];

export default function FuelPricesPanel({ supabase, userEmail }: { supabase: any; userEmail: string }) {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Live Lookup Card State
  const [lookupCity, setLookupCity] = useState("delhi");
  const [fetchingLive, setFetchingLive] = useState(false);
  const [liveData, setLiveData] = useState<{ petrol: number; diesel: number; cng: number; electricity: number; city: string; source: string } | null>(null);
  const [applyingLive, setApplyingLive] = useState(false);

  useEffect(() => { fetchPrices(); }, []);

  const fetchPrices = async () => {
    setLoading(true);
    const { data } = await supabase.from("fuel_prices").select("*").order("city");
    setPrices((data ?? []) as FuelPrice[]);
    setLoading(false);
  };

  const updatePrice = async (id: string, field: string, value: number) => {
    const arr = [...prices];
    const idx = arr.findIndex((p) => p.id === id);
    if (idx >= 0) (arr[idx] as any)[field] = value;
    setPrices(arr);
  };

  const savePrice = async (price: FuelPrice) => {
    setSaving(price.id);
    await supabase.from("fuel_prices").update({
      petrol_per_litre: price.petrol_per_litre,
      diesel_per_litre: price.diesel_per_litre,
      cng_per_kg: price.cng_per_kg,
      electricity_per_kwh: price.electricity_per_kwh,
      updated_by_email: userEmail,
      updated_at: new Date().toISOString(),
    }).eq("id", price.id);
    setSaving(null);
    fetchPrices();
  };

  const addCity = async () => {
    const city = prompt("Enter city name:");
    if (!city) return;
    await supabase.from("fuel_prices").insert({ city, updated_by_email: userEmail });
    fetchPrices();
  };

  const deleteCity = async (id: string) => {
    if (!confirm("Delete this city's prices?")) return;
    await supabase.from("fuel_prices").delete().eq("id", id);
    fetchPrices();
  };

  // Copy JSON Helper
  const handleCopyJSON = () => {
    const formatted = prices.map(p => ({
      city: p.city,
      petrol_per_litre: p.petrol_per_litre,
      diesel_per_litre: p.diesel_per_litre,
      cng_per_kg: p.cng_per_kg,
      electricity_per_kwh: p.electricity_per_kwh,
    }));
    navigator.clipboard.writeText(JSON.stringify(formatted, null, 2))
      .then(() => alert("Fuel prices copied to clipboard!"))
      .catch((err) => alert("Failed to copy prices: " + err));
  };

  // Paste JSON Helper
  const handlePasteJSON = async () => {
    const text = prompt("Paste your fuel prices JSON here:");
    if (!text) return;
    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }
      const parsed = JSON.parse(cleanedText);
      const list = Array.isArray(parsed) ? parsed : [];
      if (!list.length) {
        alert("Invalid format: Must be a non-empty array of objects.");
        return;
      }

      setLoading(true);
      for (const item of list) {
        const cityName = String(item.city || "").trim();
        if (!cityName) continue;

        // Check if city exists
        const { data: existing } = await supabase
          .from("fuel_prices")
          .select("id")
          .eq("city", cityName)
          .maybeSingle();

        const payload = {
          petrol_per_litre: Number(item.petrol_per_litre ?? 100),
          diesel_per_litre: Number(item.diesel_per_litre ?? 90),
          cng_per_kg: Number(item.cng_per_kg ?? 85),
          electricity_per_kwh: Number(item.electricity_per_kwh ?? 8),
          updated_by_email: userEmail,
          updated_at: new Date().toISOString()
        };

        if (existing?.id) {
          await supabase.from("fuel_prices").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("fuel_prices").insert({
            city: cityName,
            ...payload
          });
        }
      }
      alert("Fuel prices successfully imported/updated!");
      fetchPrices();
    } catch (e: any) {
      alert("Error parsing JSON: " + e.message);
      setLoading(false);
    }
  };

  // Fetch Live Price Lookup API
  const handleFetchLivePrice = async () => {
    setFetchingLive(true);
    try {
      const res = await fetch(`/api/team/live-fuel-prices?city=${lookupCity}`);
      if (!res.ok) throw new Error("Failed to fetch live prices");
      const data = await res.json();
      setLiveData(data);
    } catch (err: any) {
      alert("Error fetching live price: " + err.message);
    } finally {
      setFetchingLive(false);
    }
  };

  // Apply Live Fetched Values to Database City
  const handleApplyLivePrice = async () => {
    if (!liveData) return;
    setApplyingLive(true);
    try {
      // Find if selected city exists in Supabase
      const { data: existing } = await supabase
        .from("fuel_prices")
        .select("id")
        .eq("city", liveData.city)
        .maybeSingle();

      const payload = {
        petrol_per_litre: liveData.petrol,
        diesel_per_litre: liveData.diesel,
        cng_per_kg: liveData.cng,
        electricity_per_kwh: liveData.electricity,
        updated_by_email: userEmail,
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        await supabase.from("fuel_prices").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("fuel_prices").insert({
          city: liveData.city,
          ...payload
        });
      }
      alert(`Applied live prices to ${liveData.city}!`);
      setLiveData(null);
      fetchPrices();
    } catch (err: any) {
      alert("Failed to apply prices: " + err.message);
    } finally {
      setApplyingLive(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-ink-mute">Loading prices...</div>;

  return (
    <div className="space-y-6">
      {/* Live Lookup Card */}
      <div className="rounded-2xl border-2 border-brand bg-emerald-50/50 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-emerald-600 w-5 h-5 animate-pulse" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800">Live Indian Fuel Price Lookup</h2>
        </div>
        <p className="text-xs text-emerald-700/80 mb-4">Query real-time average rates for petrol, diesel, and CNG across Indian cities (or fall back to curated averages).</p>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={lookupCity}
            onChange={(e) => setLookupCity(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-lg border border-emerald-200 bg-white font-bold text-slate-700 outline-none cursor-pointer focus:border-emerald-500"
          >
            {LOOKUP_CITIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={handleFetchLivePrice}
            disabled={fetchingLive}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
          >
            {fetchingLive ? <Loader2 size={12} className="animate-spin" /> : "Fetch Prices"}
          </button>
        </div>

        {liveData && (
          <div className="mt-4 p-4 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">{liveData.city} Prices</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${liveData.source === "live" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                Source: {liveData.source === "live" ? "Live Scraping" : "Curated Fallback"}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="block text-[9px] font-extrabold text-ink-mute uppercase">Petrol</span>
                <span className="text-sm font-black text-slate-800">₹ {liveData.petrol.toFixed(2)}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="block text-[9px] font-extrabold text-ink-mute uppercase">Diesel</span>
                <span className="text-sm font-black text-slate-800">₹ {liveData.diesel.toFixed(2)}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="block text-[9px] font-extrabold text-ink-mute uppercase">CNG</span>
                <span className="text-sm font-black text-slate-800">₹ {liveData.cng.toFixed(2)}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="block text-[9px] font-extrabold text-ink-mute uppercase">Electricity</span>
                <span className="text-sm font-black text-slate-800">₹ {liveData.electricity.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setLiveData(null)}
                className="text-xs font-bold text-ink-mute hover:text-slate-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyLivePrice}
                disabled={applyingLive}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-extrabold text-white"
              >
                {applyingLive ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Apply to {liveData.city}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main City Table Panel Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800">City-wise Saved Prices</h2>
          <p className="text-xs text-ink-mute mt-0.5">Manage rates used across model comparators and calculator modules.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCopyJSON} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer">
            <Copy size={13} /> Copy JSON
          </button>
          <button onClick={handlePasteJSON} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer">
            <Clipboard size={13} /> Paste JSON
          </button>
          <button onClick={addCity} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-extrabold text-ink hover:bg-white shadow-2xs cursor-pointer">
            <Plus size={13} /> Add City
          </button>
        </div>
      </div>

      {prices.map((p) => (
        <div key={p.id} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">{p.city}</h3>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-bold text-ink-mute">Last updated: {p.updated_by_email ? `${p.updated_by_email} · ` : ""}{new Date(p.updated_at).toLocaleDateString()}</p>
              <button onClick={() => deleteCity(p.id)} className="text-coral hover:text-rose-600 cursor-pointer"><Trash2 size={14} /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">⛽ Petrol (₹/L)</span>
              <input type="number" step="0.01" value={p.petrol_per_litre} onChange={(e) => updatePrice(p.id, "petrol_per_litre", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-brand focus:ring-1 focus:ring-emerald-400" />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">🛢️ Diesel (₹/L)</span>
              <input type="number" step="0.01" value={p.diesel_per_litre} onChange={(e) => updatePrice(p.id, "diesel_per_litre", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-brand" />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">🔵 CNG (₹/kg)</span>
              <input type="number" step="0.01" value={p.cng_per_kg} onChange={(e) => updatePrice(p.id, "cng_per_kg", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-brand" />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">⚡ Electricity (₹/kWh)</span>
              <input type="number" step="0.01" value={p.electricity_per_kwh} onChange={(e) => updatePrice(p.id, "electricity_per_kwh", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-brand" />
            </label>
          </div>
          <button onClick={() => savePrice(p)} disabled={saving === p.id}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs">
            {saving === p.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Prices
          </button>
        </div>
      ))}

      {prices.length === 0 && (
        <div className="text-center py-8 text-ink-mute text-sm border-2 border-dashed border-slate-200 rounded-2xl">No cities added. Click "Add City" to start.</div>
      )}
    </div>
  );
}
