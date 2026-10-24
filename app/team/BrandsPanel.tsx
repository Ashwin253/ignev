"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Award,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Save,
  Loader2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  DEFAULT_BRAND_RANKS,
  normalizeBrand,
  type BrandRankItem,
} from "../lib/brand-rankings";

interface BrandsPanelProps {
  supabase: any;
  userEmail: string;
  listings?: any[];
}

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "scooter", label: "Scooter" },
  { id: "bike", label: "Bike" },
  { id: "cars", label: "Cars" },
  { id: "commercial", label: "Commercial" },
];

export default function BrandsPanel({ supabase, userEmail, listings = [] }: BrandsPanelProps) {
  const [ranks, setRanks] = useState<BrandRankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("scooter");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New brand input form state
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCategory, setNewBrandCategory] = useState("scooter");
  const [newBrandRank, setNewBrandRank] = useState(10);

  // Fetch rankings from Supabase on mount
  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("brand_rankings")
          .select("*")
          .order("rank", { ascending: true });

        if (!error && data && data.length > 0) {
          setRanks(data);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch brand_rankings from Supabase, using defaults:", err);
    }
    // Fallback to defaults
    setRanks(DEFAULT_BRAND_RANKS);
    setLoading(false);
  };

  // Discover all distinct brands from existing listings
  const discoveredBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    listings.forEach((l) => {
      if (l.brand && typeof l.brand === "string" && l.brand.trim()) {
        brandsSet.add(normalizeBrand(l.brand));
      }
    });
    return Array.from(brandsSet).sort();
  }, [listings]);

  // Brands currently ranked
  const currentRankedBrandNames = useMemo(() => {
    return new Set(ranks.map((r) => normalizeBrand(r.brand)));
  }, [ranks]);

  // Brands in listings that are NOT yet in rankings
  const unrankedBrands = useMemo(() => {
    return discoveredBrands.filter((b) => !currentRankedBrandNames.has(b));
  }, [discoveredBrands, currentRankedBrandNames]);

  // Filtered list of ranked brands by category and search
  const displayedRankings = useMemo(() => {
    return ranks
      .filter((r) => {
        if (activeCategory !== "all" && r.category.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return r.brand.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => a.rank - b.rank);
  }, [ranks, activeCategory, searchQuery]);

  // Move item rank up or down
  const moveRank = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= displayedRankings.length) return;

    const currentItem = displayedRankings[index];
    const targetItem = displayedRankings[targetIdx];

    // Swap rank numbers
    const newRanks = ranks.map((r) => {
      if (normalizeBrand(r.brand) === normalizeBrand(currentItem.brand) && r.category === currentItem.category) {
        return { ...r, rank: targetItem.rank };
      }
      if (normalizeBrand(r.brand) === normalizeBrand(targetItem.brand) && r.category === targetItem.category) {
        return { ...r, rank: currentItem.rank };
      }
      return r;
    });

    setRanks(newRanks);
  };

  // Direct edit rank number
  const updateRankNumber = (brand: string, category: string, newRank: number) => {
    setRanks((prev) =>
      prev.map((r) => {
        if (normalizeBrand(r.brand) === normalizeBrand(brand) && r.category === category) {
          return { ...r, rank: newRank };
        }
        return r;
      })
    );
  };

  // Delete a brand rank
  const deleteRank = (brand: string, category: string) => {
    setRanks((prev) =>
      prev.filter((r) => !(normalizeBrand(r.brand) === normalizeBrand(brand) && r.category === category))
    );
  };

  // Add a new brand to rankings
  const handleAddBrand = (brandName?: string) => {
    const nameToAdd = (brandName || newBrandName).trim();
    if (!nameToAdd) return;

    const normalized = normalizeBrand(nameToAdd);
    const existing = ranks.find(
      (r) => normalizeBrand(r.brand) === normalized && r.category === newBrandCategory
    );
    if (existing) {
      setToastMessage({ type: "error", text: `${normalized} is already ranked in ${newBrandCategory}!` });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const newItem: BrandRankItem = {
      brand: normalized,
      category: newBrandCategory,
      rank: newBrandRank || displayedRankings.length + 1,
      is_active: true,
    };

    setRanks((prev) => [...prev, newItem]);
    setNewBrandName("");
    setNewBrandRank((prev) => prev + 1);
    setToastMessage({ type: "success", text: `Added ${normalized} to rankings!` });
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Save changes to Supabase
  const handleSave = async () => {
    setSaving(true);
    setToastMessage(null);
    try {
      if (supabase) {
        // Upsert all current ranks
        const payload = ranks.map((r) => ({
          brand: normalizeBrand(r.brand),
          category: r.category.toLowerCase(),
          rank: Number(r.rank),
          is_active: r.is_active ?? true,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from("brand_rankings").upsert(payload, {
          onConflict: "brand,category",
        });

        if (error) {
          throw error;
        }

        setToastMessage({ type: "success", text: "Brand rankings saved successfully to Supabase!" });
      } else {
        setToastMessage({ type: "success", text: "Rankings updated locally!" });
      }
    } catch (err: any) {
      console.error("Failed to save brand rankings:", err);
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to save rankings to Supabase. Check table permissions.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in fade-in slide-in-from-bottom-2 ${
 toastMessage.type === "success"
              ? "bg-emerald-900 border-emerald-700 text-brand-deep"
              : "bg-rose-900 border-rose-700 text-rose-100"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200  shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 ">Brand Rankings & Priority</h2>
              <p className="text-xs text-ink-mute">
                Determine which brands appear first in Homepage Category Selector and /buy-ev catalog.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRankings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600  hover:bg-slate-50  transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Rankings
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200  overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
 activeCategory === cat.id
                  ? "bg-white  text-slate-900  shadow-xs"
                  : "text-ink-mute hover:text-slate-900 "
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 text-ink-mute" size={15} />
          <input
            type="text"
            placeholder="Search brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200  text-slate-900  text-xs font-semibold rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Add New Brand Form */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200  flex flex-wrap items-center gap-3">
        <span className="text-xs font-extrabold text-slate-700 ">Add Brand to Rank:</span>
        <input
          type="text"
          placeholder="Brand name (e.g. OLA)"
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          className="bg-slate-50 border border-slate-200  text-slate-900  text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <select
          value={newBrandCategory}
          onChange={(e) => setNewBrandCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200  text-slate-900  text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer"
        >
          <option value="scooter">Scooter</option>
          <option value="bike">Bike</option>
          <option value="cars">Cars</option>
          <option value="commercial">Commercial</option>
          <option value="all">All</option>
        </select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-mute">Rank:</span>
          <input
            type="number"
            min={1}
            max={999}
            value={newBrandRank}
            onChange={(e) => setNewBrandRank(Number(e.target.value))}
            className="w-16 bg-slate-50 border border-slate-200  text-slate-900  text-xs font-bold rounded-lg px-2 py-1.5 outline-none"
          />
        </div>
        <button
          onClick={() => handleAddBrand()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Main Table of Ranked Brands */}
      <div className="rounded-3xl border border-slate-200 bg-white  overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>Ranked Brands ({displayedRankings.length})</span>
            <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
              {activeCategory.toUpperCase()}
            </span>
          </h3>
          <span className="text-xs text-ink-mute">Lower rank number = displays first</span>
        </div>

        {displayedRankings.length === 0 ? (
          <div className="p-10 text-center text-ink-mute text-xs">
            No brands ranked in this category yet. Use the form above to add brands.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 ">
            {displayedRankings.map((item, idx) => (
              <div
                key={`${item.brand}-${item.category}`}
                className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* Left: Rank Badge + Brand Info */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700  flex items-center justify-center text-xs font-black">
                    #{item.rank}
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 ">
                      {normalizeBrand(item.brand)}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 ">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Middle: Move Up / Down Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveRank(idx, "up")}
                    disabled={idx === 0}
                    aria-label="Move rank up"
                    className="p-1.5 rounded-lg text-ink-mute hover:text-slate-700 hover:bg-slate-100  disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveRank(idx, "down")}
                    disabled={idx === displayedRankings.length - 1}
                    aria-label="Move rank down"
                    className="p-1.5 rounded-lg text-ink-mute hover:text-slate-700 hover:bg-slate-100  disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                {/* Right: Direct Rank Input + Delete */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ink-mute">Rank:</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={item.rank}
                      onChange={(e) => updateRankNumber(item.brand, item.category, Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-white  px-2 py-1 text-xs font-extrabold text-slate-900  text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => deleteRank(item.brand, item.category)}
                    aria-label="Delete brand rank"
                    className="p-1.5 text-ink-mute hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discovered New / Unranked Brands Section */}
      {unrankedBrands.length > 0 && (
        <div className="p-6 rounded-3xl border border-dashed border-amber-300 bg-amber-50/40  space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
            <Sparkles size={16} />
            <span>New Brands Discovered from Listings ({unrankedBrands.length})</span>
          </div>
          <p className="text-xs text-ink-mute">
            These brands exist in vehicle listings but are not yet given a rank. Click on any brand to quickly assign a rank.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {unrankedBrands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setNewBrandName(b);
                  handleAddBrand(b);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white  hover:border-emerald-500 text-xs font-bold text-slate-700  hover:text-emerald-600 transition cursor-pointer shadow-xs"
              >
                <Plus size={12} />
                <span>{b}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

