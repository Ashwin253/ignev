"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  { ssr: false }
);
import {
  Zap,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Car,
  Truck,
  Bike,
  Compass,
  Gauge,
  Info,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  BatteryCharging,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WPUpdate, EvListing, HeroBanner } from "../lib/wordpress";
import { isLaunched } from "../lib/wordpress";
import { getVehiclePhoto, isTwoWheeler } from "../lib/vehicle-images";
import { matchesVehicleCategory } from "../lib/catalog-filters";
import { sortVehiclesByBrandRank, type BrandRankItem } from "../lib/brand-rankings";

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
  brandRankings?: BrandRankItem[];
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
    label: "Bikes",
    sublabel: "Electric Motorcycles & Performance Bikes",
    watermark: "BIKES",
    icon: Bike,
    catalogHref: "/buy-ev?type=bike",
  },
  scooter: {
    label: "Scooter",
    sublabel: "Electric Scooters & Daily Commuters",
    watermark: "SCOOTER",
    icon: Zap,
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

// Helper to parse launchdate string into a Date object
export function parseVehicleLaunchDate(launchdate: string | null | undefined): Date | null {
  if (!launchdate) return null;
  const raw = String(launchdate).trim();
  if (!raw) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM
  const ymMatch = raw.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (ymMatch) {
    const year = parseInt(ymMatch[1], 10);
    const month = parseInt(ymMatch[2], 10);
    return new Date(year, month, 0, 23, 59, 59);
  }

  // YYYY only
  if (/^\d{4}$/.test(raw)) {
    const year = parseInt(raw, 10);
    return new Date(year, 11, 31, 23, 59, 59);
  }

  // Q1-Q4 YYYY or seasonal
  const qMatch = raw.match(/(?:Q([1-4])|early|mid|late)\s*(\d{4})/i);
  if (qMatch) {
    const year = parseInt(qMatch[2] || qMatch[1], 10);
    if (!isNaN(year)) {
      return new Date(year, 11, 31, 23, 59, 59);
    }
  }

  const standard = new Date(raw);
  if (!isNaN(standard.getTime())) {
    return standard;
  }

  return null;
}

// Helper to check if a vehicle is strictly an upcoming / future release
export function isUpcomingVehicle(l: EvListing): boolean {
  // 1. Explicit upcoming boolean flags
  if (l.coming_soon || l.announced || l.concept) return true;

  // 2. Unannounced launch date with TBA or no pricing indicates upcoming model
  if (!l.launchdate) {
    const hasPrice = l.prices && l.prices.length > 0;
    return !hasPrice;
  }

  const raw = String(l.launchdate).trim().toLowerCase();
  if (raw === "tba" || raw.includes("coming soon") || raw.includes("expected") || raw.includes("unannounced")) {
    return true;
  }

  // 3. Parse date and check strictly if it is in the future relative to current date
  const parsedDate = parseVehicleLaunchDate(l.launchdate);
  if (parsedDate) {
    return parsedDate.getTime() > Date.now();
  }

  return false;
}

import { getVehicleCardSpecs } from "../lib/listing-specs";
export { getVehicleCardSpecs };

interface VehicleScrollSectionProps {
  type: "new" | "upcoming";
  items: EvListing[];
  categoryTab?: CategoryTab;
  categoryLabel?: string;
}

function VehicleScrollSection({
  type,
  items,
  categoryTab,
  categoryLabel,
}: VehicleScrollSectionProps) {
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
    el.scrollLeft = 0;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [categoryTab, items.length]);

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

  const catalogLink = categoryTab
    ? isUpcoming
      ? `/upcoming?type=${categoryTab}`
      : (CATEGORY_CONFIG[categoryTab]?.catalogHref || "/catalog")
    : isUpcoming
    ? "/upcoming"
    : "/catalog";

  const sectionHeading = isUpcoming
    ? (categoryLabel ? `Upcoming ${categoryLabel}` : "Upcoming Vehicles")
    : (categoryLabel ? `New ${categoryLabel} Releases` : "New Releases");

  const viewAllText = isUpcoming
    ? (categoryLabel ? `View All Upcoming ${categoryLabel}` : "View All Upcoming")
    : (categoryLabel ? `View All ${categoryLabel} Launches` : "View All Launches");

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={`relative overflow-hidden p-5 sm:p-6 lg:p-8 max-w-7xl mx-auto my-10 sm:my-16 rounded-3xl border backdrop-blur-xl transition-all shadow-lg ${
        isUpcoming
          ? "bg-amber-50/40 dark:bg-[#151006]/40 border-amber-200/50 dark:border-amber-900/30 shadow-amber-500/5"
          : "bg-emerald-50/30 dark:bg-[#071E15]/40 border-[#D8E3D3]/60 dark:border-emerald-900/30 shadow-emerald-900/5"
      }`}
    >
      {/* Background Stylized Typographic Watermark (Earlier font size, Black bold color, only Upcoming and New) */}
      <div
        aria-hidden="true"
        className="absolute top-2 sm:top-3 left-6 sm:left-9 text-3xl lg:text-6xl font-black tracking-tighter uppercase select-none pointer-events-none leading-none transition-all duration-500 whitespace-nowrap text-gray-600 dark:text-white/25"
      >
        {isUpcoming ? "Upcoming" : "New"}
      </div>

      {/* Top Header Row: Shifting View All CTA near arrows in top; Heading hidden to give open area for bold watermark */}
      <div className="relative z-10 flex items-center justify-end gap-2 sm:gap-3 mb-4 sm:mb-6 min-h-[40px]">
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
     
        {/* Shifted View All CTA button near arrows */}
        <Link
          href={catalogLink}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-xs active:scale-95 group ${
            isUpcoming
              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              : "bg-[#1F7A4D] hover:bg-[#289660] text-white shadow-emerald-900/20"
          }`}
        >
          {/* <span className="hidden sm:inline">{viewAllText}</span> */}
          <span >All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        </div>

      {/* Middle: Full-width horizontal scroll of vehicle cards (layered over watermark) */}
      <div className="relative z-10 overflow-hidden">
        <div
          ref={rowRef}
          className="w-full overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide scroll-smooth flex gap-4 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((l, i) => {
            const pricing = l.prices?.length ? (
              parseFloat(String(l.prices[0])) > 100
                ? `₹${(parseFloat(String(l.prices[0])) / 100000).toFixed(2)}L`
                : `₹${l.prices[0]}L`
            ) : (l as any).price_bracket || "";
            const { power, torque, battery } = getVehicleCardSpecs(l);
            const bgImage = VEHICLE_BACKGROUNDS[i % VEHICLE_BACKGROUNDS.length];
            return (
              <motion.div
                key={`${categoryTab || type}-${l.slug || i}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 1.0,
                  delay: Math.min(i * 0.08, 0.4),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex-shrink-0 flex snap-start w-[calc(100vw-3.5rem)] max-w-[360px] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
              >
                <Link
                  href={`/product/${l.slug}`}
                  className={`group w-full rounded-2xl border overflow-hidden transition-all flex flex-col justify-between backdrop-blur-lg shadow-xs hover:shadow-xl hover:-translate-y-1 duration-300 ${
                    isUpcoming
                      ? "bg-white/50 hover:bg-white/80 dark:bg-[#1A1407]/45 dark:hover:bg-[#1A1407]/65 border-white/70 hover:border-amber-400/80 dark:border-amber-900/40 dark:hover:border-amber-400"
                      : "bg-white/50 hover:bg-white/80 dark:bg-[#071E15]/45 dark:hover:bg-[#071E15]/65 border-white/70 hover:border-emerald-400/80 dark:border-emerald-900/40 dark:hover:border-[#8FE24A]"
                  }`}
                >
                  <div 
                    className="relative h-40 sm:h-44 md:h-48 overflow-hidden bg-white/30 dark:bg-black/20"
                    style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                  >
                    <Image
                      src={getVehiclePhoto(l.photo, l)}
                      alt={l.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
                    <div>
                      <p
                        className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                          isUpcoming ? "text-amber-600 dark:text-amber-400/80" : "text-[#1F7A4D] dark:text-emerald-400/80"
                        }`}
                      >
                        {l.brand}
                      </p>
                      <div className="flex items-baseline justify-between gap-2 mt-1">
                        <h3
                          className="text-xs sm:text-sm font-bold text-[#0A2A1E] dark:text-white line-clamp-1 group-hover:underline flex-1 min-w-0"
                          title={l.title}
                        >
                          {l.title}
                        </h3>
                        <span
                          className={`text-xs sm:text-sm font-black shrink-0 tracking-tight ${
                            isUpcoming ? "text-amber-700 dark:text-amber-400" : "text-[#1F7A4D] dark:text-[#8FE24A]"
                          }`}
                        >
                          {pricing || "TBA"}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom: Power, Torque, Battery capacity (icon & value in one row) */}
                    <div
                      className={`grid grid-cols-3 gap-1 mt-3 pt-2.5 border-t text-center ${
                        isUpcoming ? "border-amber-200/50 dark:border-amber-900/30" : "border-[#D0E2CC]/60 dark:border-emerald-900/30"
                      }`}
                    >
                      {/* Power */}
                      <div className="flex items-center justify-center gap-1.5 min-w-0" title="Power">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2.4} />
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                          {power || "—"}
                        </span>
                      </div>

                      {/* Torque */}
                      <div
                        className={`flex items-center justify-center gap-1.5 min-w-0 border-x px-1 ${
                          isUpcoming ? "border-amber-200/50 dark:border-amber-900/30" : "border-[#D0E2CC]/60 dark:border-emerald-900/30"
                        }`}
                        title="Torque"
                      >
                        <Gauge className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" strokeWidth={2.4} />
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                          {torque || "—"}
                        </span>
                      </div>

                      {/* Battery Capacity */}
                      <div className="flex items-center justify-center gap-1.5 min-w-0" title="Battery Capacity">
                        <BatteryCharging className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.4} />
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                          {battery || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* End Card */}
          <motion.div
            key={`${categoryTab || type}-end-card`}
            variants={{
              hidden: { opacity: 0, x: 80 },
              visible: {
                opacity: 1,
                x: 0,
                transition: {
                  duration: 2.0,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
            className="flex-shrink-0 flex snap-start"
          >
            <Link
              href={catalogLink}
              className={`group flex-shrink-0 w-[180px] sm:w-[220px] rounded-2xl border border-dashed overflow-hidden transition-all flex flex-col items-center justify-center text-center p-5 sm:p-6 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 duration-300 ${
                isUpcoming
                  ? "border-amber-300/60 bg-white/40 hover:bg-white/70 dark:bg-amber-950/20 hover:dark:bg-amber-900/30"
                  : "border-emerald-300/60 bg-white/40 hover:bg-white/70 dark:bg-emerald-950/20 hover:dark:bg-emerald-900/30"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 shadow-xs ${
                  isUpcoming ? "bg-amber-500 text-slate-950" : "bg-[#1F7A4D] text-white"
                }`}
              >
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#0A2A1E] dark:text-white">
                {viewAllText}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                Explore catalog
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

interface VehicleCategorySelectorProps {
  listings?: EvListing[];
  activeCategory: CategoryTab;
  brandRankings?: BrandRankItem[];
}

function VehicleCategorySelector({
  listings = [],
  activeCategory,
  brandRankings = [],
}: VehicleCategorySelectorProps) {
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
  // Exclude upcoming vehicles so Showcase strictly features launched/available models
  const filteredListings = useMemo(() => {
    const matched = listings.filter(
      (l) => matchesVehicleCategory(l, activeCategory) && !isUpcomingVehicle(l)
    );
    if (matched.length > 0) return sortVehiclesByBrandRank(matched, activeCategory, brandRankings);
    // Fallback if category has no launched models
    const fallback = listings.filter((l) => matchesVehicleCategory(l, activeCategory));
    return sortVehiclesByBrandRank(fallback, activeCategory, brandRankings);
  }, [listings, activeCategory, brandRankings]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollLeft = 0;
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
  const CategoryIcon = currentConfig.icon;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className="relative overflow-hidden p-5 sm:p-6 lg:p-8 max-w-7xl mx-auto my-10 sm:my-16 rounded-3xl border backdrop-blur-xl transition-all shadow-lg bg-[#f9f5e8] dark:bg-[#071E15]/40 border-[#D8E3D3]/60 dark:border-emerald-900/30 shadow-emerald-900/5"
    >
      {/* Subtle ambient decorative gradient orbs */}
      <div
        aria-hidden="true"
        className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 bg-emerald-400/20 dark:bg-emerald-500/10"
      />

      {/* Top Header Row: Category Badge, Title, Subtitle, and Navigation Controls */}
      <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
        {/* Left Side: Category Icon, Title, Subtitle, and Model Count Badge */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1F7A4D] dark:bg-[#8FE24A] text-white dark:text-[#07130E] flex items-center justify-center shrink-0 shadow-md">
            <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0A2A1E] dark:text-white tracking-tight truncate">
                Showcase
              </h2>
              {/* <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#1F7A4D] dark:text-[#8FE24A] border border-emerald-500/20 shrink-0">
                {filteredListings.length} models
              </span> */}
            </div>
            {/* <p className="text-xs sm:text-sm text-[#466153] dark:text-slate-300 font-medium line-clamp-1">
              {currentConfig.sublabel}
            </p> */}
          </div>
        </div>

        {/* Right Side: View All CTA + Scroll Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="hidden items-center gap-1.5 md:flex sm:flex">
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
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs group bg-[#2e3230] hover:bg-[#289660] text-white hover:text-black shadow-emerald-900/20"
          >
            {/* <span className="hidden sm:inline">View All {currentConfig.label}</span> */}
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Middle: Full-width Horizontal Scroll of Vehicle Cards */}
      <div className="relative z-10 overflow-hidden">
        <div
          ref={rowRef}
          className="w-full overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide scroll-smooth flex gap-4 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {filteredListings.slice(0, 16).map((l, i) => {
            const pricing = l.prices?.length
              ? parseFloat(String(l.prices[0])) > 100
                ? `₹${(parseFloat(String(l.prices[0])) / 100000).toFixed(2)}L`
                : `₹${l.prices[0]}L`
              : (l as any).price_bracket || "";
            const { power, torque, battery } = getVehicleCardSpecs(l);
            const bgImage = VEHICLE_BACKGROUNDS[i % VEHICLE_BACKGROUNDS.length];

            return (
              <motion.div
                key={`${activeCategory}-${l.slug || i}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 1.0,
                  delay: Math.min(i * 0.08, 0.4),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex-shrink-0 flex snap-start w-[calc(100vw-3.5rem)] max-w-[360px] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
              >
                <Link
                  href={`/product/${l.slug}`}
                  className="group w-full rounded-2xl border overflow-hidden transition-all flex flex-col justify-between backdrop-blur-lg shadow-xs hover:shadow-xl hover:-translate-y-1 duration-300 bg-white/50 hover:bg-white/80 dark:bg-[#071E15]/45 dark:hover:bg-[#071E15]/65 border-white/70 hover:border-emerald-400/80 dark:border-emerald-900/40 dark:hover:border-[#8FE24A]"
                >
                  <div 
                    className="relative h-40 sm:h-44 md:h-48 overflow-hidden bg-white/30 dark:bg-black/20"
                    style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                  >
                    <Image
                      src={getVehiclePhoto(l.photo, l)}
                      alt={l.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1F7A4D] dark:text-emerald-400/80">
                        {l.brand}
                      </p>
                      <div className="flex items-baseline justify-between gap-2 mt-1">
                        <h3
                          className="text-xs sm:text-sm font-bold text-[#0A2A1E] dark:text-white line-clamp-1 group-hover:underline flex-1 min-w-0"
                          title={l.title}
                        >
                          {l.title}
                        </h3>
                        <span className="text-xs sm:text-sm font-black shrink-0 tracking-tight text-[#1F7A4D] dark:text-[#8FE24A]">
                          {pricing || "TBA"}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom: Power, Torque, Battery capacity (icon & value in one row) */}
                    <div className="grid grid-cols-3 gap-1 mt-3 pt-2.5 border-t border-[#D0E2CC]/60 dark:border-emerald-900/30 text-center">
                      {/* Power */}
                      <div className="flex items-center justify-center gap-1.5 min-w-0" title="Power">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2.4} />
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                          {power || "—"}
                        </span>
                      </div>

                      {/* Torque */}
                      <div className="flex items-center justify-center gap-1.5 min-w-0 border-x border-[#D0E2CC]/60 dark:border-emerald-900/30 px-1" title="Torque">
                        <Gauge className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" strokeWidth={2.4} />
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                          {torque || "—"}
                        </span>
                      </div>

                      {/* Battery Capacity */}
                      <div className="flex items-center justify-center gap-1.5 min-w-0" title="Battery Capacity">
                        <BatteryCharging className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.4} />
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                          {battery || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* End Card */}
          <motion.div
            key={`${activeCategory}-end-card`}
            variants={{
              hidden: { opacity: 0, x: 80 },
              visible: {
                opacity: 1,
                x: 0,
                transition: {
                  duration: 2.0,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
            className="flex-shrink-0 flex snap-start"
          >
            <Link
              href={viewAllHref}
              className="group flex-shrink-0 w-[180px] sm:w-[220px] rounded-2xl border border-dashed overflow-hidden transition-all flex flex-col items-center justify-center text-center p-5 sm:p-6 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 duration-300 border-emerald-300/60 bg-white/40 hover:bg-white/70 dark:bg-emerald-950/20 hover:dark:bg-emerald-900/30"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 shadow-xs bg-[#1F7A4D] text-white">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#0A2A1E] dark:text-white">
                View All {currentConfig.label}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                Explore full catalog
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

// Helper to extract YouTube video ID from various URL formats
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

// Helper to determine if a hex color is dark (for text contrast)
export function isColorDark(hex: string | null | undefined): boolean {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return false;
  const c = hex.substring(1);
  const rgb = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  if (isNaN(rgb)) return false;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 140;
}

interface HeroBannerCardMediaProps {
  banner: HeroBanner;
  isMuted: boolean;
  isPlaying: boolean;
  onVideoStateChange?: (loaded: boolean) => void;
}

function HeroBannerCardMedia({
  banner,
  isMuted,
  isPlaying,
  onVideoStateChange,
}: HeroBannerCardMediaProps) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = banner.video_url?.trim() || "";
  const ytId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl]);
  const hasVideo = !!videoUrl;

  const posterSrc =
    banner.imageHorizontal ||
    banner.image_horizontal ||
    banner.imageVertical ||
    banner.image_vertical ||
    (ytId
      ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
      : "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&auto=format&fit=crop&q=80");

  // Lite-loading delay: Instant poster image on initial paint, mount video player after 250ms
  useEffect(() => {
    setShouldLoadVideo(false);
    onVideoStateChange?.(false);

    if (!hasVideo) return;

    const timer = setTimeout(() => {
      setShouldLoadVideo(true);
      onVideoStateChange?.(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [banner.id, videoUrl, hasVideo, onVideoStateChange]);

  // Handle Mute/Unmute via YouTube PostMessage or HTML5 video API
  useEffect(() => {
    if (ytId && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isMuted ? "mute" : "unMute",
          args: [],
        }),
        "*"
      );
    }
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, ytId]);

  // Handle Play/Pause via YouTube PostMessage or HTML5 video API
  useEffect(() => {
    if (ytId && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isPlaying ? "playVideo" : "pauseVideo",
          args: [],
        }),
        "*"
      );
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, ytId]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black/40">
      {/* 1. Instant Poster Image (Zero delay, instant LCP) */}
      <img
        src={posterSrc}
        alt={banner.details || banner.label || "EV Banner"}
        className="w-full h-full object-cover"
      />

      {/* 2. Lite-Loaded Video Layer (YouTube embed or HTML5 video) */}
      {hasVideo && shouldLoadVideo && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-10">
          {ytId ? (
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${
                isMuted ? 1 : 0
              }&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={banner.details || banner.label || "EV Video Banner"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => onVideoStateChange?.(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] object-cover border-0 pointer-events-none"
            />
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              onLoadedData={() => onVideoStateChange?.(true)}
              onPlaying={() => onVideoStateChange?.(true)}
              className="w-full h-full object-cover pointer-events-none"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function EcosystemSection({
  updates = [],
  listings = [],
  banners = [],
  brandRankings = [],
}: EcosystemSectionProps) {
  const router = useRouter();
  const [heroSearchQuery, setHeroSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("bike");

  const [liveBrandRankings, setLiveBrandRankings] = useState<BrandRankItem[]>(brandRankings || []);

  useEffect(() => {
    if (brandRankings && brandRankings.length > 0) {
      setLiveBrandRankings(brandRankings);
    } else {
      fetch("/api/brand-rankings")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.rankings) && data.rankings.length > 0) {
            setLiveBrandRankings(data.rankings);
          }
        })
        .catch(() => {});
    }
  }, [brandRankings]);

  // Reveal state: initially false (shows "Explore Listing" pill), switches to true (revealing 4 tabs & listings)
  const [hasRevealed, setHasRevealed] = useState(false);
  const userManuallyRevealedRef = useRef(false);
  const scrollTriggerRef = useRef<HTMLDivElement | null>(null);
  const tabsSectionRef = useRef<HTMLDivElement | null>(null);

  // Sticky zone watcher & floating tab state
  const ecosystemStickyZoneRef = useRef<HTMLDivElement | null>(null);
  const [isFloating, setIsFloating] = useState(false);
  const isFloatingRef = useRef(false);

  useEffect(() => {
    let rafId: number;

    const updateStickyState = () => {
      if (!ecosystemStickyZoneRef.current) return;
      const rect = ecosystemStickyZoneRef.current.getBoundingClientRect();
      // Tabs stick once top reaches near top (<= 20px) and until bottom of Upcoming section passes
      const sticky = rect.top <= 20 && rect.bottom >= 140;

      if (sticky !== isFloatingRef.current) {
        isFloatingRef.current = sticky;
        setIsFloating(sticky);
        window.dispatchEvent(
          new CustomEvent("ecosystem-tabs-sticky", { detail: { isSticky: sticky } })
        );
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateStickyState();

        const scrollY = window.scrollY;
        // When user scrolls down past 60px, automatically reveal the 4 tabs & listings
        if (scrollY > 60) {
          setHasRevealed(true);
        } else if (!userManuallyRevealedRef.current) {
          // If scrolled back to the very top, collapse back to "Explore Listing"
          setHasRevealed(false);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    updateStickyState();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.dispatchEvent(
        new CustomEvent("ecosystem-tabs-sticky", { detail: { isSticky: false } })
      );
    };
  }, []);

  const handleRevealListing = () => {
    userManuallyRevealedRef.current = true;
    setHasRevealed(true);

    setTimeout(() => {
      tabsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        userManuallyRevealedRef.current = false;
      }, 1000);
    }, 50);
  };

  const handleSelectCategory = (tabKey: CategoryTab) => {
    setActiveCategory(tabKey);
    if (!hasRevealed) {
      setHasRevealed(true);
    }
  };

  // Filter listings by active category for the 3 ecosystem sections
  const categoryListings = useMemo(() => {
    const matched = listings.filter((l) => matchesVehicleCategory(l, activeCategory));
    return sortVehiclesByBrandRank(matched, activeCategory, liveBrandRankings);
  }, [listings, activeCategory, liveBrandRankings]);

  const categoryNewListings = useMemo(() => {
    // Only launched models, sorted descending by launchdate (newest / most recent releases first)
    const launched = categoryListings.filter((l) => !isUpcomingVehicle(l));
    const sorted = [...launched].sort((a, b) => {
      const dateA = parseVehicleLaunchDate(a.launchdate)?.getTime() || 0;
      const dateB = parseVehicleLaunchDate(b.launchdate)?.getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return 0;
    });
    return sorted.slice(0, 16);
  }, [categoryListings]);

  const categoryUpcomingListings = useMemo(() => {
    // Strictly future releases & unannounced models (never backfilled with past/recent launches)
    const upcoming = categoryListings.filter((l) => isUpcomingVehicle(l));
    const sorted = [...upcoming].sort((a, b) => {
      const dateA = parseVehicleLaunchDate(a.launchdate)?.getTime() || Infinity;
      const dateB = parseVehicleLaunchDate(b.launchdate)?.getTime() || Infinity;
      return dateA - dateB;
    });
    return sorted.slice(0, 16);
  }, [categoryListings]);

  // Banner slider state & video controls
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [showBannerDetails, setShowBannerDetails] = useState(false);
  const [isBannerVideoMuted, setIsBannerVideoMuted] = useState(true);
  const [isBannerVideoPlaying, setIsBannerVideoPlaying] = useState(true);
  const [isBannerVideoLoaded, setIsBannerVideoLoaded] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [bannerTimerProgress, setBannerTimerProgress] = useState(0);
  const activeBanners = useMemo(() => banners ?? [], [banners]);

  const BANNER_DURATION_MS = 6000; // Strictly 6 seconds per slide
  const BANNER_TICK_MS = 50;

  useEffect(() => {
    if (activeBanners.length <= 1) {
      setBannerTimerProgress(0);
      return;
    }
    // Pause timer on hover or if video is manually paused
    if (isBannerHovered || !isBannerVideoPlaying) return;

    const interval = setInterval(() => {
      setBannerTimerProgress((prev) => {
        const next = prev + (BANNER_TICK_MS / BANNER_DURATION_MS) * 100;
        if (next >= 100) {
          setCurrentBannerIdx((curr) => (curr + 1) % activeBanners.length);
          setShowBannerDetails(false);
          setIsBannerVideoLoaded(false);
          return 0;
        }
        return next;
      });
    }, BANNER_TICK_MS);

    return () => clearInterval(interval);
  }, [activeBanners.length, isBannerHovered, isBannerVideoPlaying]);

  const handleSelectBanner = (idx: number) => {
    setCurrentBannerIdx(idx);
    setBannerTimerProgress(0);
    setShowBannerDetails(false);
    setIsBannerVideoLoaded(false);
  };

  const toggleBannerVideoMute = () => {
    setIsBannerVideoMuted((prev) => !prev);
  };

  const toggleBannerVideoPlay = () => {
    setIsBannerVideoPlaying((prev) => !prev);
  };

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

  const currentBanner = activeBanners[currentBannerIdx];
  const ctaBgColor = currentBanner?.background_color?.trim() || "#8FE24A";
  const ctaTextColor = isColorDark(ctaBgColor) ? "#ffffff" : "#07130E";
  const remainingSeconds = Math.max(1, Math.ceil(((100 - bannerTimerProgress) / 100) * 6));

  return (
    <div 
      className="w-full bg-[#FDEDED] pt-24 sm:pt-28 dark:bg-[#07130E] text-[#0E1F16] dark:text-slate-100 font-sans overflow-x-clip transition-colors duration-1000 relative z-0"
    >
      {/* 1. HERO / ECOSYSTEM BANNER (Natural Webpage Background for Left Panel, Dedicated Card for Right Panel) */}
      <section className="relative mx-auto mb-12 sm:mb-16 max-w-7xl px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">
          {/* Hero Left Content: Directly on Natural Webpage Background */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-[#0A2A1E] dark:text-white">
              India's <span className="text-[#1F7A4D] dark:text-[#8FE24A]">Trusted</span> Electric Mobility Platform.
            </h1>

            {/* Unified Search Capsule (Hidden in mobile view, visible on tablet/desktop) */}
            <div className="hidden sm:block w-full bg-white dark:bg-[#0B2117]/90 border border-[#bfe3e1]/70 dark:border-emerald-800/40 rounded-3xl p-2 sm:p-2.5 shadow-[0_20px_50px_-18px_rgba(47,143,34,0.15)] max-w-xl">
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
              onMouseEnter={() => setIsBannerHovered(true)}
              onMouseLeave={() => setIsBannerHovered(false)}
              className="relative w-full h-[330px] sm:h-[390px] lg:h-[460px] rounded-2xl sm:rounded-3xl border border-[#D8E3D3] dark:border-emerald-900/40 shadow-xl overflow-hidden flex flex-col justify-end"
              style={
                activeBanners[currentBannerIdx]?.background_color
                  ? { backgroundColor: activeBanners[currentBannerIdx].background_color }
                  : undefined
              }
            >
              {/* Banner Media Layer with Lite-Loading Video Player */}
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
                    <HeroBannerCardMedia
                      banner={activeBanners[currentBannerIdx]}
                      isMuted={isBannerVideoMuted}
                      isPlaying={isBannerVideoPlaying}
                      onVideoStateChange={setIsBannerVideoLoaded}
                    />
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

              {/* Video Status Indicator Badge in Top-Left Corner */}
              {activeBanners.length > 0 && !!activeBanners[currentBannerIdx]?.video_url && (
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-semibold shadow-lg transition-opacity duration-300">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isBannerVideoLoaded ? "animate-pulse" : "bg-amber-400 animate-ping"
                    }`}
                    style={isBannerVideoLoaded ? { backgroundColor: ctaBgColor } : undefined}
                  />
                  <span>
                    {isBannerVideoLoaded
                      ? isBannerVideoPlaying
                        ? "Playing Video"
                        : "Video Paused"
                      : "Loading video..."}
                  </span>
                </div>
              )}

              {/* 6-Second Timer Countdown Badge in Top-Right Corner */}
              {activeBanners.length > 1 && (
                <div
                  className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-semibold shadow-lg select-none"
                  title={`Next slide in ${remainingSeconds}s${isBannerHovered ? " (Paused on hover)" : ""}`}
                >
                  <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" className="stroke-white/25 fill-none" strokeWidth="3" />
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        style={{ stroke: ctaBgColor }}
                        className="fill-none transition-all duration-75 ease-linear"
                        strokeWidth="3"
                        strokeDasharray={56.5}
                        strokeDashoffset={56.5 * (bannerTimerProgress / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-100">{remainingSeconds}s</span>
                  {isBannerHovered && (
                    <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold ml-0.5">Paused</span>
                  )}
                </div>
              )}

              {/* 6-Second Slide Transition Progress Line along Card Bottom Edge */}
              {activeBanners.length > 1 && (
                <div
                  className="absolute bottom-0 left-0 h-[3px] z-30 transition-all duration-75 ease-linear pointer-events-none"
                  style={{
                    width: `${bannerTimerProgress}%`,
                    backgroundColor: ctaBgColor,
                    boxShadow: `0 0 10px ${ctaBgColor}`,
                  }}
                />
              )}

              {/* Bottom Actions Panel with CTA, Info toggle, Video Controls, and Pagination */}
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
                              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ctaBgColor }} />
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
                      {/* Left: CTA Button + Info Icon + Video Controls */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={activeBanners[currentBannerIdx].href || "/catalog"}
                          style={{
                            backgroundColor: ctaBgColor,
                            color: ctaTextColor,
                            boxShadow: `0 10px 25px -5px ${ctaBgColor}66`,
                          }}
                          className="inline-flex items-center gap-1.5 sm:gap-2 font-extrabold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 group shrink-0"
                        >
                          <span className="inline text-xs sm:text-sm font-bold">{activeBanners[currentBannerIdx].cta || "Explore Now"}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </Link>

                        {(activeBanners[currentBannerIdx].details || activeBanners[currentBannerIdx].label) && (
                          <button
                            type="button"
                            onClick={() => setShowBannerDetails((prev) => !prev)}
                            style={
                              showBannerDetails
                                ? {
                                    backgroundColor: ctaBgColor,
                                    color: ctaTextColor,
                                    borderColor: ctaBgColor,
                                    boxShadow: `0 4px 14px 0 ${ctaBgColor}40`,
                                  }
                                : undefined
                            }
                            className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all backdrop-blur-md cursor-pointer ${
                              showBannerDetails
                                ? ""
                                : "bg-black/50 hover:bg-black/70 text-white border-white/20 hover:border-white/40"
                            }`}
                            title={showBannerDetails ? "Hide details" : "Show details"}
                            aria-label="Toggle banner details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}

                        {/* Video Controls: Play/Pause and Mute/Unmute */}
                        {/* {!!activeBanners[currentBannerIdx]?.video_url && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <button
                              type="button"
                              onClick={toggleBannerVideoPlay}
                              className="h-9 w-9 rounded-xl flex items-center justify-center border transition-all backdrop-blur-md cursor-pointer bg-black/50 hover:bg-black/70 text-white border-white/20 hover:border-white/40 active:scale-95 shadow-sm"
                              title={isBannerVideoPlaying ? "Pause video" : "Play video"}
                              aria-label={isBannerVideoPlaying ? "Pause video" : "Play video"}
                            >
                              {isBannerVideoPlaying ? (
                                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              ) : (
                                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 translate-x-0.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={toggleBannerVideoMute}
                              style={
                                !isBannerVideoMuted
                                  ? {
                                      backgroundColor: ctaBgColor,
                                      color: ctaTextColor,
                                      borderColor: ctaBgColor,
                                      boxShadow: `0 4px 14px 0 ${ctaBgColor}40`,
                                    }
                                  : undefined
                              }
                              className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all backdrop-blur-md cursor-pointer active:scale-95 shadow-sm ${
                                !isBannerVideoMuted
                                  ? ""
                                  : "bg-black/50 hover:bg-black/70 text-white border-white/20 hover:border-white/40"
                              }`}
                              title={isBannerVideoMuted ? "Unmute audio" : "Mute audio"}
                              aria-label={isBannerVideoMuted ? "Unmute audio" : "Mute audio"}
                            >
                              {isBannerVideoMuted ? (
                                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </button>
                          </div>
                        )} */}
                      </div>

                      {/* Right: Pagination dots if multiple banners exist */}
                      {activeBanners.length > 1 && (
                        <div className="flex gap-1.5 items-center bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15 shadow-md">
                          {activeBanners.map((b: any, idx: number) => {
                            const isCurrent = currentBannerIdx === idx;
                            return (
                              <button
                                key={b.id || idx}
                                onClick={() => handleSelectBanner(idx)}
                                className={`relative h-2 rounded-full overflow-hidden transition-all cursor-pointer ${
                                  isCurrent ? "w-8 bg-white/25" : "w-2 bg-white/40 hover:bg-white/70"
                                }`}
                                aria-label={`Go to banner ${idx + 1}`}
                              >
                                {isCurrent && (
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-75 ease-linear"
                                    style={{
                                      width: `${bannerTimerProgress}%`,
                                      backgroundColor: ctaBgColor,
                                    }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/catalog"
                      style={{
                        backgroundColor: ctaBgColor,
                        color: ctaTextColor,
                        boxShadow: `0 10px 25px -5px ${ctaBgColor}66`,
                      }}
                      className="inline-flex items-center gap-2 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg group"
                    >
                      <span>Explore </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Scroll Stuck Reveal Sentinel ── */}
      <div
        ref={scrollTriggerRef}
        id="ecosystem-scroll-trigger"
        className="h-2 w-full pointer-events-none -mt-6"
      />

      {/* ── STICKY ECOSYSTEM ZONE: Wraps Tabs + 3 Dynamic Vehicle Sections ── */}
      <div ref={ecosystemStickyZoneRef} className="relative">
        {/* ── 2. CENTERED VEHICLE TYPE TABS OR EXPLORE LISTING TRIGGER ── */}
        <div
          ref={tabsSectionRef}
          className="sticky top-10 sm:top-3.5 z-[110] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 pointer-events-auto transition-all duration-300"
        >
          <AnimatePresence mode="wait">
            {!hasRevealed ? (
              <motion.div
                key="explore-listing-trigger"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center text-center"
              >
                {/* Mobile Segmented Options: Explore : View All : Ask Plse */}
                <div className="sm:hidden flex items-center justify-between gap-1 p-1.5 rounded-full bg-white/95 dark:bg-[#092218]/95 backdrop-blur-2xl border-2 border-[#1F7A4D]/40 dark:border-emerald-500/50 shadow-xl shadow-emerald-950/15 max-w-sm w-full mx-auto">
                  {/* Option 1: Explore (Reveals 4 Tabs & listings) */}
                  <button
                    type="button"
                    onClick={handleRevealListing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A] text-white dark:text-[#07130E] text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer group"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0 -my-1 bg-transparent">
                      <DotLottieReact src="/lottie/S6eIGuvPMW.lottie" loop autoplay backgroundColor="transparent" className="w-6 h-6 bg-transparent" />
                    </div>
                    <span>Explore</span>
                    <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform shrink-0 opacity-80" strokeWidth={2.6} />
                  </button>

                  <div className="w-px h-5 bg-[#bfe3e1]/70 dark:bg-emerald-800/50 shrink-0" />

                  {/* Option 2: View All (Navigates to /catalog) */}
                  <Link
                    href="/catalog"
                    className="flex-1 inline-flex items-center justify-center py-2 px-2.5 rounded-full text-xs font-bold text-[#0A2A1E] dark:text-emerald-100 hover:bg-zinc-100 dark:hover:bg-emerald-900/30 transition-colors text-center"
                  >
                    View All
                  </Link>

                  <div className="w-px h-5 bg-[#bfe3e1]/70 dark:bg-emerald-800/50 shrink-0" />

                  {/* Option 3: Ask Plse (Opens AI Chat popup) */}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2 rounded-full text-xs font-bold text-[#1F7A4D] dark:text-[#8FE24A] hover:bg-emerald-50 dark:hover:bg-[#1F7A4D]/20 transition-colors cursor-pointer active:scale-95 text-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Ask Plse</span>
                  </button>
                </div>

                {/* Desktop Explore Listing Button */}
                <button
                  type="button"
                  onClick={handleRevealListing}
                  className="group hidden sm:inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-white/95 dark:bg-[#092218]/95 backdrop-blur-2xl border-2 border-[#1F7A4D]/40 dark:border-emerald-500/50 shadow-xl hover:shadow-2xl shadow-emerald-950/15 hover:border-[#1F7A4D] dark:hover:border-[#8FE24A] transition-all duration-300 cursor-pointer active:scale-95"
                >
                  <div className="w-10 h-10 flex items-center justify-center text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 overflow-hidden bg-transparent">
                    <DotLottieReact src="/lottie/S6eIGuvPMW.lottie" loop autoplay backgroundColor="transparent" className="w-9 h-9 bg-transparent" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-base font-black text-[#0A2A1E] dark:text-white tracking-tight flex items-center gap-2">
                      Explore 
                      {/* {listings.length > 0 && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[#1F7A4D] dark:text-[#8FE24A]">
                          {listings.length} EVs
                        </span>
                      )} */}
                    </span>
                    {/* <span className="text-xs font-semibold text-[#3C5347] dark:text-slate-400">
                      Bikes • Scooters • Cars • Commercial
                    </span> */}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#1F7A4D] dark:text-[#8FE24A] group-hover:translate-y-0.5 transition-transform ml-1 shrink-0">
                    <ChevronDown className="w-4 h-4" strokeWidth={2.6} />
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="category-tabs-bar"
                initial={{ opacity: 0, y: 15, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.94 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center text-center"
              >
                {/* Centered Pill Bar (Bikes, Scooter, Cars, Commercial) - 2 rows on mobile (grid grid-cols-2), 1 row on desktop (sm:flex) */}
                <div
                  className={`grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2 sm:gap-2.5 p-2 sm:p-2 rounded-2xl sm:rounded-full bg-white/95 dark:bg-[#092218]/95 backdrop-blur-2xl border-2 transition-[border-color,box-shadow,ring] duration-200 w-full max-w-sm sm:w-auto sm:max-w-none mx-auto ${
                    isFloating
                      ? "border-[#1F7A4D]/40 dark:border-emerald-500/50 shadow-2xl shadow-emerald-950/20 dark:shadow-black/70 ring-2 ring-emerald-500/20"
                      : "border-[#D8E3D3] dark:border-emerald-900/50 shadow-xl dark:shadow-2xl"
                  }`}
                >
                  {CATEGORY_TABS.map((tabKey, idx) => {
                    const tab = CATEGORY_CONFIG[tabKey];
                    const Icon = tab.icon;
                    const isActive = activeCategory === tabKey;
                    const count = listings.filter((l) => matchesVehicleCategory(l, tabKey)).length;

                    return (
                      <motion.button
                        key={tabKey}
                        onClick={() => handleSelectCategory(tabKey)}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 w-full sm:w-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-full text-xs sm:text-sm md:text-base font-extrabold transition-colors cursor-pointer select-none ${
                          isActive
                            ? "text-white dark:text-[#07130E]"
                            : "text-[#3C5347] dark:text-slate-300 hover:text-[#0A2A1E] dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="centeredActiveEcosystemTab"
                            className="absolute inset-0 rounded-xl sm:rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A] shadow-md shadow-emerald-950/20"
                            transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          />
                        )}
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 shrink-0" strokeWidth={2.4} />
                        <span className="relative z-10 tracking-tight font-black">{tab.label}</span>
                        {/* {count > 0 && (
                          <span
                            className={`relative z-10 text-[10px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
                              isActive
                                ? "bg-white/20 text-white dark:bg-black/20 dark:text-[#07130E]"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {count}
                          </span>
                        )} */}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 3. DYNAMIC CONTENT: Separate sections that each reveals up when in screen, then cards animate from right ── */}
        <div
          className={`transition-[opacity,filter] duration-500 space-y-4 sm:space-y-8 ${
            hasRevealed ? "pointer-events-auto opacity-100" : "pointer-events-none select-none opacity-40 blur-[0.5px]"
          }`}
        >
          {/* Section 1: Showcase - Arises when scrolled into view, then cards animate from right */}
          <VehicleCategorySelector
            key={`showcase`}
            activeCategory={activeCategory}
            listings={listings}
            brandRankings={liveBrandRankings}
          />

          {/* Section 2: Releases - Arises when scrolled into view, then cards animate from right */}
          <VehicleScrollSection
            key="releases"
            type="new"
            categoryTab={activeCategory}
            categoryLabel={CATEGORY_CONFIG[activeCategory].label}
            items={categoryNewListings}
          />

          {/* Section 3: Upcoming - Arises when scrolled into view, then cards animate from right */}
          <VehicleScrollSection
            key="upcoming"
            type="upcoming"
            categoryTab={activeCategory}
            categoryLabel={CATEGORY_CONFIG[activeCategory].label}
            items={categoryUpcomingListings}
          />
        </div>
      </div>

      {/* 4. WHY EVPLSE SECTION */}
      <section className="py-12 sm:py-20 px-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-6 sm:p-8 md:p-12 rounded-3xl bg-[#edfcf2] dark:bg-[#071912] border border-[#184834]/20 dark:border-emerald-800/40 relative overflow-hidden shadow-xl">
          {/* Ambient radial glow for contrast and depth */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1F7A4D]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8FE24A]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Ambient Lottie illustration in back-right (desktop only, hidden on mobile) */}
          <div className="hidden sm:block absolute -right-6 sm:-right-2 md:right-2 top-0 md:-top-4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 pointer-events-none select-none z-0 opacity-85 dark:opacity-60">
            <DotLottieReact
              src="/lottie/qU4m93idOL.lottie"
              loop
              autoplay
              backgroundColor="transparent"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="max-w-2xl mb-6 sm:mb-10 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#1F7A4D]/15 text-[#1F7A4D] border border-[#1F7A4D]/25 dark:bg-[#8FE24A]/20 dark:text-[#8FE24A] dark:border-[#8FE24A]/30 mb-3">
              The Difference
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0A2A1E] dark:text-white tracking-tight">
              Why EVPLSE?
            </h2>
            <p className="text-[#2C4A3E] dark:text-emerald-100/90 text-sm sm:text-base mt-2 font-medium leading-relaxed max-w-xl">
              Trust isn't claimed — it's built into how the platform works.
            </p>
          </div>

          {/* Mobile: horizontal drag-scroll. md+: 3-column grid */}
          <div className="relative z-10 -mx-6 px-6 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 overflow-x-auto md:overflow-visible scrollbar-hide">
            <div className="flex gap-4 md:grid md:grid-cols-3 md:gap-6 pb-4 md:pb-0">
              {/* Card 1: Trust */}
              <div className="flex-shrink-0 w-[78vw] sm:w-[55vw] md:w-auto p-5 sm:p-6 md:p-7 rounded-2xl bg-white/90 dark:bg-[#0C241B]/95 border border-emerald-200/80 dark:border-emerald-700/40 hover:border-[#1F7A4D]/60 dark:hover:border-[#8FE24A]/60 transition-all backdrop-blur-md shadow-sm">
                <div className="text-xs font-mono font-bold text-[#1F7A4D] dark:text-[#8FE24A] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A]" />
                  01 — TRUST
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0A2A1E] dark:text-white mb-3">Trust</h3>
                <ul className="space-y-3 text-sm text-[#2C4A3E] dark:text-emerald-100 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Verified information, not marketing copy</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>No paid rankings, ever</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Transparent, side-by-side comparisons</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Expertise */}
              <div className="flex-shrink-0 w-[78vw] sm:w-[55vw] md:w-auto p-5 sm:p-6 md:p-7 rounded-2xl bg-white/90 dark:bg-[#0C241B]/95 border border-emerald-200/80 dark:border-emerald-700/40 hover:border-[#1F7A4D]/60 dark:hover:border-[#8FE24A]/60 transition-all backdrop-blur-md shadow-sm">
                <div className="text-xs font-mono font-bold text-[#1F7A4D] dark:text-[#8FE24A] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A]" />
                  02 — EXPERTISE
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0A2A1E] dark:text-white mb-3">Expertise</h3>
                <ul className="space-y-3 text-sm text-[#2C4A3E] dark:text-emerald-100 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Backed by industry experts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Real-world, on-road testing</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>The latest EV insights, explained simply</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Ecosystem */}
              <div className="flex-shrink-0 w-[78vw] sm:w-[55vw] md:w-auto p-5 sm:p-6 md:p-7 rounded-2xl bg-white/90 dark:bg-[#0C241B]/95 border border-emerald-200/80 dark:border-emerald-700/40 hover:border-[#1F7A4D]/60 dark:hover:border-[#8FE24A]/60 transition-all backdrop-blur-md shadow-sm">
                <div className="text-xs font-mono font-bold text-[#1F7A4D] dark:text-[#8FE24A] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A]" />
                  03 — ECOSYSTEM
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0A2A1E] dark:text-white mb-3">Ecosystem</h3>
                <ul className="space-y-3 text-sm text-[#2C4A3E] dark:text-emerald-100 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Vehicles, charging &amp; finance</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
                    <span>Insurance &amp; genuine parts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0 mt-0.5" />
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