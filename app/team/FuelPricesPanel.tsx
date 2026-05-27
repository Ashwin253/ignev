"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";

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

export default function FuelPricesPanel({ supabase, userEmail }: { supabase: any; userEmail: string }) {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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

  if (loading) return <div className="text-center py-12 text-slate-400">Loading prices...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Update fuel & electricity prices per city. These are used in Energy comparisons and Cost Estimator.</p>
        <button onClick={addCity} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-sky-700">
          <Plus size={12} /> Add City
        </button>
      </div>

      {prices.map((p) => (
        <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">{p.city}</h3>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-slate-400">Last updated: {p.updated_by_email ? `${p.updated_by_email} · ` : ""}{new Date(p.updated_at).toLocaleDateString()}</p>
              <button onClick={() => deleteCity(p.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14} /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">⛽ Petrol (₹/L)</span>
              <input type="number" step="0.01" value={p.petrol_per_litre} onChange={(e) => updatePrice(p.id, "petrol_per_litre", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-sky-400" />
            </label>
            <label className="block">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">🛢️ Diesel (₹/L)</span>
              <input type="number" step="0.01" value={p.diesel_per_litre} onChange={(e) => updatePrice(p.id, "diesel_per_litre", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-sky-400" />
            </label>
            <label className="block">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">🔵 CNG (₹/kg)</span>
              <input type="number" step="0.01" value={p.cng_per_kg} onChange={(e) => updatePrice(p.id, "cng_per_kg", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-sky-400" />
            </label>
            <label className="block">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">⚡ Electricity (₹/kWh)</span>
              <input type="number" step="0.01" value={p.electricity_per_kwh} onChange={(e) => updatePrice(p.id, "electricity_per_kwh", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-sky-400" />
            </label>
          </div>
          <button onClick={() => savePrice(p)} disabled={saving === p.id}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving === p.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Prices
          </button>
        </div>
      ))}

      {prices.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">No cities added. Click "Add City" to start.</div>
      )}
    </div>
  );
}
