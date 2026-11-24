"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ShieldCheck, Car, Zap, Tag, ArrowRight, RotateCcw, BatteryCharging, Check } from "lucide-react";
import type { UsedVehicle } from "../lib/used-vehicles";
import UsedVehicleCard from "./UsedVehicleCard";

interface UsedCatalogClientProps {
  initialVehicles: UsedVehicle[];
}

export default function UsedCatalogClient({ initialVehicles }: UsedCatalogClientProps) {
  const [vehicles] = useState<UsedVehicle[]>(initialVehicles);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedBodyType, setSelectedBodyType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [pricePreset, setPricePreset] = useState<string>("all");
  const [minHealth, setMinHealth] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"featured" | "price_low" | "price_high" | "km_low" | "year_new" | "health_high">("featured");

  // Derive unique options
  const brands = useMemo(() => {
    const set = new Set(vehicles.map((v) => v.brand).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [vehicles]);

  const cities = useMemo(() => {
    const set = new Set(vehicles.map((v) => v.city).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [vehicles]);

  const bodyTypes = useMemo(() => {
    const set = new Set(vehicles.map((v) => v.body_type).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [vehicles]);

  // Counts by source
  const sourceCounts = useMemo(() => {
    const direct = vehicles.filter((v) => v.source_type === "direct").length;
    const dealer = vehicles.filter((v) => v.source_type === "dealer").length;
    const customer = vehicles.filter((v) => v.source_type === "customer").length;
    return { all: vehicles.length, direct, dealer, customer };
  }, [vehicles]);

  // Filtered & sorted vehicles
  const filteredVehicles = useMemo(() => {
    let result = vehicles.filter((v) => {
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          v.title.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.variant.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          (v.seller_name && v.seller_name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Brand
      if (selectedBrand !== "all" && v.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Source type
      if (selectedSource !== "all" && v.source_type !== selectedSource) {
        return false;
      }

      // Body Type
      if (selectedBodyType !== "all" && v.body_type.toLowerCase() !== selectedBodyType.toLowerCase()) {
        return false;
      }

      // City
      if (selectedCity !== "all" && v.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Battery Health
      if (minHealth > 0 && (v.battery_health_percentage ?? 0) < minHealth) {
        return false;
      }

      // Price preset
      if (pricePreset === "under5") {
        if (v.price > 500000) return false;
      } else if (pricePreset === "5to10") {
        if (v.price < 500000 || v.price > 1000000) return false;
      } else if (pricePreset === "10to15") {
        if (v.price < 1000000 || v.price > 1500000) return false;
      } else if (pricePreset === "above15") {
        if (v.price < 1500000) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "km_low") return a.odometer_km - b.odometer_km;
      if (sortBy === "year_new") return b.year - a.year;
      if (sortBy === "health_high") return (b.battery_health_percentage ?? 0) - (a.battery_health_percentage ?? 0);
      // "featured" default: featured first, then newest
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.year - a.year;
    });

    return result;
  }, [vehicles, search, selectedBrand, selectedSource, selectedBodyType, selectedCity, pricePreset, minHealth, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setSelectedBrand("all");
    setSelectedSource("all");
    setSelectedBodyType("all");
    setSelectedCity("all");
    setPricePreset("all");
    setMinHealth(0);
    setSortBy("featured");
  };

  return (
    <div className="space-y-8">
      {/* Search & Main Source Filter Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search make, model, city, e.g. Nexon EV Noida..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-xs outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Source Pills (Spinny / Assured vs Dealer vs Direct) */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
          {[
            { id: "all", label: "All Used EVs", count: sourceCounts.all },
            { id: "direct", label: "Evplse Assured", count: sourceCounts.direct },
            { id: "dealer", label: "Dealers", count: sourceCounts.dealer },
            { id: "customer", label: "Direct Owners", count: sourceCounts.customer },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSource(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                selectedSource === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  selectedSource === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="all">All Brands</option>
              {brands.filter((b) => b !== "all").map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">City / Location</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="all">All Locations</option>
              {cities.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Body Type */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Body Type</label>
            <select
              value={selectedBodyType}
              onChange={(e) => setSelectedBodyType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="all">All Types</option>
              {bodyTypes.filter((t) => t !== "all").map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Preset */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Budget Range</label>
            <select
              value={pricePreset}
              onChange={(e) => setPricePreset(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="all">Any Price</option>
              <option value="under5">Under ₹5 Lakh</option>
              <option value="5to10">₹5 - ₹10 Lakh</option>
              <option value="10to15">₹10 - ₹15 Lakh</option>
              <option value="above15">Above ₹15 Lakh</option>
            </select>
          </div>

          {/* Battery Health */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Battery Health</label>
            <select
              value={minHealth}
              onChange={(e) => setMinHealth(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="0">Any Health</option>
              <option value="90">90%+ SoH (Certified)</option>
              <option value="95">95%+ SoH (Like New)</option>
            </select>
          </div>
        </div>

        {/* Sort & Quick Reset */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-200/80 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600"
            >
              <option value="featured">Featured First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="km_low">KM: Lowest First</option>
              <option value="year_new">Model Year: Newest First</option>
              <option value="health_high">Battery Health: Highest First</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-600">
              Showing <strong>{filteredVehicles.length}</strong> {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}
            </span>

            {(selectedBrand !== "all" || selectedSource !== "all" || selectedBodyType !== "all" || selectedCity !== "all" || pricePreset !== "all" || minHealth > 0 || search) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <UsedVehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500">
            <Car size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No used EVs listed yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Our certified pre-owned inventory is being inspected right now — new listings appear here as soon as they are published.
          </p>
          <Link
            href="/sell-ev"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            Sell your EV <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500">
            <Car size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No used EVs match your selected filters</h3>
          <p className="mt-1 text-xs text-slate-500">Try loosening your price or location filters to see more vehicles.</p>
          <button
            onClick={resetFilters}
            className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Sell Your EV Promotional Banner */}
      <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-volt border border-emerald-400/30">
              <Tag size={13} /> Sell Your EV With Evezy
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Looking to sell your electric car or scooter?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Get an instant valuation based on real battery health, free doorstep inspection, and same-day payment with zero RC transfer hassle.
            </p>
          </div>

          <Link
            href="/sell-ev"
            className="inline-flex items-center gap-2 rounded-full bg-volt px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-md transition hover:bg-emerald-400 hover:scale-102"
          >
            <span>Get Instant Valuation</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
