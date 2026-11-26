"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Car, Plus, Search, Edit3, Trash2, Eye, ShieldCheck, X, RotateCw, RefreshCw, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsedVehicle, UsedVehicleSourceType, UsedVehicleStatus, UsedVehicleCtaAction, UsedVehicleListingType, UsedVehicleMediaImage, UsedVehicleInspectionItem, MediaImageCategory } from "../lib/used-vehicles";
import { formatUsedVehiclePrice } from "../lib/used-vehicles";
import { UPLOAD_CACHE_CONTROL } from "../lib/storage";
import { authedFetch } from "../lib/authed-fetch";

interface UsedVehiclesPanelProps {
  supabase: SupabaseClient | null;
  userEmail?: string;
}

interface UsedLeadItem {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  interest: string;
  message: string;
  source: string;
  assisted_by: string | null;
  assisted_at: string | null;
  created_at: string;
}

// A photo uploaded/pasted in step 5 but not yet committed to form.media_images.
// Each staged photo carries its own title + description before being added.
interface StagedMediaItem {
  id: string;
  url: string;
  title: string;
  description: string;
}

// Derive a readable title from a file name (e.g. "front_3-4.webp" -> "front 3 4")
const deriveMediaTitle = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60) || "Inspection Photo";

// Attach the signed-in user's access token so the API can write through RLS
// policies that target the `authenticated` role.


// Extract a human-readable message from an unknown caught value
const toErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const EMPTY_FORM: Partial<UsedVehicle> = {
  title: "",
  brand: "TATA",
  model: "",
  variant: "",
  year: 2022,
  reg_month_year: "July 2022",
  body_type: "SUV",
  odometer_km: 25000,
  ownership: "1st Owner",
  listing_type: "detailed",
  stock_left: 0,
  price: 950000,
  original_price: 1550000,
  emi_starting: 18500,
  city: "Noida",
  state: "Delhi NCR",
  rto: "UP16",
  registration_number: "",
  color: "",
  battery_capacity_kwh: 30.2,
  battery_health_percentage: 95,
  real_range_km: 220,
  certified_range_km: 312,
  charging_time_hours: 8.5,
  fast_charging_minutes: 60,
  motor_power_ps: 129,
  motor_torque_nm: 245,
  warranty_remaining: "Battery & Motor Warranty active",
  insurance_type: "Comprehensive",
  insurance_valid_till: "",
  source_type: "direct",
  seller_name: "Evplse Assured Hub",
  seller_phone: "",
  seller_location: "Sector 4, Noida Hub",
  photo: "",
  gallery_images: [],
  images_360: Array(8).fill(""),
  media_images: [],
  inspection_rating: 4.8,
  inspection_summary: [
    { category: "Battery & High Voltage System", status: "Passed", rating: 5, notes: "Certified healthy, all cells balanced." },
    { category: "Electric Motor & Drivetrain", status: "Passed", rating: 5, notes: "Smooth instant electric acceleration." },
    { category: "Air Conditioning & Climate", status: "Passed", rating: 5, notes: "Chills efficiently to 18°C." },
    { category: "Tyres & Braking System", status: "Passed", rating: 4.5, notes: "70%+ tread life remaining." },
    { category: "Body & Original Paint", status: "Passed", rating: 4.5, notes: "Factory paint finish verified." },
    { category: "Interior & Infotainment Tech", status: "Passed", rating: 5, notes: "Touchscreen, sensors, camera verified." },
  ],
  features: ["Fast Charging Support", "Touchscreen Infotainment", "Reverse Camera", "Dual Airbags"],
  pros: ["Low running cost", "Active factory warranty"],
  imperfections: [],
  status: "available",
  cta_action: "both",
  featured: false,
};

export default function UsedVehiclesPanel({ supabase, userEmail }: UsedVehiclesPanelProps) {
  const [subTab, setSubTab] = useState<"list" | "form" | "leads">("list");
  const [vehicles, setVehicles] = useState<UsedVehicle[]>([]);
  const [leads, setLeads] = useState<UsedLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<UsedVehicle>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [newMedia, setNewMedia] = useState<{ category: MediaImageCategory }>({
    category: "outside",
  });
  const [stagedMedia, setStagedMedia] = useState<StagedMediaItem[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");

  // Reset any pending step-5 uploads when opening the form
  const resetMediaComposer = () => {
    setNewMedia({ category: "outside" });
    setStagedMedia([]);
    setUrlDraft("");
  };

  // Upload one or more files to Supabase Storage and stage them for titles/descriptions
  const handleStagedFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    if (!supabase) {
      alert("Supabase storage client not connected.");
      return;
    }
    setUploadingMedia(true);
    const folder = (form.brand || "used").toLowerCase().replace(/[^a-z0-9]/g, "") || "used";
    const added: StagedMediaItem[] = [];
    const failed: string[] = [];
    for (const file of list) {
      try {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "") || "photo.jpg";
        const path = `used/${folder}/${newMedia.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanFileName}`;
        const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { cacheControl: UPLOAD_CACHE_CONTROL, upsert: true });
        if (error) throw error;
        const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
        added.push({
          id: `media-${Date.now()}-${added.length}-${Math.random().toString(36).slice(2, 8)}`,
          url: publicUrl,
          title: deriveMediaTitle(file.name),
          description: "",
        });
      } catch (err) {
        failed.push(`${file.name} (${toErrorMessage(err, "upload failed")})`);
      }
    }
    if (added.length) setStagedMedia((prev) => [...prev, ...added]);
    if (failed.length) alert(`Failed to upload ${failed.length} file(s):\n${failed.join("\n")}`);
    setUploadingMedia(false);
  };

  // Stage a pasted image URL as a single pending photo
  const handleStageUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    const lastSegment = url.split("?")[0].split("#")[0].split("/").pop() || "";
    setStagedMedia((prev) => [
      ...prev,
      {
        id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        title: deriveMediaTitle(decodeURIComponent(lastSegment)),
        description: "",
      },
    ]);
    setUrlDraft("");
  };

  const handleUpdateStaged = (id: string, patch: Partial<StagedMediaItem>) => {
    setStagedMedia((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleRemoveStaged = (id: string) => {
    setStagedMedia((prev) => prev.filter((s) => s.id !== id));
  };

  // Commit all staged photos into form.media_images with the selected category
  const handleAddMedia = () => {
    if (stagedMedia.length === 0) {
      alert("Upload at least one photo or paste an image URL first.");
      return;
    }
    const category = newMedia.category;
    const fallbackTitle =
      category === "inside"
        ? "Interior Detail"
        : category === "tyres"
        ? "Tyre Detail"
        : category === "details"
        ? "Component Detail"
        : "Exterior View";
    const items: UsedVehicleMediaImage[] = stagedMedia.map((s, i) => ({
      id: `media-${Date.now()}-${i}`,
      url: s.url,
      category,
      title: s.title.trim() || fallbackTitle,
      description: s.description.trim(),
    }));
    setForm((prev) => ({
      ...prev,
      media_images: [...(prev.media_images || []), ...items],
    }));
    setStagedMedia([]);
  };

  const handleRemoveMedia = (idx: number) => {
    setForm((prev) => {
      const arr = [...(prev.media_images || [])];
      arr.splice(idx, 1);
      return { ...prev, media_images: arr };
    });
  };

  const handleUploadMultipleGalleryFiles = async (files: FileList) => {
    if (!supabase) {
      alert("Supabase storage client not connected.");
      return;
    }
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadingGallery(true);
    const uploadedUrls: string[] = [];

    for (const file of fileArray) {
      try {
        const folder = (form.brand || "used").toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
        const path = `used/${folder}/gallery-${Date.now()}-${cleanFileName}`;
        const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { cacheControl: UPLOAD_CACHE_CONTROL, upsert: true });
        if (!error && data) {
          const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
          uploadedUrls.push(publicUrl);
        }
      } catch (err: any) {
        console.warn("Upload gallery file failed:", err);
      }
    }

    if (uploadedUrls.length > 0) {
      setForm((prev) => ({
        ...prev,
        gallery_images: [...(prev.gallery_images || []), ...uploadedUrls],
      }));
    }
    setUploadingGallery(false);
  };

  const handleAddGalleryUrls = () => {
    if (!galleryUrlDraft.trim()) return;
    const urls = galleryUrlDraft
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length > 0) {
      setForm((prev) => ({
        ...prev,
        gallery_images: [...(prev.gallery_images || []), ...urls],
      }));
      setGalleryUrlDraft("");
    }
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setForm((prev) => {
      const arr = [...(prev.gallery_images || [])];
      arr.splice(index, 1);
      return { ...prev, gallery_images: arr };
    });
  };

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch("/api/used", { cache: "no-store" });
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setVehicles(json.data);
      } else {
        setVehicles([]);
        setNotification({
          type: "error",
          message: json.error || "Could not load used vehicles from the database.",
        });
      }
    } catch {
      setVehicles([]);
      setNotification({ type: "error", message: "Could not reach the used vehicles API." });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .ilike("source", "%Used EV%")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLeads(data as UsedLeadItem[]);
      }
    } catch (e) {
      console.warn("Error fetching used leads:", e);
    }
  }, [supabase]);

  // Mount-time data fetch: results arrive asynchronously and setState when the
  // responses land. This rule can't distinguish that from a sync setState, so it
  // is disabled for these two calls only (same pattern appears ~40x repo-wide).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchVehicles();
    fetchLeads();
  }, [fetchVehicles, fetchLeads]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleEdit = (v: UsedVehicle) => {
    // Ensure images_360 has 8 slots
    const raw360 = Array.isArray(v.images_360) ? [...v.images_360] : [];
    while (raw360.length < 8) raw360.push("");

    setForm({
      ...v,
      images_360: raw360.slice(0, 8),
      media_images: Array.isArray(v.media_images) ? v.media_images : [],
    });
    setEditingId(v.id);
    resetMediaComposer();
    setSubTab("form");
  };

  const handleNew = () => {
    setForm({
      ...EMPTY_FORM,
      images_360: Array(8).fill(""),
      media_images: [],
    });
    setEditingId(null);
    resetMediaComposer();
    setSubTab("form");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await authedFetch(supabase, `/api/used/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setNotification({ type: "success", message: `Deleted ${title}` });
        setLoading(true);
        fetchVehicles();
      } else {
        alert(json.error || "Failed to delete");
      }
    } catch (e) {
      alert(toErrorMessage(e, "Delete error"));
    }
  };

  const updateInspectionItem = (index: number, patch: Partial<UsedVehicleInspectionItem>) => {
    setForm((current) => ({
      ...current,
      inspection_summary: (current.inspection_summary || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const addInspectionItem = () => {
    setForm((current) => ({
      ...current,
      inspection_summary: [
        ...(current.inspection_summary || []),
        { category: "New inspection category", status: "Passed", rating: 5, notes: "" },
      ],
    }));
  };

  const removeInspectionItem = (index: number) => {
    setForm((current) => ({
      ...current,
      inspection_summary: (current.inspection_summary || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.brand || !form.price) {
      alert("Please fill in Title, Brand, and Price.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update
        const res = await authedFetch(supabase, `/api/used/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (json.ok) {
          setNotification({ type: "success", message: "Vehicle updated successfully!" });
          setLoading(true);
          fetchVehicles();
          setSubTab("list");
        } else {
          alert(json.error || "Update failed.");
        }
      } else {
        // Create new
        const res = await authedFetch(supabase, "/api/used", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (json.ok) {
          setNotification({ type: "success", message: "New used vehicle added!" });
          setLoading(true);
          fetchVehicles();
          setSubTab("list");
        } else {
          alert(json.error || "Failed to add vehicle.");
        }
      }
    } catch (err) {
      alert(toErrorMessage(err, "Save error occurred."));
    } finally {
      setSaving(false);
    }
  };

  const markLeadAssisted = async (id: string) => {
    if (!supabase) return;
    await supabase.from("leads").update({
      assisted_at: new Date().toISOString(),
      assisted_by: userEmail || "team",
    }).eq("id", id);
    fetchLeads();
  };

  // Upload a photo file to Supabase Storage 'evphotos'
  const handleUploadFile = async (
    file: File,
    target: "cover" | "gallery" | { index360: number }
  ) => {
    if (!supabase) {
      alert("Supabase storage client not connected.");
      return;
    }

    const folder = (form.brand || "used").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
    const path = `used/${folder}/${Date.now()}-${cleanFileName}`;

    const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { cacheControl: UPLOAD_CACHE_CONTROL, upsert: true });
    if (error) {
      alert(`Upload failed: ${error.message}`);
      return;
    }

    const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;

    if (target === "cover") {
      setForm((prev) => ({ ...prev, photo: publicUrl }));
    } else if (target === "gallery") {
      setForm((prev) => ({
        ...prev,
        gallery_images: [...(prev.gallery_images || []), publicUrl],
      }));
    } else if (typeof target === "object" && "index360" in target) {
      const idx = target.index360;
      setForm((prev) => {
        const arr = [...(prev.images_360 || Array(8).fill(""))];
        arr[idx] = publicUrl;
        return { ...prev, images_360: arr };
      });
    }
  };

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          v.title.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterSource !== "all" && v.source_type !== filterSource) return false;
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      return true;
    });
  }, [vehicles, search, filterSource, filterStatus]);

  const POSITIONS_360 = [
    "1. Front",
    "2. Front-Right",
    "3. Right",
    "4. Right-End (Rear-Right)",
    "5. Rear",
    "6. End-Left (Rear-Left)",
    "7. Left",
    "8. Left-Start (Front-Left)",
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Car size={20} />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Used EVs Management</h2>
              <p className="text-xs text-slate-500">
                Add &amp; manage pre-owned electric vehicles across Direct, Dealer, and Customer sources.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("list")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === "list" ? "bg-slate-900 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Vehicles ({vehicles.length})
          </button>
          <button
            onClick={handleNew}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === "form" && !editingId
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <Plus size={14} /> Add Vehicle
          </button>
          <button
            onClick={() => setSubTab("leads")}
            className={`relative rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === "leads" ? "bg-slate-900 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Enquiries &amp; Test Drives ({leads.length})
            {leads.filter((l) => !l.assisted_by).length > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {leads.filter((l) => !l.assisted_by).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {notification && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Sub-Tab 1: List View ── */}
      {subTab === "list" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200">
            <div className="flex flex-1 items-center gap-2 max-w-sm">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, brand, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span>Source:</span>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
              >
                <option value="all">All Sources</option>
                <option value="direct">Direct (from us / Assured)</option>
                <option value="dealer">Dealer</option>
                <option value="customer">Customer</option>
              </select>

              <span>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Vehicles Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs font-bold text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin text-emerald-600" /> Loading used vehicles...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Vehicle / City</th>
                    <th className="p-3">Battery Health</th>
                    <th className="p-3">360°</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.map((v) => {
                    const has360 = Array.isArray(v.images_360) && v.images_360.filter(Boolean).length >= 4;
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={v.photo || "/vehicles/tatanexonev.webp"}
                              alt={v.title}
                              className="h-10 w-14 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900">{v.title}</p>
                              <p className="text-[11px] text-slate-400">{v.year} • {v.brand}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              v.source_type === "direct"
                                ? "bg-emerald-100 text-emerald-800"
                                : v.source_type === "dealer"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            <ShieldCheck size={11} />
                            {v.source_type === "direct" ? "Direct (from us)" : v.source_type === "dealer" ? "Dealer" : "Customer"}
                          </span>
                          {v.seller_name && (
                            <p className="mt-0.5 text-[10px] text-slate-500 truncate max-w-[120px]">{v.seller_name}</p>
                          )}
                        </td>

                        <td className="p-3 font-extrabold text-slate-900">
                          {formatUsedVehiclePrice(v.price)}
                        </td>

                        <td className="p-3 text-slate-600">
                          <p className="font-semibold">{v.listing_type === "inventory" ? `${v.stock_left} ${v.stock_left === 1 ? "unit" : "units"} left` : `${v.odometer_km.toLocaleString()} km`}</p>
                          <p className="text-[11px] text-slate-400">{v.city}</p>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-emerald-700">
                            {v.battery_health_percentage || 94}% SoH
                          </span>
                        </td>

                        <td className="p-3">
                          {has360 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <RotateCw size={12} /> Yes ({v.images_360.filter(Boolean).length} frames)
                            </span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>

                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              v.status === "available"
                                ? "bg-emerald-100 text-emerald-800"
                                : v.status === "booked"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/used/${v.slug}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="View on site"
                            >
                              <Eye size={15} />
                            </Link>

                            <button
                              onClick={() => handleEdit(v)}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                              title="Edit vehicle"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              onClick={() => handleDelete(v.id, v.title)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Delete vehicle"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-xs font-semibold text-slate-500">
                        No used vehicles in the database yet — use the Add Vehicle button to publish your first listing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Sub-Tab 2: Add / Edit Form ── */}
      {subTab === "form" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-black text-slate-900">
              {editingId ? `Editing: ${form.title}` : "Add New Used Vehicle"}
            </h3>
            <button
              type="button"
              onClick={() => setSubTab("list")}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          {/* Source & Action CTA Configuration */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-3">
              1. Source Origin &amp; Customer CTA Mode
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700">Vehicle Source Type</label>
                <select
                  value={form.source_type}
                  onChange={(e) => setForm({ ...form, source_type: e.target.value as UsedVehicleSourceType })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold"
                >
                  <option value="direct">Direct (from us / Evplse Assured)</option>
                  <option value="dealer">Dealer (Certified Partner)</option>
                  <option value="customer">Customer (Individual Seller)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Choose whether this car is stocked directly by Evezy, by a partner dealer, or an individual owner.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Customer Action CTA</label>
                <select
                  value={form.cta_action}
                  onChange={(e) => setForm({ ...form, cta_action: e.target.value as UsedVehicleCtaAction })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold"
                >
                  <option value="both">Both: Test Drive / Visit AND Enquire Now</option>
                  <option value="test_drive">Test Drive / Visit Only</option>
                  <option value="enquire">Enquire Now Only</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Controls which action buttons appear on the vehicle page and catalog cards.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Seller / Hub Name</label>
                <input
                  type="text"
                  value={form.seller_name || ""}
                  onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
                  placeholder="e.g. Evplse Assured Hub (Sector 4) or GreenWheel Motors"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Seller / Hub Phone</label>
                <input
                  type="text"
                  value={form.seller_phone || ""}
                  onChange={(e) => setForm({ ...form, seller_phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700">Hub / Parking Physical Location</label>
                <input
                  type="text"
                  value={form.seller_location || ""}
                  onChange={(e) => setForm({ ...form, seller_location: e.target.value })}
                  placeholder="e.g. Plot C-12, Sector 4, Noida, Uttar Pradesh"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Listing format determines whether this is one traceable vehicle or model-level stock. */}
          <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
            <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-violet-900">2. Listing Format</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-xl border p-3 ${form.listing_type !== "inventory" ? "border-violet-500 bg-white" : "border-violet-100 bg-white/60"}`}>
                <input type="radio" name="listing_type" className="sr-only" checked={form.listing_type !== "inventory"} onChange={() => setForm({ ...form, listing_type: "detailed" })} />
                <span className="block text-xs font-black text-slate-900">Detailed vehicle</span>
                <span className="mt-1 block text-[11px] text-slate-600">One specific vehicle with its registration, owner and odometer details.</span>
              </label>
              <label className={`cursor-pointer rounded-xl border p-3 ${form.listing_type === "inventory" ? "border-violet-500 bg-white" : "border-violet-100 bg-white/60"}`}>
                <input type="radio" name="listing_type" className="sr-only" checked={form.listing_type === "inventory"} onChange={() => setForm({ ...form, listing_type: "inventory" })} />
                <span className="block text-xs font-black text-slate-900">Model inventory</span>
                <span className="mt-1 block text-[11px] text-slate-600">One listing for matching units of the same model; per-vehicle registration is not collected.</span>
              </label>
            </div>
            {form.listing_type === "inventory" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Stock left</label>
                  <input type="number" min="0" value={form.stock_left ?? 0} onChange={(e) => setForm({ ...form, stock_left: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full rounded-xl border border-violet-200 bg-white p-2 text-xs font-bold" />
                </div>
                <div className="sm:col-span-2 rounded-xl bg-white/70 p-3 text-[11px] text-slate-600">The public listing will show the remaining stock instead of unique odometer and ownership information.</div>
              </div>
            )}
          </div>

          {form.listing_type === "inventory" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-700">3. Inventory Model Details</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><label className="text-[11px] font-bold text-slate-600">Title</label><input type="text" required value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tata Nexon EV XZ Plus" className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold" /></div>
                <div><label className="text-[11px] font-bold text-slate-600">Brand</label><input type="text" required value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value.toUpperCase() })} className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold uppercase" /></div>
                <div><label className="text-[11px] font-bold text-slate-600">Model</label><input type="text" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs" /></div>
                <div><label className="text-[11px] font-bold text-slate-600">Variant</label><input type="text" value={form.variant || ""} onChange={(e) => setForm({ ...form, variant: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs" /></div>
                <div><label className="text-[11px] font-bold text-slate-600">Model Year</label><input type="number" value={form.year || 2022} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs" /></div>
                <div><label className="text-[11px] font-bold text-slate-600">City</label><input type="text" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs" /></div>
              </div>
            </div>
          )}

          {/* Vehicle Basic Info */}
          {form.listing_type !== "inventory" && <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
              2. Vehicle Basics &amp; Registration
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Title</label>
                <input
                  type="text"
                  required
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 2021 Tata Nexon EV XZ Plus"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Brand</label>
                <input
                  type="text"
                  required
                  value={form.brand || ""}
                  onChange={(e) => setForm({ ...form, brand: e.target.value.toUpperCase() })}
                  placeholder="e.g. TATA, MG, MAHINDRA, OLA"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Model</label>
                <input
                  type="text"
                  value={form.model || ""}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. Nexon EV, ZS EV"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Variant</label>
                <input
                  type="text"
                  value={form.variant || ""}
                  onChange={(e) => setForm({ ...form, variant: e.target.value })}
                  placeholder="e.g. XZ Plus, Exclusive"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Model / Reg Year</label>
                <input
                  type="number"
                  value={form.year || 2022}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Reg Month &amp; Year</label>
                <input
                  type="text"
                  value={form.reg_month_year || ""}
                  onChange={(e) => setForm({ ...form, reg_month_year: e.target.value })}
                  placeholder="e.g. July 2021"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Body Type</label>
                <select
                  value={form.body_type}
                  onChange={(e) => setForm({ ...form, body_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                >
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Bike">Bike</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Color</label>
                <input
                  type="text"
                  value={form.color || ""}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="e.g. Signature Teal Blue"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Ownership</label>
                <select
                  value={form.ownership}
                  onChange={(e) => setForm({ ...form, ownership: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                >
                  <option value="1st Owner">1st Owner</option>
                  <option value="2nd Owner">2nd Owner</option>
                  <option value="3rd Owner">3rd Owner</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Odometer (KM)</label>
                <input
                  type="number"
                  value={form.odometer_km || 0}
                  onChange={(e) => setForm({ ...form, odometer_km: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">City &amp; RTO</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.city || ""}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City (e.g. Noida)"
                    className="mt-1 flex-1 rounded-xl border border-slate-300 p-2 text-xs"
                  />
                  <input
                    type="text"
                    value={form.rto || ""}
                    onChange={(e) => setForm({ ...form, rto: e.target.value })}
                    placeholder="RTO (UP16)"
                    className="mt-1 w-20 rounded-xl border border-slate-300 p-2 text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Registration Number</label>
                <input
                  type="text"
                  value={form.registration_number || ""}
                  onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. UP16-CR-3406"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs uppercase"
                />
              </div>
            </div>
          </div>}

          {/* Pricing & EV Battery & Motor Health Report */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
              3. Pricing &amp; EV Battery &amp; Motor Health Report
            </h4>
            <p className="mb-3 text-xs text-slate-500">Enter the battery condition, driving range, charging and motor details shown in the vehicle&apos;s public health report.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Selling Price (₹)</label>
                <input
                  type="number"
                  required
                  value={form.price || ""}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="e.g. 945000"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Original Ex-Showroom (₹)</label>
                <input
                  type="number"
                  value={form.original_price || ""}
                  onChange={(e) => setForm({ ...form, original_price: Number(e.target.value) })}
                  placeholder="e.g. 1599000"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Starting EMI (₹/mo)</label>
                <input
                  type="number"
                  value={form.emi_starting || ""}
                  onChange={(e) => setForm({ ...form, emi_starting: Number(e.target.value) })}
                  placeholder="e.g. 18450"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Battery Capacity (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.battery_capacity_kwh || ""}
                  onChange={(e) => setForm({ ...form, battery_capacity_kwh: Number(e.target.value) })}
                  placeholder="e.g. 30.2"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Battery Health (% SoH)</label>
                <input
                  type="number"
                  value={form.battery_health_percentage || 94}
                  onChange={(e) => setForm({ ...form, battery_health_percentage: Number(e.target.value) })}
                  placeholder="e.g. 94"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Real Driving Range (km)</label>
                <input
                  type="number"
                  value={form.real_range_km || ""}
                  onChange={(e) => setForm({ ...form, real_range_km: Number(e.target.value) })}
                  placeholder="e.g. 220"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Fast Charging (minutes)</label>
                <input
                  type="number"
                  value={form.fast_charging_minutes || ""}
                  onChange={(e) => setForm({ ...form, fast_charging_minutes: Number(e.target.value) })}
                  placeholder="e.g. 60"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Motor Power (PS)</label>
                <input
                  type="number"
                  value={form.motor_power_ps || ""}
                  onChange={(e) => setForm({ ...form, motor_power_ps: Number(e.target.value) })}
                  placeholder="e.g. 129"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Warranty Remaining Notes</label>
                <input
                  type="text"
                  value={form.warranty_remaining || ""}
                  onChange={(e) => setForm({ ...form, warranty_remaining: e.target.value })}
                  placeholder="e.g. Battery & Motor till Jul 2029"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 200-Point Inspection Report */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">4. 200-Point Inspection Report</h4>
                <p className="mt-1 text-xs text-slate-600">Add the inspection categories, outcomes and notes shown on the vehicle page.</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2">
                <label className="text-[11px] font-bold text-slate-700">Overall rating / 5</label>
                <input type="number" min="0" max="5" step="0.1" value={form.inspection_rating ?? ""} onChange={(e) => setForm({ ...form, inspection_rating: Number(e.target.value) })} className="w-14 bg-transparent text-xs font-black text-amber-900 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              {(form.inspection_summary || []).map((item, index) => (
                <div key={`${item.category}-${index}`} className="grid gap-2 rounded-xl border border-amber-100 bg-white p-3 sm:grid-cols-[1.3fr_0.8fr_0.42fr_1.6fr_auto] sm:items-center">
                  <input value={item.category} onChange={(e) => updateInspectionItem(index, { category: e.target.value })} placeholder="Inspection category" className="rounded-lg border border-slate-300 p-2 text-xs font-bold" />
                  <select value={item.status} onChange={(e) => updateInspectionItem(index, { status: e.target.value as UsedVehicleInspectionItem["status"] })} className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold"><option value="Passed">Passed</option><option value="Attention">Attention</option><option value="Needs Repair">Needs Repair</option></select>
                  <input type="number" min="0" max="5" step="0.1" value={item.rating ?? ""} onChange={(e) => updateInspectionItem(index, { rating: Number(e.target.value) })} aria-label={`Rating for ${item.category || "inspection category"}`} className="rounded-lg border border-slate-300 p-2 text-xs font-bold" />
                  <input value={item.notes} onChange={(e) => updateInspectionItem(index, { notes: e.target.value })} placeholder="Inspection notes" className="rounded-lg border border-slate-300 p-2 text-xs" />
                  <button type="button" onClick={() => removeInspectionItem(index)} className="rounded-lg px-2 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50">Remove</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addInspectionItem} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"><Plus size={14} /> Add inspection category</button>
          </div>

          {/* Media & 8-Photo Angle 360 Exterior View */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              4. Media &amp; 360° Exterior Virtual Turntable (8 Angle Photos)
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Add photos in clockwise exterior order: Front, Front-Right, Right, Rear-Right, Rear, Rear-Left, Left, Front-Left.
            </p>

            {/* Cover photo */}
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="text-xs font-bold text-slate-800">Main Cover Photo</label>
              <div className="mt-2 flex items-center gap-3">
                {form.photo ? (
                  <img src={form.photo} alt="Cover preview" className="h-16 w-24 rounded-lg object-cover border" />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-[11px] text-slate-400">
                    No Cover
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFile(f, "cover");
                    }}
                    className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-emerald-100 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-emerald-800"
                  />
                  <input
                    type="url"
                    value={form.photo || ""}
                    onChange={(e) => setForm({ ...form, photo: e.target.value })}
                    placeholder="Or enter image URL"
                    className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Multiple Gallery Photos List */}
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <label className="text-xs font-bold text-slate-800">Gallery Photos (Add multiple photos to list)</label>
                  <p className="text-[11px] text-slate-500">
                    Select multiple image files at once to upload in batch, or paste multiple image URLs.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                  {(form.gallery_images || []).length} Photos in Gallery
                </span>
              </div>

              {/* Upload & URL Input Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingGallery}
                  onChange={(e) => {
                    if (e.target.files) handleUploadMultipleGalleryFiles(e.target.files);
                    e.target.value = "";
                  }}
                  className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />

                <div className="flex w-full flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={galleryUrlDraft}
                    onChange={(e) => setGalleryUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGalleryUrls();
                      }
                    }}
                    placeholder="Or paste multiple image URLs (comma or newline separated)"
                    className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrls}
                    disabled={!galleryUrlDraft.trim()}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black disabled:opacity-40"
                  >
                    Add to List
                  </button>
                </div>
              </div>

              {uploadingGallery && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Loader2 size={13} className="animate-spin" /> Uploading gallery photos in batch...
                </p>
              )}

              {/* Gallery List Thumbnails Grid */}
              {(form.gallery_images || []).length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Photos in List (Click trash on any image to remove):
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, gallery_images: [] }))}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800"
                    >
                      Clear All Photos
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {form.gallery_images?.map((url, idx) => (
                      <div key={idx} className="group relative aspect-[16/11] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                        <img src={url} alt={`Gallery photo ${idx + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryPhoto(idx)}
                            className="rounded-full bg-rose-600 p-1 text-white hover:bg-rose-700"
                            title="Remove photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 360 8-angle Grid */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-black uppercase text-emerald-800">
                🔄 8 Clockwise Turntable Angles
              </span>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {POSITIONS_360.map((pos, idx) => {
                  const currentImg = form.images_360?.[idx] || "";
                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                      <span className="text-xs font-extrabold text-slate-800">{pos}</span>
                      {currentImg ? (
                        <img
                          src={currentImg}
                          alt={pos}
                          className="h-24 w-full rounded-lg object-contain bg-slate-50 border border-slate-100"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                          Empty Angle
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadFile(f, { index360: idx });
                        }}
                        className="w-full text-[10px] file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:font-bold file:text-emerald-700"
                      />

                      <input
                        type="url"
                        value={currentImg}
                        onChange={(e) => {
                          const arr = [...(form.images_360 || Array(8).fill(""))];
                          arr[idx] = e.target.value;
                          setForm({ ...form, images_360: arr });
                        }}
                        placeholder="Image URL"
                        className="w-full rounded border border-slate-200 p-1 text-[11px]"
                      />

                      {currentImg && (
                        <button
                          type="button"
                          onClick={() => {
                            const arr = [...(form.images_360 || Array(8).fill(""))];
                            arr[idx] = "";
                            setForm({ ...form, images_360: arr });
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Categorized Inside & Outside Photos with Descriptions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  5. Inside &amp; Outside Photos (with Descriptions)
                </h4>
                <p className="text-xs text-slate-500">
                  Upload multiple photos at once, then add a title and detailed inspection caption to each one. Categorized for Outside (Exterior), Inside (Interior), Tyres, and other details.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
                {(form.media_images || []).length} Photos Added
              </span>
            </div>

            {/* Form to Add New Categorized Photos (multi-upload) */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3 mb-5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Plus size={14} /> Add Inside / Outside Photos
              </span>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Photo Category (applies to this batch)</label>
                  <select
                    value={newMedia.category}
                    onChange={(e) => setNewMedia({ ...newMedia, category: e.target.value as MediaImageCategory })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold"
                  >
                    <option value="outside">Outside (Exterior)</option>
                    <option value="inside">Inside (Interior)</option>
                    <option value="tyres">Tyres &amp; Wheels</option>
                    <option value="details">Details / Motor</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Select <strong className="text-slate-700">multiple photos at once</strong> — each one gets its own title and description below before you add them to the list.
                  </p>
                </div>
              </div>

              {/* Image Inputs (multi-file upload + URL) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700">Upload Images (choose one or more) or Paste URL</label>
                <div className="mt-1 flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingMedia}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length) handleStagedFiles(files);
                      e.target.value = "";
                    }}
                    className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-emerald-100 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-emerald-800"
                  />

                  <div className="flex w-full flex-1 items-center gap-2">
                    <input
                      type="url"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleStageUrl();
                        }
                      }}
                      placeholder="Or paste direct image URL (e.g. /vehicles/tatanexonev.webp or https://...)"
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleStageUrl}
                      disabled={!urlDraft.trim() || uploadingMedia}
                      className="shrink-0 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-40"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
                {uploadingMedia && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                    <Loader2 size={12} className="animate-spin" /> Uploading photos… please wait.
                  </p>
                )}
              </div>

              {/* Staged photos awaiting titles & descriptions */}
              {stagedMedia.length > 0 && (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-white p-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    {stagedMedia.length} photo{stagedMedia.length > 1 ? "s" : ""} ready — set a title &amp; description for each
                  </span>
                  {stagedMedia.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="h-16 w-20 shrink-0 rounded-md border border-slate-200 object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateStaged(item.id, { title: e.target.value })}
                          placeholder="Title / Section Label (e.g. Dashboard & Steering)"
                          className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold"
                        />
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => handleUpdateStaged(item.id, { description: e.target.value })}
                          placeholder="Detailed description / condition notes for this photo"
                          className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaged(item.id)}
                        className="self-start text-[11px] font-bold text-rose-600 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500">
                  {stagedMedia.length === 0
                    ? "No pending photos yet — use the selector above to add one or more images."
                    : "Review the titles & descriptions, then add them to the list."}
                </p>
                <button
                  type="button"
                  onClick={handleAddMedia}
                  disabled={stagedMedia.length === 0 || uploadingMedia}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-40"
                >
                  <Plus size={14} /> Add {stagedMedia.length > 0 ? `${stagedMedia.length} ` : ""}Photo{stagedMedia.length === 1 ? "" : "s"} to List
                </button>
              </div>
            </div>

            {/* List of Added Categorized Photos */}
            {(form.media_images || []).length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {form.media_images?.map((media, idx) => (
                  <div key={idx} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-white border border-slate-200">
                      <img src={media.url} alt={media.title} className="h-full w-full object-cover" />
                      <span
                        className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${
                          media.category === "inside"
                            ? "bg-indigo-600"
                            : media.category === "outside"
                            ? "bg-emerald-700"
                            : media.category === "tyres"
                            ? "bg-amber-600"
                            : "bg-slate-700"
                        }`}
                      >
                        {media.category}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-extrabold text-slate-900 text-xs line-clamp-1">{media.title}</h5>
                      <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {media.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                      >
                        Delete Photo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-slate-400">
                No categorized inside/outside photos added yet. Use the form above to add inspection photos with descriptions.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Listing Status:</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as UsedVehicleStatus })}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
              >
                <option value="available">Available (Live)</option>
                <option value="under_inspection">Under Inspection</option>
                <option value="booked">Booked</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSubTab("list")}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Save Changes" : "Publish Used Vehicle"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Sub-Tab 3: Leads & Test Drives ── */}
      {subTab === "leads" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">
              Used Vehicle Enquiries &amp; Test Drive Bookings
            </h3>
            <button
              onClick={fetchLeads}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {leads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              No used vehicle leads yet. Test drive and enquiry requests from `/used` will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Vehicle Interest</th>
                    <th className="p-3">Request Details</th>
                    <th className="p-3">Source / Type</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((l) => (
                    <tr key={l.id} className={l.assisted_by ? "bg-slate-50/50" : "bg-white font-semibold"}>
                      <td className="p-3 text-slate-900 font-extrabold">{l.name}</td>
                      <td className="p-3">
                        <a href={`tel:${l.phone}`} className="text-emerald-700 hover:underline">
                          {l.phone}
                        </a>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{l.interest}</td>
                      <td className="p-3 text-slate-600 text-[11px] max-w-xs">{l.message}</td>
                      <td className="p-3">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {l.source}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(l.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 text-right">
                        {l.assisted_by ? (
                          <span className="text-[11px] font-bold text-emerald-600">Assisted</span>
                        ) : (
                          <button
                            onClick={() => markLeadAssisted(l.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                          >
                            Mark Assisted
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
