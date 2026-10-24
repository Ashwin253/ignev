"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Loader2, GripVertical, ArrowUp, ArrowDown, Crop, Smartphone } from "lucide-react";
import BannerCropModal, { BannerCropField } from "./BannerCropModal";

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
  order_index?: number;
  background_color?: string;
  text_color?: string;
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
  background_color: "#000000",
  text_color: "#ffffff",
};

export default function BannersPanel({ supabase }: { supabase: any }) {
  const [banners, setBanners] = useState<(HeroBanner & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<HeroBanner>(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [cropModalData, setCropModalData] = useState<{
    url: string;
    field: BannerCropField;
  } | null>(null);
  // "hero" = normal hero slider banners | "offer_popup" = BestOfferPopup banner
  const [panelMode, setPanelMode] = useState<"hero" | "offer_popup">("hero");

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
  }, [panelMode]);

  const fetchBanners = async () => {
    setLoading(true);
    let query = supabase
      .from("hero_banners")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (panelMode === "offer_popup") {
      query = query.eq("label", "offer_popup");
    } else {
      // Hero banners: exclude the offer_popup label
      query = query.or("label.is.null,label.neq.offer_popup");
    }

    const { data, error } = await query;
    if (error) console.warn("Fetch banners error:", error.message);
    setBanners((data ?? []) as any);
    setLoading(false);
  };

  const moveBanner = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= banners.length) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index + direction];
    newBanners[index + direction] = temp;
    setBanners(newBanners);
    const updates = newBanners.map((b, i) => ({ id: b.id, order_index: i }));
    const { error } = await supabase.from("hero_banners").upsert(updates);
    if (error) {
      alert("Failed to save new order: " + error.message);
      fetchBanners();
    }
  };

  const handleConvertToAvif = async (field: "image_horizontal" | "image_vertical", currentUrl: string) => {
    if (!currentUrl) return;
    if (!confirm(`Are you sure you want to convert this image to AVIF?`)) return;
    
    setUploadingField(field + "_converting");
    try {
      const fullUrl = currentUrl.startsWith("http")
        ? currentUrl
        : `${window.location.origin}${currentUrl.startsWith("/") ? "" : "/"}${currentUrl}`;

      const res = await fetch("/api/convert-to-avif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: fullUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to convert image.");
      }
      const avifBlob = await res.blob();
      const path = `banners/${Date.now()}-converted.avif`;
      const { data, error } = await supabase.storage
        .from("evphotos")
        .upload(path, new File([avifBlob], "converted.avif", { type: "image/avif" }), { upsert: true });
      if (error) throw new Error(error.message);
      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
      setForm({ ...form, [field]: publicUrl });
    } catch (err: any) {
      alert("AVIF conversion failed: " + err.message);
    }
    setUploadingField(null);
  };

  const startNew = () => {
    setEditing("new");
    setForm({
      ...emptyBanner,
      label: panelMode === "offer_popup" ? "offer_popup" : "",
    });
  };

  const startEdit = (b: HeroBanner & { id: string }) => {
    setEditing(b.id);
    setForm(b);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form };
    delete (payload as any).id;
    delete (payload as any).cta_color;

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
      {/* ── Mode Toggle ── */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 w-fit">
        <button
          onClick={() => { setPanelMode("hero"); setEditing(null); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${panelMode === "hero" ? "bg-white text-ink shadow-sm" : "text-ink-mute hover:text-slate-800"}`}
        >
          🖼️ Hero Banners
        </button>
        <button
          onClick={() => { setPanelMode("offer_popup"); setEditing(null); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${panelMode === "offer_popup" ? "bg-emerald-600 text-white shadow-sm" : "text-ink-mute hover:text-slate-800"}`}
        >
          🎁 Offer Popup
        </button>
      </div>

      {/* ── Mode description ── */}
      {panelMode === "offer_popup" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 leading-relaxed">
          <strong>Offer Popup banner</strong> — This controls the photo and title shown in the "Get Best Offer" popup that appears on every page. Set the <strong>CTA</strong> field as the popup title, <strong>Details</strong> as the subtitle, and upload a <strong>Horizontal image</strong> as the background photo. Only the first active entry is used. Leave empty to use the default green gradient.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-bold text-slate-900">{banners.length}</span>{" "}
          {panelMode === "offer_popup" ? "offer popup banner" : "banner"}{banners.length !== 1 ? "s" : ""}
        </p>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
          <Plus size={12} /> {panelMode === "offer_popup" ? "Set Offer Popup" : "Add Banner"}
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-emerald-700">{editing === "new" ? "New Banner" : "Edit Banner"}</p>
            <button onClick={() => setEditing(null)} className="text-ink-mute hover:text-slate-600"><X size={16} /></button>
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
                <input value={form.video_url || ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="e.g. https://.../video.mp4 (Takes priority over images)" className="mt-1 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-emerald-50" />
                <label className="mt-1 flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-200 shrink-0">
                  {uploadingField === "video_url" ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => handleUpload(e, "video_url")} />
                </label>
              </div>
            </label>

            {/* Desktop / Horizontal Image */}
            <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Image (Horizontal / Desktop)</span>
                {form.image_horizontal?.toLowerCase().endsWith(".avif") && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    AVIF
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={form.image_horizontal}
                  onChange={(e) => setForm({ ...form, image_horizontal: e.target.value })}
                  placeholder="e.g. /herobanner/banner-1.webp"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-slate-50"
                />
                <label className="flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-200 shrink-0">
                  {uploadingField === "image_horizontal" ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "image_horizontal")} />
                </label>
              </div>

              {form.image_horizontal && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCropModalData({ url: form.image_horizontal, field: "image_horizontal" })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Crop size={14} /> Crop, Resize &amp; Add Space
                  </button>
                  {!form.image_horizontal.toLowerCase().endsWith(".avif") && (
                    <button
                      type="button"
                      onClick={() => handleConvertToAvif("image_horizontal", form.image_horizontal)}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0 transition-colors"
                    >
                      {uploadingField === "image_horizontal_converting" ? <Loader2 size={14} className="animate-spin" /> : "To AVIF"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile / Vertical Image */}
            <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Image (Vertical / Mobile)</span>
                {form.image_vertical?.toLowerCase().endsWith(".avif") && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    AVIF
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={form.image_vertical}
                  onChange={(e) => setForm({ ...form, image_vertical: e.target.value })}
                  placeholder="e.g. /herobanner/banner-1-mob.webp"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-slate-50"
                />
                <label className="flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-200 shrink-0">
                  {uploadingField === "image_vertical" ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "image_vertical")} />
                </label>
              </div>

              {(form.image_vertical || form.image_horizontal) && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setCropModalData({
                        url: form.image_vertical || form.image_horizontal,
                        field: "image_vertical",
                      })
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    {form.image_vertical ? (
                      <>
                        <Crop size={14} /> Crop, Resize &amp; Add Space
                      </>
                    ) : (
                      <>
                        <Smartphone size={14} /> Convert Desktop to Vertical
                      </>
                    )}
                  </button>
                  {form.image_vertical && !form.image_vertical.toLowerCase().endsWith(".avif") && (
                    <button
                      type="button"
                      onClick={() => handleConvertToAvif("image_vertical", form.image_vertical)}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0 transition-colors"
                    >
                      {uploadingField === "image_vertical_converting" ? <Loader2 size={14} className="animate-spin" /> : "To AVIF"}
                    </button>
                  )}
                </div>
              )}
            </div>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Details (Optional Text)</span><input value={form.details || ""} onChange={(e) => setForm({ ...form, details: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-1">
              <span className="text-xs font-bold text-slate-600">Background / CTA Button Color (Color Wheel)</span>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <input
                    value={form.background_color || ""}
                    onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                    placeholder="#000000"
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm outline-none bg-white"
                  />
                  <div
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border border-slate-300 shadow-sm transition-colors duration-200"
                    style={{ backgroundColor: form.background_color || "#000000" }}
                  />
                </div>
                <input
                  type="color"
                  value={form.background_color || "#000000"}
                  onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                  className="w-12 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                />
              </div>
            </label>
            <label className="block sm:col-span-1">
              <span className="text-xs font-bold text-slate-600">Text/Heading Color (Color Wheel)</span>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <input
                    value={form.text_color || ""}
                    onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                    placeholder="#ffffff"
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm outline-none bg-white"
                  />
                  <div
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border border-slate-300 shadow-sm transition-colors duration-200"
                    style={{ backgroundColor: form.text_color || "#ffffff" }}
                  />
                </div>
                <input
                  type="color"
                  value={form.text_color || "#ffffff"}
                  onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                  className="w-12 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                />
              </div>
            </label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>
      )}

      {loading ? <p className="text-ink-mute text-sm text-center py-8">Loading banners...</p> : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {banners.map((b, idx) => (
            <div key={b.id} className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 ${!b.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1 bg-slate-50 p-1 rounded border border-slate-100">
                  <button onClick={() => moveBanner(idx, -1)} disabled={idx === 0} className="text-ink-mute hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-ink-mute"><ArrowUp size={14} /></button>
                  <button onClick={() => moveBanner(idx, 1)} disabled={idx === banners.length - 1} className="text-ink-mute hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-ink-mute"><ArrowDown size={14} /></button>
                </div>
                <div className="h-12 w-20 rounded bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                  {b.image_horizontal && <img src={b.image_horizontal} alt={b.cta} className="object-cover w-full h-full" loading="lazy" />}
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {b.background_color && (
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: b.background_color }}
                        title={`Background / CTA color: ${b.background_color}`}
                      />
                    )}
                    {b.text_color && (
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: b.text_color }}
                        title={`Text color: ${b.text_color}`}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    <span className="mr-2 inline-flex items-center justify-center bg-slate-100 text-ink-mute rounded-full h-5 w-5 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    {b.cta || "(No CTA)"}
                  </p>
                  <p className="text-xs text-ink-mute mt-0.5">Links to: {b.href}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(b.image_horizontal || b.image_vertical) && (
                  <button
                    onClick={() => {
                      startEdit(b);
                      setCropModalData({
                        url: b.image_horizontal || b.image_vertical || "",
                        field: b.image_horizontal ? "image_horizontal" : "image_vertical",
                      });
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                    title="Crop, resize or convert banner"
                  >
                    <Crop size={12} /> Crop
                  </button>
                )}
                <button onClick={() => startEdit(b)} className="p-1.5 rounded hover:bg-slate-100 text-ink-mute font-bold hover:text-emerald-600" title="Edit banner">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded hover:bg-rose-50 text-ink-mute font-bold hover:text-rose-500" title="Delete banner">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="text-sm text-ink-mute text-center py-8">No banners configured</p>}
        </div>
      )}

      {cropModalData && (
        <BannerCropModal
          initialUrl={cropModalData.url}
          defaultField={cropModalData.field}
          supabase={supabase}
          onClose={() => setCropModalData(null)}
          onSave={(newUrl, targetField) => {
            setForm((prev) => ({ ...prev, [targetField]: newUrl }));
          }}
        />
      )}
    </div>
  );
}
