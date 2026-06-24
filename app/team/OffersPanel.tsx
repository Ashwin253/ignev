"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Loader2, Tag } from "lucide-react";

export type Offer = {
  id?: string;
  brand: string;
  text: string;
  image: string;
  cities: string;
  product_slug: string;
  is_active: boolean;
};

const emptyOffer: Offer = {
  brand: "",
  text: "",
  image: "",
  cities: "",
  product_slug: "",
  is_active: true,
};

export default function OffersPanel({ supabase }: { supabase: any }) {
  const [offers, setOffers] = useState<(Offer & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Offer>(emptyOffer);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    if (error) console.warn("Fetch offers error:", error.message);
    setOffers((data ?? []) as any);
    setLoading(false);
  };

  const startNew = () => {
    setEditing("new");
    setForm({ ...emptyOffer });
  };

  const startEdit = (o: Offer & { id: string }) => {
    setEditing(o.id);
    setForm({ ...emptyOffer, ...o });
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      brand: form.brand.trim() || null,
      text: form.text.trim(),
      image: form.image.trim() || null,
      cities: form.cities.trim() || null,
      product_slug: form.product_slug.trim() || null,
      is_active: form.is_active,
    };

    if (editing === "new") {
      const { error } = await supabase.from("offers").insert(payload);
      if (error) { alert(`Save failed: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("offers").update(payload).eq("id", editing);
      if (error) { alert(`Update failed: ${error.message}`); setSaving(false); return; }
    }
    setSaving(false);
    setEditing(null);
    fetchOffers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    await supabase.from("offers").delete().eq("id", id);
    fetchOffers();
  };

  const filtered = offers.filter((o) =>
    o.brand?.toLowerCase().includes(search.toLowerCase()) ||
    o.text?.toLowerCase().includes(search.toLowerCase()) ||
    o.product_slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">{offers.length}</span> active offers</p>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700">
          <Plus size={12} /> Add Offer
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-sky-700">{editing === "new" ? "New Offer" : "Edit Offer"}</p>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block"><span className="text-xs font-bold text-slate-600">Brand (e.g., Tata, MG)</span><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Leave empty if not brand-specific" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Product Slug (e.g., tata-nexon-ev)</span><input value={form.product_slug} onChange={(e) => setForm({ ...form, product_slug: e.target.value })} placeholder="Leave empty to apply to all cars in the brand" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Offer Text / Description *</span><input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="e.g. ₹50,000 Cash Discount + Free Charger" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Image / Banner URL (Optional)</span><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Applicable Cities (Optional, comma separated)</span><input value={form.cities} onChange={(e) => setForm({ ...form, cities: e.target.value })} placeholder="e.g. Mumbai, Delhi" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search offers..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />

      {loading ? <p className="text-slate-400 text-sm text-center py-8">Loading offers...</p> : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mt-4">
          {filtered.map((o) => (
            <div key={o.id} className={`flex items-start justify-between px-4 py-4 border-b border-slate-100 last:border-0 ${!o.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-start gap-4">
                <Tag size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{o.text}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {o.brand && <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Brand: {o.brand}</span>}
                    {o.product_slug && <span className="inline-flex rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Model: {o.product_slug}</span>}
                    {o.cities && <span className="inline-flex rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Cities: {o.cities}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(o)} className="text-[10px] text-slate-500 font-bold hover:text-sky-600"><Pencil size={12} /></button>
                <button onClick={() => handleDelete(o.id)} className="text-[10px] text-slate-500 font-bold hover:text-rose-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No offers found</p>}
        </div>
      )}
    </div>
  );
}
