"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Filter, Search, Send, Truck, Zap,
  MapPin, BatteryCharging, Gauge, CalendarDays, BadgeCheck,
} from "lucide-react";
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
  // Raw price array from WP e.g. ["10-15"] — used for accurate price filtering
  prices?: string[];
};

// ── Price filter ──────────────────────────────────────────────────────────────

function parsePriceLow(item: CatalogItem): number {
  // Try WP prices array first: ["10-15"] → 10
  if (item.prices?.length) {
    const raw = item.prices[0];
    const low = parseFloat(raw.split("-")[0]);
    if (!isNaN(low)) return low;
  }
  // Fall back to pricing string: "₹10 - 15 lakh" → 10
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
  const [query, setQuery]               = useState("");
  const [category, setCategory]         = useState("all");
  const [brand, setBrand]               = useState("all");
  const [price, setPrice]               = useState("all");
  const [commercialOnly, setCommercialOnly] = useState(false);
  const [launchedOnly, setLaunchedOnly] = useState(false);

  // Derive unique types and brands from actual data
  const categoryOptions = useMemo(() => {
    const types = [...new Set(items.map((i) => i.type).filter(Boolean))].sort();
    return [
      { value: "all", label: "All" },
      ...types.map((t) => ({ value: t, label: t })),
    ];
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

  return (
    <div className="space-y-6">

      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
        {categoryOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCategory(opt.value)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border shrink-0 ${
              category === opt.value
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:p-5">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Search */}
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={17} className="text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search model, brand or type…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          {/* Brand */}
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-transparent text-sm outline-none text-slate-700">
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b === "all" ? "All brands" : b}</option>
              ))}
            </select>
          </label>

          {/* Price */}
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-transparent text-sm outline-none text-slate-700">
              <option value="all">All prices</option>
              <option value="0-5">Under ₹5L</option>
              <option value="5-15">₹5L – ₹15L</option>
              <option value="15-30">₹15L – ₹30L</option>
              <option value="30+">₹30L+</option>
            </select>
          </label>

          {/* Sort placeholder — extend later */}
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select className="w-full bg-transparent text-sm outline-none text-slate-700" disabled>
              <option>Sort: Default</option>
            </select>
          </label>
        </div>
      </div>

      {/* Toggle chips + count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filteredItems.length}</span> of {items.length}
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCommercialOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              commercialOnly
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            <Truck size={14} /> Commercial
          </button>
          <button
            onClick={() => setLaunchedOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              launchedOnly
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
            }`}
          >
            <BadgeCheck size={14} /> Available now
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <Zap size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No listings match your filters.</p>
          <button onClick={() => { setQuery(""); setCategory("all"); setBrand("all"); setPrice("all"); setCommercialOnly(false); setLaunchedOnly(false); }} className="mt-4 text-sm text-sky-600 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const launched = isLaunched(item.launchdate);
            const launchLabel = formatLaunchDate(item.launchdate);

            return (
              <Link
                key={`${item.brand}-${item.name}`}
                href={`/product/${item.slug ?? toSlug(item.brand, item.name)}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  {item.photo ? (
                    <Image
                      src={item.photo}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-sky-50 to-slate-100 flex items-center justify-center">
                      <Zap size={32} className="text-slate-300" />
                    </div>
                  )}
                  {/* Launch badge */}
                  <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${
                    launched
                      ? "bg-emerald-500/90 text-white"
                      : "bg-amber-400/90 text-slate-900"
                  }`}>
                    {launched
                      ? <><BadgeCheck size={11} /> Available</>
                      : <><CalendarDays size={11} /> {launchLabel}</>
                    }
                  </span>
                  {/* Commercial badge */}
                  {item.commercial && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-orange-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-white">
                      <Truck size={10} /> Commercial
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="grow p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{item.brand}</p>
                      <h2 className="mt-0.5 text-lg font-semibold text-slate-900 line-clamp-1">{item.name}</h2>
                    </div>
                    {item.type && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.type}
                      </span>
                    )}
                  </div>

                  {/* Specs row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {item.pricing && (
                      <span className="font-semibold text-slate-800">{item.pricing}</span>
                    )}
                    {item.topSpeed != null && (
                      <span className="inline-flex items-center gap-1">
                        <Gauge size={11} className="text-amber-500" />{item.topSpeed} km/h
                      </span>
                    )}
                  </div>
                </div>

                {/* Enquire button */}
                <div className="px-5 pb-5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      triggerEnquiryModal(`${item.brand} ${item.name}`);
                    }}
                    className="w-full bg-slate-900 hover:bg-sky-600 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    Enquire Now <Send size={14} />
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
