"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Send, Truck, Zap, Gauge,
  CalendarDays, BadgeCheck, ChevronDown, X, SlidersHorizontal, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerEnquiryModal } from "./EnquiryModal";
import { formatLaunchDate, isLaunched } from "../lib/wordpress";

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
  commercial?: boolean;
  launchdate?: string | null;
  prices?: string[];
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
  if (bucket === "0-5")   return low < 5;
  if (bucket === "5-15")  return low >= 5 && low < 15;
  if (bucket === "15-30") return low >= 15 && low < 30;
  if (bucket === "30+")   return low >= 30;
  return true;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CatalogBrowser({ items }: { items: CatalogItem[] }) {
  const [query, setQuery]                   = useState("");
  const [category, setCategory]             = useState("all");
  const [brand, setBrand]                   = useState("all");
  const [price, setPrice]                   = useState("all");
  const [commercialOnly, setCommercialOnly] = useState(false);
  const [launchedOnly, setLaunchedOnly]     = useState(false);
  const [filtersOpen, setFiltersOpen]       = useState(false); // mobile collapse

  const categoryOptions = useMemo(() => {
    const types = [...new Set(items.map((i) => i.type).filter(Boolean))].sort();
    return [{ value: "all", label: "All" }, ...types.map((t) => ({ value: t, label: t }))];
  }, [items]);

  const brandOptions = useMemo(() => {
    const brands = [...new Set(items.map((i) => i.brand).filter(Boolean))].sort();
    return ["all", ...brands];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q) &&
               !item.brand.toLowerCase().includes(q) &&
               !item.type.toLowerCase().includes(q)) return false;
      if (category !== "all" && item.type !== category) return false;
      if (brand !== "all" && item.brand !== brand) return false;
      if (!matchesPrice(item, price)) return false;
      if (commercialOnly && !item.commercial) return false;
      if (launchedOnly && !isLaunched(item.launchdate)) return false;
      return true;
    });
  }, [brand, category, commercialOnly, items, launchedOnly, price, query]);

  const hasActiveFilters = category !== "all" || brand !== "all" || price !== "all" || commercialOnly || launchedOnly || !!query;
  const activeFilterCount = [category !== "all", brand !== "all", price !== "all", commercialOnly, launchedOnly, !!query].filter(Boolean).length;

  const clearAll = () => {
    setQuery(""); setCategory("all"); setBrand("all");
    setPrice("all"); setCommercialOnly(false); setLaunchedOnly(false);
  };

  return (
    <div className="space-y-5">

      {/* ── Unified filter panel ── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden">

        {/* Mobile collapsed bar — tap to expand */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal size={16} className="text-slate-500 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-slate-700">
            {category !== "all" ? category : "All types"}
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-sky-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{filteredItems.length} results</span>
          {filtersOpen
            ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
            : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
        </div>

        {/* Filter body — always visible on md+, toggle on mobile */}
        <div className={filtersOpen ? "block" : "hidden md:block"}>

          {/* Row 1: Type pills */}
          <div className="px-4 pt-3 pb-3 border-b border-slate-100 md:pt-4">
          <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border shrink-0 ${
                  category === opt.value
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Search + dropdowns */}
        <div className="p-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1fr_1fr]">
          {/* Search */}
          <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search model, brand…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </label>

          {/* Brand */}
          <label className="relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
            <span className="text-xs font-semibold text-slate-400 shrink-0 hidden sm:block">Brand</span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-slate-700 cursor-pointer appearance-none pr-5"
            >
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b === "all" ? "All brands" : b}</option>
              ))}
            </select>
            <ChevronDown size={14} className="text-slate-400 shrink-0 absolute right-3 pointer-events-none" />
          </label>

          {/* Price */}
          <label className="relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
            <span className="text-xs font-semibold text-slate-400 shrink-0 hidden sm:block">Price</span>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-slate-700 cursor-pointer appearance-none pr-5"
            >
              <option value="all">All prices</option>
              <option value="0-5">Under ₹5L</option>
              <option value="5-15">₹5L – ₹15L</option>
              <option value="15-30">₹15L – ₹30L</option>
              <option value="30+">₹30L+</option>
            </select>
            <ChevronDown size={14} className="text-slate-400 shrink-0 absolute right-3 pointer-events-none" />
          </label>
        </div>

        {/* Row 3: Toggle chips + count */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCommercialOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                commercialOnly
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              <Truck size={12} /> Commercial
            </button>
            <button
              onClick={() => setLaunchedOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                launchedOnly
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
              }`}
            >
              <BadgeCheck size={12} /> Available now
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 shrink-0 hidden md:block">
            <span className="font-semibold text-slate-700">{filteredItems.length}</span> of {items.length}
          </p>
        </div>
        </div>{/* end collapsible */}
      </div>

      {/* ── Grid ── */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <Zap size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-600">No listings match your filters.</p>
          <button onClick={clearAll} className="mt-3 text-sm text-sky-600 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const launched = isLaunched(item.launchdate);
            const launchLabel = formatLaunchDate(item.launchdate);

            return (
              <Link
                key={`${item.brand}-${item.name}`}
                href={`/product/${item.slug ?? toSlug(item.brand, item.name)}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  {item.photo ? (
                    <Image
                      src={item.photo}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-sky-50 to-slate-100 flex items-center justify-center">
                      <Zap size={32} className="text-slate-300" />
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${
                    launched ? "bg-emerald-500/90 text-white" : "bg-amber-400/90 text-slate-900"
                  }`}>
                    {launched ? <><BadgeCheck size={11} /> Available</> : <><CalendarDays size={11} /> {launchLabel}</>}
                  </span>
                  {item.commercial && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-orange-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-white">
                      <Truck size={10} /> Commercial
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="grow p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600 truncate">{item.brand}</p>
                      <h2 className="mt-0.5 text-base font-semibold text-slate-900 line-clamp-1">{item.name}</h2>
                    </div>
                    {item.type && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                        {item.type}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {item.pricing && <span className="font-semibold text-slate-800">{item.pricing}</span>}
                    {item.topSpeed != null && (
                      <span className="inline-flex items-center gap-1">
                        <Gauge size={11} className="text-amber-500" />{item.topSpeed} km/h
                      </span>
                    )}
                  </div>
                </div>

                {/* Enquire */}
                <div className="px-4 pb-4">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerEnquiryModal(`${item.brand} ${item.name}`); }}
                    className="w-full bg-slate-900 hover:bg-sky-600 text-white py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    Enquire Now <Send size={13} />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
