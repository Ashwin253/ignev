"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Zap,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Car,
  Truck,
  Bike,
  Compass,
  Gauge,
  Info,
  X,
  Play,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WPUpdate, EvListing, HeroBanner } from "../lib/wordpress";
import { isLaunched } from "../lib/wordpress";
import { getVehiclePhoto, isTwoWheeler } from "../lib/vehicle-images";
import { matchesVehicleCategory } from "../lib/catalog-filters";
import { sortVehiclesByBrandRank } from "../lib/brand-rankings";

const VEHICLE_BACKGROUNDS = [
  "/listingbackground.jpg",
  "/listingbackgroundsecond.jpg",
  "/listingbackgroundthird.jpg",
  "/listingbackgroundforth.jpg",
  "/listingbackgroundfifth.jpg",
];

interface EcosystemSectionProps {
  updates?: WPUpdate[];
  listings?: EvListing[];
  banners?: HeroBanner[];
}

interface VehicleScrollSectionProps {
  type: "new" | "upcoming";
  items: EvListing[];
}

function VehicleScrollSection({ type, items }: VehicleScrollSectionProps) {
  const isUpcoming = type === "upcoming";
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(maxScroll > 0 && scrollLeft < maxScroll - 5);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items.length]);

  const scroll = (direction: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <section
      className={`relative overflow-hidden p-5 sm:p-6 lg:p-8 max-w-7xl mx-auto my-10 sm:my-16 rounded-3xl border backdrop-blur-xl transition-all shadow-lg ${
        isUpcoming
          ? "bg-amber-50/40 dark:bg-[#151006]/40 border-amber-200/50 dark:border-amber-900/30 shadow-amber-500/5"
          : "bg-emerald-50/30 dark:bg-[#071E15]/40 border-[#D8E3D3]/60 dark:border-emerald-900/30 shadow-emerald-900/5"
      }`}
    >
      {/* Background Stylized Typographic Watermark (Behind the vehicle cards) */}
      <div
        aria-hidden="true"
        className={`absolute -top-3 left-3 sm:left-6 text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter uppercase select-none pointer-events-none leading-none transition-opacity ${
          isUpcoming
            ? "text-amber-500/10 dark:text-amber-400/10"
            : "text-[#1F7A4D]/8 dark:text-[#8FE24A]/8"
        }`}
      >
        {isUpcoming ? "Upcoming" : "Releases"}
      </div>

      {/* Subtle ambient decorative gradient orbs */}
      <div
        aria-hidden="true"
        className={`absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isUpcoming ? "bg-amber-400/20 dark:bg-amber-500/10" : "bg-emerald-400/20 dark:bg-emerald-500/10"
        }`}
      />

      {/* Top Header: Sleek foreground header & scroll controls */}
      <div className="relative z-10 flex items-center justify-between gap-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              isUpcoming ? "bg-amber-500" : "bg-[#1F7A4D] dark:bg-[#8FE24A]"
            }`}
          />
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0A2A1E] dark:text-white tracking-tight">
            {isUpcoming ? "Upcoming Vehicles" : "New Releases"}
          </h2>
          {/* <span
            className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
              isUpcoming
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                : "bg-[#1F7A4D]/10 text-[#1F7A4D] dark:text-[#8FE24A] border-[#1F7A4D]/20"
            }`}
          >
            {isUpcoming ? "Preview" : "Latest"}
          </span> */}
        </div>

        {/* Navigation Arrow Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed shadow-xs active:scale-95 bg-white/80 dark:bg-[#0B2117]/80 backdrop-blur-md border-slate-200/80 dark:border-emerald-800/40 text-[#0A2A1E] dark:text-emerald-100 hover:bg-white dark:hover:bg-[#0F2A1E]"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed shadow-xs active:scale-95 bg-white/80 dark:bg-[#0B2117]/80 backdrop-blur-md border-slate-200/80 dark:border-emerald-800/40 text-[#0A2A1E] dark:text-emerald-100 hover:bg-white dark:hover:bg-[#0F2A1E]"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Middle: Full-width horizontal scroll of vehicle cards (layered over watermark) */}
      <div className="relative z-10 overflow-hidden">
        <div
          ref={rowRef}
          className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide scroll-smooth flex gap-3.5 sm:gap-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((l, i) => {
            const pricing = l.prices?.length ? (
              parseFloat(String(l.prices[0])) > 100
                ? `₹${(parseFloat(String(l.prices[0])) / 100000).toFixed(2)}L`
                : `₹${l.prices[0]}L`
            ) : (l as any).price_bracket || "";
            const range = l.batteryVariants?.[0]?.range || "";
            const bgImage = VEHICLE_BACKGROUNDS[i % VEHICLE_BACKGROUNDS.length];
            return (
              <Link
                key={l.slug || i}
                href={`/product/${l.slug}`}
                className={`group flex-shrink-0 w-[230px] sm:w-[250px] rounded-2xl border overflow-hidden transition-all flex flex-col justify-between backdrop-blur-lg shadow-xs hover:shadow-xl hover:-translate-y-1 duration-300 ${
                  isUpcoming
                    ? "bg-white/50 hover:bg-white/80 dark:bg-[#1A1407]/45 dark:hover:bg-[#1A1407]/65 border-white/70 hover:border-amber-400/80 dark:border-amber-900/40 dark:hover:border-amber-400"
                    : "bg-white/50 hover:bg-white/80 dark:bg-[#071E15]/45 dark:hover:bg-[#071E15]/65 border-white/70 hover:border-emerald-400/80 dark:border-emerald-900/40 dark:hover:border-[#8FE24A]"
                }`}
              >
                <div 
                  className="relative h-32 sm:h-36 overflow-hidden bg-white/30 dark:bg-black/20"
                  style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                >
                  <Image
                    src={getVehiclePhoto(l.photo, l)}
                    alt={l.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="250px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  {/* {isUpcoming ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-xs text-[10px] font-bold text-zinc-950 shadow-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Upcoming
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#1F7A4D]/90 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs">
                      New Release
                    </span>
                  )} */}
                </div>
                <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isUpcoming ? "text-amber-600 dark:text-amber-400/80" : "text-[#1F7A4D] dark:text-emerald-400/80"
                      }`}
                    >
                      {l.brand}
                    </p>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0A2A1E] dark:text-white mt-0.5 line-clamp-1 group-hover:underline">
                      {l.title}
                    </h3>
                  </div>
                  <div
                    className={`flex items-center justify-between mt-2.5 pt-2 border-t ${
                      isUpcoming ? "border-amber-200/50 dark:border-amber-900/30" : "border-[#D0E2CC]/60 dark:border-emerald-900/30"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isUpcoming ? "text-amber-700 dark:text-amber-400" : "text-[#1F7A4D] dark:text-[#8FE24A]"
                      }`}
                    >
                      {pricing || "TBA"}
                    </span>
                    {range && (
                      <span className="text-[10px] font-mono text-[#6C8377] dark:text-slate-300/60">
                        {range} km
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}

          {/* End Card */}
          <Link
            href={isUpcoming ? "/upcoming" : "/catalog"}
            className={`group flex-shrink-0 w-[160px] sm:w-[180px] rounded-2xl border border-dashed overflow-hidden transition-all flex flex-col items-center justify-center text-center p-4 sm:p-5 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 duration-300 ${
              isUpcoming
                ? "border-amber-300/60 bg-white/40 hover:bg-white/70 dark:bg-amber-950/20 hover:dark:bg-amber-900/30"
                : "border-emerald-300/60 bg-white/40 hover:bg-white/70 dark:bg-emerald-950/20 hover:dark:bg-emerald-900/30"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110 shadow-xs ${
                isUpcoming ? "bg-amber-500 text-slate-950" : "bg-[#1F7A4D] text-white"
              }`}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#0A2A1E] dark:text-white">
              {isUpcoming ? "View All Upcoming" : "View All Launches"}
            </span>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Explore catalog
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Footer Row: View All CTA button positioned on bottom-right front */}
      <div className="relative z-10 flex items-end justify-end mt-3 pt-2.5 border-t border-black/5 dark:border-white/5">
        {/* <span className="text-[11px] font-semibold text-[#6C8377] dark:text-slate-400">
          {items.length} {isUpcoming ? "upcoming models" : "models available"}
        </span> */}

        <Link
          href={isUpcoming ? "/upcoming" : "/catalog"}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs group ${
            isUpcoming
              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              : "bg-[#1F7A4D] hover:bg-[#289660] text-white shadow-emerald-900/20"
          }`}
        >
          <span>{isUpcoming ? "View All Upcoming" : "View All Launches"}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

type CategoryTab = "bike" | "scooter" | "cars" | "commercial";

const CATEGORY_TABS: CategoryTab[] = ["bike", "scooter", "cars", "commercial"];

const CATEGORY_CONFIG: Record<
  CategoryTab,
  {
    label: string;
    sublabel: string;
    watermark: string;
    icon: React.ElementType;
    catalogHref: string;
  }
> = {
  bike: {
    label: "Bike",
    sublabel: "Electric Motorcycles & Performance Bikes",
    watermark: "BIKES",
    icon: Bike,
    catalogHref: "/buy-ev?type=bike",
  },
  scooter: {
    label: "Scooter",
    sublabel: "Electric Scooters & Daily Commuters",
    watermark: "SCOOTER",
    icon: Bike,
    catalogHref: "/buy-ev?type=scooter",
  },
  cars: {
    label: "Cars",
    sublabel: "Cars, SUVs, Sedans & Passenger Vans",
    watermark: "CARS",
    icon: Car,
    catalogHref: "/buy-ev?type=cars",
  },
  commercial: {
    label: "Commercial",
    sublabel: "Commercial Fleet, Trucks, Cargo & 3-Wheelers",
    watermark: "COMMERCIAL",
    icon: Truck,
    catalogHref: "/buy-ev?type=commercial",
  },
};

function VehicleCategorySelector({ listings = [] }: { listings?: EvListing[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("bike");
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(maxScroll > 0 && scrollLeft < maxScroll - 5);
  };

  const scroll = (direction: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Filter matching vehicles based on active category tab using shared matcher & sort by brand rank
  const filteredListings = useMemo(() => {
    const matched = listings.filter((l) => matchesVehicleCategory(l, activeCategory));
    return sortVehiclesByBrandRank(matched, activeCategory);
  }, [listings, activeCategory]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "smooth" });
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [activeCategory, filteredListings.length]);

  const currentConfig = CATEGORY_CONFIG[activeCategory];
  const viewAllHref = currentConfig.catalogHref;

  return (
    <section
      className="relative overflow-hidden p-5 sm:p-6 lg:p-8 max-w-7xl mx-auto my-10 sm:my-16 rounded-3xl border backdrop-blur-xl transition-all shadow-lg bg-[#f9f5e8] dark:bg-[#071E15]/40 border-[#D8E3D3]/60 dark:border-emerald-900/30 shadow-emerald-900/5"
    >
      {/* Background Typographic Watermark (Behind the vehicle cards) */}
      <div
        aria-hidden="true"
        className="absolute -top-3 left-3 sm:left-6 text-5xl sm:text-8xl lg:text-9xl font-black tracking-tighter uppercase select-none pointer-events-none leading-none opacity-30 sm:opacity-100 text-[#7d817e]/30 dark:text-[#8FE24A]/8"
      >
        {currentConfig.watermark}
      </div>

      {/* Subtle ambient decorative gradient orbs */}
      <div
        aria-hidden="true"
        className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 bg-emerald-400/20 dark:bg-emerald-500/10"
      />

      {/* Top Header Row: Category Selector Tabs and Navigation Controls */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
        {/* Left Side: Mobile dropdown OR desktop pill tabs */}
        <div className="flex items-center gap-2 min-w-0">
          {/* MOBILE: native select dropdown (hidden on sm+) */}
          <div className="relative sm:hidden">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value as CategoryTab)}
              className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl text-sm font-bold bg-white/90 dark:bg-[#0B2117]/90 text-[#0A2A1E] dark:text-emerald-100 border border-[#D8E3D3] dark:border-emerald-800/40 backdrop-blur-md shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1F7A4D]/40 cursor-pointer"
            >
              {CATEGORY_TABS.map((tabKey) => (
                <option key={tabKey} value={tabKey}>
                  {CATEGORY_CONFIG[tabKey].label}
                </option>
              ))}
            </select>
            {/* chevron icon overlay */}
            <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-[#1F7A4D] dark:text-[#8FE24A]" />
          </div>

          {/* DESKTOP: pill tab bar (hidden on mobile) - bigger and prominent */}
          <div className="hidden sm:flex items-center gap-1.5 p-1.5 rounded-2xl md:rounded-3xl bg-white/80 dark:bg-black/40 backdrop-blur-md border border-[#D8E3D3]/80 dark:border-emerald-900/40 shadow-xs">
            {CATEGORY_TABS.map((tabKey) => {
              const tab = CATEGORY_CONFIG[tabKey];
              const Icon = tab.icon;
              const isActive = activeCategory === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveCategory(tabKey)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 rounded-xl md:rounded-2xl text-sm lg:text-base font-extrabold transition-all cursor-pointer select-none shrink-0 ${
                    isActive
                      ? "text-white dark:text-[#07130E]"
                      : "text-[#3C5347] dark:text-slate-300 hover:text-[#0A2A1E] dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute inset-0 rounded-xl md:rounded-2xl bg-[#1F7A4D] dark:bg-[#8FE24A] shadow-md"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Scroll Navigation Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed shadow-xs active:scale-95 bg-white/80 dark:bg-[#0B2117]/80 backdrop-blur-md border-slate-200/80 dark:border-emerald-800/40 text-[#0A2A1E] dark:text-emerald-100 hover:bg-white dark:hover:bg-[#0F2A1E]"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed shadow-xs active:scale-95 bg-white/80 dark:bg-[#0B2117]/80 backdrop-blur-md border-slate-200/80 dark:border-emerald-800/40 text-[#0A2A1E] dark:text-emerald-100 hover:bg-white dark:hover:bg-[#0F2A1E]"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Middle: Full-width Horizontal Scroll of Vehicle Cards */}
      <div className="relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div
              ref={rowRef}
              className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide scroll-smooth flex gap-3.5 sm:gap-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {filteredListings.slice(0, 16).map((l, i) => {
                const pricing = l.prices?.length
                  ? parseFloat(String(l.prices[0])) > 100
                    ? `₹${(parseFloat(String(l.prices[0])) / 100000).toFixed(2)}L`
                    : `₹${l.prices[0]}L`
                  : (l as any).price_bracket || "";
                const range = l.batteryVariants?.[0]?.range || "";
                const topSpeed = l.topSpeed || "";
                const bgImage = VEHICLE_BACKGROUNDS[i % VEHICLE_BACKGROUNDS.length];

                return (
                  <Link
                    key={l.slug || i}
                    href={`/product/${l.slug}`}
                    className="group flex-shrink-0 w-[230px] sm:w-[250px] rounded-2xl border overflow-hidden transition-all flex flex-col justify-between backdrop-blur-lg shadow-xs hover:shadow-xl hover:-translate-y-1 duration-300 bg-white/50 hover:bg-white/80 dark:bg-[#071E15]/45 dark:hover:bg-[#071E15]/65 border-white/70 hover:border-emerald-400/80 dark:border-emerald-900/40 dark:hover:border-[#8FE24A]"
                  >
                    <div 
                      className="relative h-32 sm:h-36 overflow-hidden bg-white/30 dark:bg-black/20"
                      style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                    >
                      <Image
                        src={getVehiclePhoto(l.photo, l)}
                        alt={l.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="250px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </div>

                    <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#1F7A4D] dark:text-emerald-400/80">
                          {l.brand}
                        </p>
                        <h3 className="text-xs sm:text-sm font-bold text-[#0A2A1E] dark:text-white mt-0.5 line-clamp-1 group-hover:underline">
                          {l.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#D0E2CC]/60 dark:border-emerald-900/30">
                        <span className="text-xs font-bold text-[#1F7A4D] dark:text-[#8FE24A]">
                          {pricing || "TBA"}
                        </span>
                        {range ? (
                          <span className="text-[10px] font-mono text-[#6C8377] dark:text-slate-300/60">
                            {range} km
                          </span>
                        ) : topSpeed ? (
                          <span className="text-[10px] font-mono text-[#6C8377] dark:text-slate-300/60">
                            {topSpeed} km/h
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* End Card */}
              <Link
                href={viewAllHref}
                className="group flex-shrink-0 w-[160px] sm:w-[180px] rounded-2xl border border-dashed overflow-hidden transition-all flex flex-col items-center justify-center text-center p-4 sm:p-5 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 duration-300 border-emerald-300/60 bg-white/40 hover:bg-white/70 dark:bg-emerald-950/20 hover:dark:bg-emerald-900/30"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110 shadow-xs bg-[#1F7A4D] text-white">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#0A2A1E] dark:text-white">
                  View All {currentConfig.label}
                </span>
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Explore full catalog
                </span>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Footer Row: Dynamic CTA button on bottom-right */}
      <div className="relative z-10 flex items-end justify-end mt-3 pt-2.5 border-t border-black/5 dark:border-white/5">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs group bg-[#2e3230] hover:bg-[#289660] text-white hover:text-black shadow-emerald-900/20"
        >
          <span>View All {currentConfig.label}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

export default function EcosystemSection({ updates = [], listings = [], banners = [] }: EcosystemSectionProps) {
  const router = useRouter();
  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  // Banner slider state
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [showBannerDetails, setShowBannerDetails] = useState(false);
  const activeBanners = useMemo(() => banners ?? [], [banners]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % activeBanners.length);
      setShowBannerDetails(false);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners]);

  // Stats count animation
  const [countProgress, setCountProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setCountProgress(1), 300);
    return () => clearTimeout(timer);
  }, []);

  // Fallback reviews/updates if WP updates empty
  const displayUpdates = updates.length > 0 ? updates.slice(0, 3) : [
    {
      id: 1,
      title: "Tata Punch EV vs Mahindra XUV400 — Real-World Range & Efficiency Test",
      slug: "tata-punch-ev-vs-mahindra-xuv400",
      excerpt: "We drove both electric SUVs across city highways and steep climbs to see which vehicle delivers closer to claimed range.",
      date: new Date().toISOString(),
      photo: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80"
    },
    {
      id: 2,
      title: "Ather Rizta 6-Month Ownership Review: Real Costs & Battery Health",
      slug: "ather-rizta-ownership-review",
      excerpt: "Analyzing maintenance expenses, daily commuting comfort, software updates, and degradation over 5,000 km.",
      date: new Date().toISOString(),
      photo: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"
    },
    {
      id: 3,
      title: "Commercial EV Charging Infrastructure Guide 2026: Fast vs Slow Charging",
      slug: "commercial-ev-charging-guide",
      excerpt: "A comprehensive breakdown of charging standards, transformer capacity requirements, and operational savings for fleets.",
      date: new Date().toISOString(),
      photo: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80"
    }
  ];

  return (
    <div 
      className="w-full bg-[#F6F8F2] pt-24 sm:pt-28 dark:bg-[#07130E] text-[#0E1F16] dark:text-slate-100 font-sans overflow-hidden transition-colors duration-1000 relative z-0"
    >
      {/* 1. HERO / ECOSYSTEM BANNER (Natural Webpage Background for Left Panel, Dedicated Card for Right Panel) */}
      <section className="relative mx-auto mb-12 sm:mb-16 max-w-7xl px-5 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">
          {/* Hero Left Content: Directly on Natural Webpage Background */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-[#0A2A1E] dark:text-white">
              India's <span className="text-[#1F7A4D] dark:text-[#8FE24A]">Trusted</span> Electric Mobility Platform.
            </h1>

            {/* Unified Search Capsule */}
            <div className="w-full bg-white dark:bg-[#0B2117]/90 border border-[#bfe3e1]/70 dark:border-emerald-800/40 rounded-3xl p-2 sm:p-2.5 shadow-[0_20px_50px_-18px_rgba(47,143,34,0.15)] max-w-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = heroSearchQuery.trim();
                  if (q) {
                    router.push(`/catalog?q=${encodeURIComponent(q)}`);
                  } else {
                    router.push("/catalog");
                  }
                }}
                className="flex items-center gap-2 bg-[#f5faf9] dark:bg-[#071912] border border-[#bfe3e1]/65 dark:border-emerald-800/50 rounded-full px-3.5 sm:px-4 py-1 sm:py-1.5 focus-within:border-[#1F7A4D] transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#2f8f22] dark:text-[#8FE24A] shrink-0" />
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#0A2A1E] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                  placeholder="Search EV models, specs, range..."
                />
                <button
                  type="submit"
                  className="bg-[#2f8f22] hover:bg-[#256f1b] dark:bg-[#8FE24A] dark:hover:bg-[#a0f05d] text-white dark:text-[#07130E] h-8 sm:h-9 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Search
                </button>
              </form>
              <div className="h-px bg-[#bfe3e1]/40 dark:bg-emerald-800/30 mx-3 my-2" />
              <div className="flex gap-2 px-1 pb-0.5">
                <Link
                  href="/catalog"
                  className="flex-1 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-zinc-50 dark:bg-[#0F2A1E] dark:hover:bg-[#143627] text-[#0A2A1E] dark:text-emerald-100 border border-zinc-200/80 dark:border-emerald-800/40 grid place-items-center transition-colors shadow-xs"
                >
                  View All
                </Link>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
                  className="flex-1 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-bold bg-[#bfe3e1]/70 hover:bg-[#bfe3e1] dark:bg-[#1F7A4D]/40 dark:hover:bg-[#1F7A4D]/60 text-[#0A2A1E] dark:text-[#8FE24A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Ask Plse
                </button>
              </div>
            </div>
          </div>

          {/* Hero Right Panel: Dedicated Modern Banner Card */}
          <div className="lg:col-span-7">
            <div
              className="relative w-full h-[200px] sm:h-[360px] lg:h-[450px] rounded-3xl border border-[#D8E3D3] dark:border-emerald-900/40 shadow-xl overflow-hidden flex flex-col justify-end"
              style={
                activeBanners[currentBannerIdx]?.background_color
                  ? { backgroundColor: activeBanners[currentBannerIdx].background_color }
                  : undefined
              }
            >
              {/* Banner Media Layer */}
              {activeBanners.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBannerIdx}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 w-full h-full z-0"
                  >
                    {activeBanners[currentBannerIdx].video_url ? (
                      <video
                        src={activeBanners[currentBannerIdx].video_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={
                          activeBanners[currentBannerIdx].imageHorizontal ||
                          activeBanners[currentBannerIdx].image_horizontal ||
                          activeBanners[currentBannerIdx].imageVertical ||
                          activeBanners[currentBannerIdx].image_vertical ||
                          "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&auto=format&fit=crop&q=80"
                        }
                        alt={activeBanners[currentBannerIdx].details || "EV Banner"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                /* Fallback when activeBanners is empty */
                <div className="absolute inset-0 w-full h-full z-0">
                  <img
                    src="https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&auto=format&fit=crop&q=80"
                    alt="EV Ecosystem"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Bottom Actions Panel with CTA, Info toggle and Pagination */}
              <div className="relative z-10 p-4 sm:p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                {activeBanners.length > 0 && activeBanners[currentBannerIdx] ? (
                  <div className="space-y-3">
                    {/* Animated Details Popover when 'i' is clicked */}
                    <AnimatePresence>
                      {showBannerDetails && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                          className="p-3.5 sm:p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-2xl max-w-lg"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <Info className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
                                {activeBanners[currentBannerIdx].details || activeBanners[currentBannerIdx].label || "India's Electric Mobility Platform"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowBannerDetails(false)}
                              className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-full hover:bg-white/10 cursor-pointer"
                              aria-label="Close details"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottom Controls Bar */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: CTA Button + Info Icon */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={activeBanners[currentBannerIdx].href || "/catalog"}
                          className="inline-flex items-center gap-0 sm:gap-2 bg-[#8FE24A] hover:bg-[#a0f05d] text-[#07130E] font-bold px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all transform hover:scale-105 shadow-lg shadow-[#8FE24A]/20 group"
                        >
                          <span className="hidden sm:inline">{activeBanners[currentBannerIdx].cta || "Explore Now"}</span>
                          <ArrowRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>

                        {(activeBanners[currentBannerIdx].details || activeBanners[currentBannerIdx].label) && (
                          <button
                            type="button"
                            onClick={() => setShowBannerDetails((prev) => !prev)}
                            className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all backdrop-blur-md cursor-pointer ${
                              showBannerDetails
                                ? "bg-[#8FE24A] text-[#07130E] border-[#8FE24A] shadow-md shadow-[#8FE24A]/20"
                                : "bg-black/50 hover:bg-black/70 text-white border-white/20 hover:border-white/40"
                            }`}
                            title={showBannerDetails ? "Hide details" : "Show details"}
                            aria-label="Toggle banner details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Right: Pagination dots if multiple banners exist */}
                      {activeBanners.length > 1 && (
                        <div className="flex gap-1.5 items-center bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
                          {activeBanners.map((b: any, idx: number) => (
                            <button
                              key={b.id || idx}
                              onClick={() => {
                                setCurrentBannerIdx(idx);
                                setShowBannerDetails(false);
                              }}
                              className={`h-2 rounded-full transition-all cursor-pointer ${
                                currentBannerIdx === idx ? "w-6 bg-[#8FE24A]" : "w-2 bg-white/40 hover:bg-white/70"
                              }`}
                              aria-label={`Go to banner ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/catalog"
                      className="inline-flex items-center gap-2 bg-[#8FE24A] text-[#07130E] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg group"
                    >
                      <span>Explore Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE VEHICLE CATEGORY & COMMERCIAL SELECTOR (Replaces Stats & Explore Grid) */}
      <VehicleCategorySelector listings={listings} />

      {/* 3. NEW RELEASES SECTION (Vehicle Cards) */}
      <VehicleScrollSection
        type="new"
        items={listings.filter((l) => isLaunched(l.launchdate)).slice(0, 12)}
      />

      {/* 4. UPCOMING VEHICLES SECTION */}
      <VehicleScrollSection
        type="upcoming"
        items={listings.filter((l) => !isLaunched(l.launchdate)).slice(0, 12)}
      />

      {/* 4. WHY EVPLSE SECTION */}
      <section className="py-12 sm:py-20 px-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-6 sm:p-8 md:p-12 rounded-3xl bg-[#0A2A1E] dark:bg-[#071912] border border-[#184834] dark:border-emerald-800/40 text-white relative overflow-hidden shadow-xl">
          {/* Ambient radial glow for contrast and depth */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1F7A4D]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8FE24A]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mb-6 sm:mb-10 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#8FE24A]/20 text-[#8FE24A] border border-[#8FE24A]/30 mb-3">
              The Difference
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">Why EVPLSE?</h2>
            <p className="text-slate-200 dark:text-emerald-100/90 text-sm sm:text-base mt-2 font-normal leading-relaxed">
              Trust isn't claimed — it's built into how the platform works.
            </p>
          </div>

          {/* Mobile: horizontal drag-scroll. md+: 3-column grid */}
          <div className="relative z-10 -mx-6 px-6 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 overflow-x-auto md:overflow-visible scrollbar-hide">
            <div className="flex gap-4 md:grid md:grid-cols-3 md:gap-6 pb-4 md:pb-0">
              {/* Card 1: Trust */}
              <div className="flex-shrink-0 w-[78vw] sm:w-[55vw] md:w-auto p-5 sm:p-6 md:p-7 rounded-2xl bg-white/10 dark:bg-[#0C241B] border border-white/15 dark:border-emerald-700/40 hover:border-[#8FE24A]/60 transition-all backdrop-blur-md">
                <div className="text-xs font-mono font-bold text-[#8FE24A] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8FE24A]" />
                  01 — TRUST
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Trust</h3>
                <ul className="space-y-3 text-sm text-slate-100 dark:text-emerald-100 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Verified information, not marketing copy</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>No paid rankings, ever</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Transparent, side-by-side comparisons</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Expertise */}
              <div className="flex-shrink-0 w-[78vw] sm:w-[55vw] md:w-auto p-5 sm:p-6 md:p-7 rounded-2xl bg-white/10 dark:bg-[#0C241B] border border-white/15 dark:border-emerald-700/40 hover:border-[#8FE24A]/60 transition-all backdrop-blur-md">
                <div className="text-xs font-mono font-bold text-[#8FE24A] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8FE24A]" />
                  02 — EXPERTISE
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Expertise</h3>
                <ul className="space-y-3 text-sm text-slate-100 dark:text-emerald-100 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Backed by industry experts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Real-world, on-road testing</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>The latest EV insights, explained simply</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Ecosystem */}
              <div className="flex-shrink-0 w-[78vw] sm:w-[55vw] md:w-auto p-5 sm:p-6 md:p-7 rounded-2xl bg-white/10 dark:bg-[#0C241B] border border-white/15 dark:border-emerald-700/40 hover:border-[#8FE24A]/60 transition-all backdrop-blur-md">
                <div className="text-xs font-mono font-bold text-[#8FE24A] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8FE24A]" />
                  03 — ECOSYSTEM
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Ecosystem</h3>
                <ul className="space-y-3 text-sm text-slate-100 dark:text-emerald-100 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Vehicles, charging &amp; finance</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Insurance &amp; genuine parts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Fleet management — everything connected</span>
                  </li>
                </ul>
              </div>
            </div>{/* end scroll/grid wrapper */}
          </div>
        </div>
      </section>

      {/* 5. REVIEWS, COMPARISONS & INSIGHT */}
      <section className="py-12 sm:py-20 px-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <div className="text-xs font-mono text-[#1F7A4D] dark:text-[#8FE24A] tracking-wider uppercase mb-2">Fresh From The Road</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2A1E] dark:text-white">Reviews, comparisons &amp; insight.</h2>
            <p className="text-[#3C5347] dark:text-emerald-100/70 text-sm mt-1">
              Real testing, honest opinions, and in-depth EV insights — updated regularly.
            </p>
          </div>
          <Link
            href="/updates"
            className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-[#1F7A4D] dark:text-[#8FE24A] hover:underline"
          >
            SEE ALL UPDATES <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayUpdates.slice(0, 3).map((item: any, idx: number) => {
            const articleHref = item?.href || `/updates/${item?.slug || ""}`;
            const categoryTag = idx === 0 ? "Comparison" : idx === 1 ? "Review" : "Guide";
            return (
              <Link
                key={item?.id || idx}
                href={articleHref}
                className="group rounded-2xl bg-white dark:bg-[#0B2117] border border-[#D8E3D3] dark:border-emerald-900/40 hover:border-[#2C9A5F] dark:hover:border-emerald-500/40 overflow-hidden flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-xl transition-all min-h-[440px]"
              >
                <div>
                  <div className="relative h-52 w-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                    {item?.photo ? (
                      <Image
                        src={item.photo}
                        alt={item.title || "Editorial Article"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#EBF1E5] dark:bg-emerald-900/40 text-[#1F7A4D] dark:text-emerald-500">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    <span className="absolute top-3 left-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0A2A1E]/85 text-[#8FE24A] px-2.5 py-1 rounded-full border border-emerald-700/40 backdrop-blur-sm">
                      {categoryTag}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-[#0A2A1E] dark:text-white leading-snug group-hover:text-[#1F7A4D] dark:group-hover:text-[#8FE24A] transition-colors line-clamp-2">
                      {item?.title}
                    </h3>
                    <p className="text-xs text-[#6C8377] dark:text-emerald-100/60 mt-2 line-clamp-3 leading-relaxed">
                      {item?.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 flex items-center justify-between text-[11px] font-mono text-[#6C8377] dark:text-emerald-400/60 border-t border-[#D8E3D3] dark:border-emerald-900/30">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item?.date ? new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Latest"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#1F7A4D] dark:text-[#8FE24A] group-hover:translate-x-1 transition-transform">
                    READ ARTICLE <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. TOOLS BANNER */}
      <section className="py-12 sm:py-20 px-5 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D8E3D3] dark:border-emerald-900/30">
        <div className="mb-8 max-w-2xl">
          <div className="text-xs font-mono text-[#1F7A4D] dark:text-[#8FE24A] tracking-wider uppercase mb-2">Decide With Numbers</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2A1E] dark:text-white tracking-tight">
            Tools that do the maths for you.
          </h2>
          <p className="text-[#3C5347] dark:text-slate-300/70 mt-3 text-sm sm:text-base">
            Calculators built specifically for Indian EV buyers & operators.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Charging Calculator", desc: "Estimate charge time & cost for any EV battery", icon: Zap, tab: "charging" },
            { title: "Savings Calculator", desc: "Compare fuel vs EV running costs over years", icon: ArrowUpRight, tab: "savings" },
            { title: "EMI Calculator", desc: "Monthly loan payment & interest breakdown", icon: Gauge, tab: "emi" },
            { title: "Range Calculator", desc: "Real-world range based on driving conditions", icon: Sparkles, tab: "range" },
          ].map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link
                key={idx}
                href={`/tools?tab=${tool.tab}`}
                className="group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[150px] bg-white dark:bg-[#0B2117]/80 border-[#D8E3D3] dark:border-emerald-900/40 hover:border-[#2C9A5F] dark:hover:border-emerald-500/50 hover:bg-[#F0F5EC] dark:hover:bg-[#0F2A1E]"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-[#EBF1E5] dark:bg-emerald-950 border border-[#D8E3D3] dark:border-emerald-800/40 text-[#1B6642] dark:text-[#8FE24A] group-hover:bg-[#0A2A1E] group-hover:text-white dark:group-hover:bg-[#8FE24A] dark:group-hover:text-[#07130E]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 transition-all text-[#6C8377] dark:text-emerald-400/50 group-hover:text-[#1F7A4D] dark:group-hover:text-[#8FE24A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mt-4 text-[#0A2A1E] dark:text-white">{tool.title}</h3>
                  <p className="text-[11px] mt-1 text-[#6C8377] dark:text-emerald-200/60">{tool.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}