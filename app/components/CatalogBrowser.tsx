// app/components/CatalogBrowser.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Zap, CalendarDays, BadgeCheck, Share2, Check, ArrowRight, X, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, Truck, ArrowUpRight, Send, GitCompare, Search, Gauge
} from "lucide-react";
import { ProductSkeleton } from "./ProductSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { triggerEnquiryModal } from "./EnquiryModal";
import { formatLaunchDate, isLaunched } from "../lib/wordpress";
import { useCompare } from "../context/CompareContext";
import {
  CATALOG_CATEGORIES,
  normalizeCatalogCategory,
  matchesCatalogCategory,
  type CatalogCategoryValue,
} from "../lib/catalog-filters";

function toSlug(brand: string, name: string) {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export type CatalogItem = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  photo: string;
  slug?: string;
  topSpeed?: number | null;
  drivingRange?: string;
  commercial?: boolean;
  launchdate?: string | null;
  prices?: string[];
  baas?: boolean;
  usageType?: string;
};

// ── Price filter ──────────────────────────────────────────────────────────────

function parsePriceLow(item: CatalogItem): number {
  if (item.prices?.length) {
    const low = parseFloat(item.prices[0].split("-")[0]);
    if (!isNaN(low)) return low;
  }
  const match = item.pricing.replace(/[₹,]/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function matchesPrice(item: CatalogItem, bucket: string): boolean {
  if (bucket === "all") return true;
  const low = parsePriceLow(item);
  if (bucket === "0-5") return low < 5;
  if (bucket === "5-15") return low >= 5 && low < 15;
  if (bucket === "15-30") return low >= 15 && low < 30;
  if (bucket === "30+") return low >= 30;
  return true;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CatalogBrowser({ items }: { items: CatalogItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();

  // Read initial state from URL or defaults
  const query = searchParams.get("q") ?? "";
  const category = normalizeCatalogCategory(searchParams.get("type"));
  const brand = searchParams.get("brand") ?? "all";
  const price = searchParams.get("price") ?? "all";
  const commercialOnly = searchParams.get("comm") === "true";
  const launchedOnly = searchParams.get("avail") === "true";
  const comingSoonOnly = searchParams.get("upcoming") === "true";
  const baasOnly = searchParams.get("baas") === "true";
  const usage = searchParams.get("usage") ?? "all";

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [allItems, setAllItems] = useState<CatalogItem[]>(items);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingSkeleton, setLoadingSkeleton] = useState(false);
  const [hasFetchedAll, setHasFetchedAll] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchAllItems = async () => {
    if (hasFetchedAll) return;
    setLoadingMore(true);
    try {
      const res = await fetch("/api/catalog-all");
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > allItems.length) {
          setAllItems(data.items);
        }
      }
    } catch { /* use what we have */ }
    setHasFetchedAll(true);
    setLoadingMore(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "EVPULSE Catalog", url }).catch(() => { });
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const updateFilters = (updates: Record<string, string | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const categoryOptions = useMemo(() => [...CATALOG_CATEGORIES], []);

  const brandOptions = useMemo(() => {
    const brands = [...new Set(items.map((i) => i.brand).filter(Boolean))].sort();
    return ["all", ...brands];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q) &&
        !item.brand.toLowerCase().includes(q) &&
        !item.type.toLowerCase().includes(q)) return false;

      if (!matchesCatalogCategory(item.type, category as CatalogCategoryValue)) return false;

      if (brand !== "all" && item.brand !== brand) return false;
      if (!matchesPrice(item, price)) return false;
      if (commercialOnly && !item.commercial) return false;
      if (launchedOnly && !isLaunched(item.launchdate)) return false;
      if (comingSoonOnly && isLaunched(item.launchdate)) return false;
      if (baasOnly && !item.baas) return false;
      if (usage !== "all" && item.usageType !== usage) return false;
      return true;
    });
  }, [brand, category, commercialOnly, allItems, launchedOnly, comingSoonOnly, price, query, baasOnly, usage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingSkeleton && !loadingMore) {
          if (visibleCount < filteredItems.length) {
            setLoadingSkeleton(true);
            setTimeout(() => {
              setVisibleCount((v) => v + 4);
              setLoadingSkeleton(false);
            }, 600);
          } else if (!hasFetchedAll) {
            setLoadingSkeleton(true);
            fetchAllItems().then(() => {
              setVisibleCount((v) => v + 4);
              setLoadingSkeleton(false);
            });
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredItems.length, hasFetchedAll, loadingMore, loadingSkeleton]);

  const filterKey = `${query}-${category}-${brand}-${price}-${commercialOnly}-${launchedOnly}-${comingSoonOnly}-${baasOnly}-${usage}`;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(4);
  }, [filterKey]);

  const hasActiveFilters = category !== "all" || brand !== "all" || price !== "all" || usage !== "all" || commercialOnly || launchedOnly || comingSoonOnly || baasOnly || !!query;
  const activeFilterCount = [category !== "all", brand !== "all", price !== "all", usage !== "all", commercialOnly, launchedOnly, comingSoonOnly, baasOnly, !!query].filter(Boolean).length;

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="space-y-6">

      {/* ── Glass Filter Panel (2026) ── */}
      <div className="rounded-3xl border border-white/60 bg-white/90 backdrop-blur-2xl shadow-xl shadow-slate-950/5 overflow-hidden relative z-10">
        
        {/* Mobile Header */}
        <div
          className="md:hidden flex items-center gap-3 px-5 py-4 cursor-pointer active:bg-white/60 transition-colors"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <div className="w-8 h-8 rounded-2xl bg-white/80 flex items-center justify-center border border-white/70">
            <SlidersHorizontal size={18} className="text-slate-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              {category !== "all" ? category : "All Vehicles"}
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#34ebb1] text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">{filteredItems.length} results</div>
          </div>
          
          {filtersOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}

          {/* Share Button - Mobile */}
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="ml-auto w-9 h-9 flex items-center justify-center rounded-2xl bg-white/70 hover:bg-white active:bg-white/90 transition-all border border-white/60"
          >
            {shared ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} className="text-slate-500" />}
          </button>
        </div>

        {/* Filter Content */}
        <div className={filtersOpen ? "block" : "hidden md:block"}>

          {/* Type Pills - Glass style */}
          <div className="px-5 pt-5 pb-4 border-b border-white/70">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilters({ type: opt.value })}
                  className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all border flex-shrink-0 ${category === opt.value
                      ? "bg-[#34ebb1] text-slate-950 border-[#34ebb1] shadow-md shadow-[#34ebb1]/20"
                      : "bg-white/80 border-white/70 hover:border-[#34ebb1]/30 hover:bg-white/90 text-slate-700"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search + Selects */}
          <div className="p-5 grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Search */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/70 px-5 py-3.5 focus-within:border-[#34ebb1]/50 focus-within:bg-white/90 transition-all">
                <Search size={18} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => updateFilters({ q: e.target.value })}
                  placeholder="Search by model or brand..."
                  className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-400 text-slate-800"
                />
                {query && (
                  <button onClick={() => updateFilters({ q: null })} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Brand */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/70 px-5 py-3.5 focus-within:border-[#34ebb1]/50 focus-within:bg-white/90 transition-all">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Brand</span>
                <select
                  value={brand}
                  onChange={(e) => updateFilters({ brand: e.target.value })}
                  className="flex-1 bg-transparent text-[15px] outline-none text-slate-800 cursor-pointer appearance-none"
                >
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>{b === "all" ? "All brands" : b}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Price */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/70 px-5 py-3.5 focus-within:border-[#34ebb1]/50 focus-within:bg-white/90 transition-all">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Price</span>
                <select
                  value={price}
                  onChange={(e) => updateFilters({ price: e.target.value })}
                  className="flex-1 bg-transparent text-[15px] outline-none text-slate-800 cursor-pointer appearance-none"
                >
                  <option value="all">All prices</option>
                  <option value="0-5">Under ₹5L</option>
                  <option value="5-15">₹5–15L</option>
                  <option value="15-30">₹15–30L</option>
                  <option value="30+">₹30L+</option>
                </select>
                <ChevronDown size={16} className="text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Usage */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/70 px-5 py-3.5 focus-within:border-[#34ebb1]/50 focus-within:bg-white/90 transition-all">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Usage</span>
                <select
                  value={usage}
                  onChange={(e) => updateFilters({ usage: e.target.value })}
                  className="flex-1 bg-transparent text-[15px] outline-none text-slate-800 cursor-pointer appearance-none"
                >
                  <option value="all">All usage</option>
                  <option value="Passenger">Passenger</option>
                  <option value="Goods">Goods</option>
                </select>
                <ChevronDown size={16} className="text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Toggles + Count */}
          <div className="px-5 pb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilters({ comm: !commercialOnly })}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${commercialOnly
                    ? "bg-[#34ebb1] border-[#34ebb1] text-slate-950 shadow-sm"
                    : "bg-white/70 border-white/70 text-slate-600 hover:bg-white hover:border-white/90"
                  }`}
              >
                <Truck size={16} /> Commercial
              </button>

              {/* <button
                onClick={() => updateFilters({ avail: !launchedOnly })}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${launchedOnly
                    ? "bg-[#34ebb1] border-[#34ebb1] text-slate-950 shadow-sm"
                    : "bg-white/70 border-white/70 text-slate-600 hover:bg-white hover:border-white/90"
                  }`}
              >
                <BadgeCheck size={16} /> Now
              </button> */}

              <button
                onClick={() => updateFilters({ upcoming: !comingSoonOnly })}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${comingSoonOnly
                    ? "bg-[#34ebb1] border-[#34ebb1] text-slate-950 shadow-sm"
                    : "bg-white/70 border-white/70 text-slate-600 hover:bg-white hover:border-white/90"
                  }`}
              >
                <CalendarDays size={16} />Coming Soon
              </button>

              <button
                onClick={() => updateFilters({ baas: !baasOnly })}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${baasOnly
                    ? "bg-[#34ebb1] border-[#34ebb1] text-slate-950 shadow-sm"
                    : "bg-white/70 border-white/70 text-slate-600 hover:bg-white hover:border-white/90"
                  }`}
              >
                <Zap size={16} /> BAAS
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/60 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-all"
                >
                  <X size={16} /> Clear
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="text-slate-500">
                <span className="font-semibold text-slate-800">{filteredItems.length}</span> of {items.length}
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-5 py-2.5 text-sm font-semibold hover:bg-white hover:border-white active:scale-[0.985] transition-all"
              >
                {shared ? <Check className="text-emerald-500" size={17} /> : <Share2 size={17} />}
                {shared ? "Link copied" : "Share catalog"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Grid ── */}
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-white/70 flex items-center justify-center mb-6">
            <Zap size={42} className="text-slate-300" />
          </div>
          <p className="text-lg font-medium text-slate-600">Couldn&apos;t load listings</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-white/70 flex items-center justify-center mb-6">
            <Zap size={42} className="text-slate-300" />
          </div>
          <p className="text-lg font-medium text-slate-600">No matches found</p>
          <button onClick={clearAll} className="mt-4 text-[#34ebb1] hover:underline text-sm font-medium">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.slice(0, visibleCount).map((item, index) => {
              const launched = isLaunched(item.launchdate);
              const launchLabel = formatLaunchDate(item.launchdate);
              const slug = item.slug ?? toSlug(item.brand, item.name);

              return (
                <Link
                  key={slug}
                  href={`/product/${slug}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-white/70 shadow-lg shadow-slate-950/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col active:scale-[0.985]"
                >
                  {/* Image Container - Glass accent */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                    {item.photo ? (
                      <Image
                        src={item.photo}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        <Zap size={48} className="text-slate-200" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-2xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xl ${launched 
                      ? "bg-emerald-500/90 text-white" 
                      : "bg-amber-400/90 text-slate-900"}`}>
                      {launched ? <BadgeCheck size={13} /> : <CalendarDays size={13} />}
                      {launchLabel}
                    </div>

                    {item.commercial && (
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-2xl bg-orange-500/90 text-white text-xs font-semibold flex items-center gap-1 backdrop-blur-xl">
                        <Truck size={13} /> Commercial
                      </div>
                    )}

                    {/* Compare Button - Glass orb */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isInCompare(slug) ? removeFromCompare(slug) : addToCompare(slug);
                      }}
                      className={`absolute bottom-4 left-4 w-9 h-9 rounded-2xl flex items-center justify-center backdrop-blur-2xl border border-white/70 transition-all ${isInCompare(slug)
                          ? "bg-[#34ebb1] text-white shadow-lg"
                          : "bg-white/80 hover:bg-white text-slate-600"
                        }`}
                    >
                      <GitCompare size={17} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="uppercase text-[10px] tracking-[0.125em] font-semibold text-[#34ebb1]">{item.brand}</div>
                        <h3 className="font-semibold text-[17px] leading-tight text-slate-900 mt-1 line-clamp-2">{item.name}</h3>
                      </div>
                      {item.type && (
                        <div className="px-3 py-1 text-xs font-medium bg-slate-100 rounded-2xl text-slate-600 shrink-0">
                          {item.type}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {item.pricing && (
                        <div className="font-semibold text-slate-900">
                          {item.pricing}
                          {item.baas && (
                            <span className="ml-2 text-xs font-mono bg-sky-100 text-sky-700 px-2 py-px rounded">BAAS</span>
                          )}
                        </div>
                      )}
                      {item.drivingRange && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Zap size={15} className="text-emerald-600" /> {item.drivingRange} km
                        </div>
                      )}
                      {item.topSpeed != null && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Gauge size={15} className="text-amber-600" /> {item.topSpeed} km/h
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions - Glass buttons */}
                  <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold py-3.5 rounded-2xl text-sm transition-all">
                      Details <ArrowUpRight size={16} />
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerEnquiryModal(`${item.brand} ${item.name}`); }}
                      className="bg-slate-900 hover:bg-[#34ebb1] active:bg-[#2ac99e] text-white font-semibold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.985]"
                    >
                      Enquire <Send size={16} />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Infinite Scroll Trigger */}
          {(visibleCount < filteredItems.length || !hasFetchedAll) && (
            <div ref={observerTarget} className="h-8 mt-8" />
          )}

          {loadingSkeleton && (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}