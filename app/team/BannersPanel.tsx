"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Loader2, GripVertical } from "lucide-react";

export type HeroBanner = {
  id?: string;
  cta: string;
  href: string;
  details: string;
  image_horizontal: string;
  image_vertical: string;
  video_url: string;
  is_active: boolean;
  label?: string;
};

const emptyBanner: HeroBanner = {
  cta: "",
  href: "",
  details: "",
  image_horizontal: "",
  image_vertical: "",
  video_url: "",
  is_active: true,
  label: "",
};

export default function BannersPanel({ supabase }: { supabase: any }) {
  const [banners, setBanners] = useState<(HeroBanner & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<HeroBanner>(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image_horizontal" | "image_vertical" | "video_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    const path = `banners/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "")}`;
    const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });

    if (error) {
      alert("Upload failed: " + error.message);
    } else if (data) {
      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
      setForm({ ...form, [field]: publicUrl });
    }
    setUploadingField(null);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("hero_banners").select("*").order("created_at", { ascending: false });
    if (error) console.warn("Fetch banners error:", error.message);
    setBanners((data ?? []) as any);
    setLoading(false);
  };

  const startNew = () => {
    setEditing("new");
    setForm({ ...emptyBanner });
  };

  const startEdit = (b: HeroBanner & { id: string }) => {
    setEditing(b.id);
    setForm(b);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form };
    delete (payload as any).id;

    if (editing === "new") {
      const { error } = await supabase.from("hero_banners").insert(payload);
      if (error) { alert(`Save failed: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("hero_banners").update(payload).eq("id", editing);
      if (error) { alert(`Update failed: ${error.message}`); setSaving(false); return; }
    }
    setSaving(false);
    setEditing(null);
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("hero_banners").delete().eq("id", id);
    fetchBanners();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">{banners.length}</span> banners</p>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700">
          <Plus size={12} /> Add Banner
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-sky-700">{editing === "new" ? "New Banner" : "Edit Banner"}</p>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block"><span className="text-xs font-bold text-slate-600">Call to Action (CTA)</span><input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="e.g. Explore catalog" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Link URL (href)</span><input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="e.g. /catalog" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-600">Badge Label (Optional)</span>
              <input list="banner-labels" value={form.label || ""} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. New Release, Coming Soon" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
              <datalist id="banner-labels">
                <option value="New Release" />
                <option value="Recently Announced" />
                <option value="Coming Soon" />
                <option value="New Offer" />
              </datalist>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-600">Video URL (.mp4 or similar)</span>
              <div className="flex gap-2">
                <input value={form.video_url || ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="e.g. https://.../video.mp4 (Takes priority over images)" className="mt-1 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-sky-50" />
                <label className="mt-1 flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-200 shrink-0">
                  {uploadingField === "video_url" ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => handleUpload(e, "video_url")} />
                </label>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Image (Horizontal / Desktop)</span>
              <div className="flex gap-2">
                <input value={form.image_horizontal} onChange={(e) => setForm({ ...form, image_horizontal: e.target.value })} placeholder="e.g. /herobanner/banner-1.webp" className="mt-1 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                <label className="mt-1 flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-200 shrink-0">
                  {uploadingField === "image_horizontal" ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "image_horizontal")} />
                </label>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Image (Vertical / Mobile)</span>
              <div className="flex gap-2">
                <input value={form.image_vertical} onChange={(e) => setForm({ ...form, image_vertical: e.target.value })} placeholder="e.g. /herobanner/banner-1-mob.webp" className="mt-1 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                <label className="mt-1 flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-200 shrink-0">
                  {uploadingField === "image_vertical" ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "image_vertical")} />
                </label>
              </div>
            </label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Details (Optional Text)</span><input value={form.details || ""} onChange={(e) => setForm({ ...form, details: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>
      )}

      {loading ? <p className="text-slate-400 text-sm text-center py-8">Loading banners...</p> : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {banners.map((b) => (
            <div key={b.id} className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 ${!b.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4">
                <GripVertical size={16} className="text-slate-300 cursor-grab" />
                <div className="h-12 w-20 rounded bg-slate-100 overflow-hidden relative shrink-0">
                  {b.image_horizontal && <img src={b.image_horizontal} alt={b.cta} className="object-cover w-full h-full" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{b.cta || "(No CTA)"}</p>
                  <p className="text-xs text-slate-500">Links to: {b.href}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(b)} className="text-[10px] text-slate-500 font-bold hover:text-sky-600"><Pencil size={12} /></button>
                <button onClick={() => handleDelete(b.id)} className="text-[10px] text-slate-500 font-bold hover:text-rose-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No banners configured</p>}
        </div>
      )}
    </div>
  );
}
