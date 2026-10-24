"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Loader2, Tag, CalendarDays } from "lucide-react";

export type Offer = {
  id?: string;
  brand: string;
  text: string;
  image: string;
  cities: string;
  product_slug: string;
  is_active: boolean;
  valid_until?: string;
};

const emptyOffer: Offer = {
  brand: "",
  text: "",
  image: "",
  cities: "",
  product_slug: "",
  is_active: true,
  valid_until: "",
};

export default function OffersPanel({ supabase, uniqueBrands = [] }: { supabase: any; uniqueBrands?: string[] }) {
  const [offers, setOffers] = useState<(Offer & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Offer>(emptyOffer);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dealerOfferCounts, setDealerOfferCounts] = useState<Record<string, number>>({});

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const path = `offers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "")}`;
    const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });

    if (error) {
      alert("Upload failed: " + error.message);
    } else if (data) {
      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
      setForm({ ...form, image: publicUrl });
    }
    setUploadingImage(false);
  };

  useEffect(() => {
    fetchOffers();
    fetchDealerOfferCounts();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    if (error) console.warn("Fetch offers error:", error.message);
    setOffers((data ?? []) as any);
    setLoading(false);
  };

  const fetchDealerOfferCounts = async () => {
    const { data, error } = await supabase.from("ev_dealers").select("offer_ids");
    if (error) {
      console.warn("Fetch dealer offer links error:", error.message);
      return;
    }
    const counts: Record<string, number> = {};
    (data ?? []).forEach((dealer: any) => {
      (Array.isArray(dealer.offer_ids) ? dealer.offer_ids : []).forEach((offerId: string) => {
        const key = String(offerId);
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    setDealerOfferCounts(counts);
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
      valid_until: form.valid_until || null,
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
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
          <Plus size={12} /> Add Offer
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-emerald-700">{editing === "new" ? "New Offer" : "Edit Offer"}</p>
            <button onClick={() => setEditing(null)} className="text-ink-mute hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Brand (e.g., Tata, MG)</span>
              <select value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-white cursor-pointer">
                <option value="">None (Applies to all brands)</option>
                {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Product Slug (e.g., tata-nexon-ev)</span><input value={form.product_slug || ""} onChange={(e) => setForm({ ...form, product_slug: e.target.value })} placeholder="Leave empty to apply to all cars in the brand" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Offer Text / Description *</span><input value={form.text || ""} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="e.g. ₹50,000 Cash Discount + Free Charger" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-600">Image / Banner (Optional)</span>
              <div className="flex gap-2">
                <input value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="e.g. /offers/offer-1.webp" className="mt-1 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                <label className="mt-1 flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-200 shrink-0">
                  {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Valid Until (Optional)</span><input type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-white" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Applicable Cities (Optional, comma separated)</span><input value={form.cities || ""} onChange={(e) => setForm({ ...form, cities: e.target.value })} placeholder="e.g. Mumbai, Delhi" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search offers..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand" />

      {loading ? <p className="text-ink-mute text-sm text-center py-8">Loading offers...</p> : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mt-4">
          {filtered.map((o) => (
            <div key={o.id} className={`flex items-start justify-between px-4 py-4 border-b border-slate-100 last:border-0 ${!o.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-start gap-4">
                <Tag size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{o.text}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {o.brand && <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Brand: {o.brand}</span>}
                    {o.product_slug && <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Model: {o.product_slug}</span>}
                    {o.cities && <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Cities: {o.cities}</span>}
                    {o.valid_until && <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700"><CalendarDays size={10} /> Valid till: {new Date(o.valid_until).toLocaleDateString()}</span>}
                    {(dealerOfferCounts[o.id] || 0) > 0 && <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{dealerOfferCounts[o.id]} dealer location{dealerOfferCounts[o.id] === 1 ? "" : "s"}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(o)} className="text-[10px] text-ink-mute font-bold hover:text-emerald-600"><Pencil size={12} /></button>
                <button onClick={() => handleDelete(o.id)} className="text-[10px] text-ink-mute font-bold hover:text-rose-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-ink-mute text-center py-8">No offers found</p>}
        </div>
      )}
    </div>
  );
}
