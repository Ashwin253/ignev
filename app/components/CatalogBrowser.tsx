// app/components/CatalogBrowser.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Zap, CalendarDays, BadgeCheck, Share2, Check, ArrowRight, X, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, Truck, ArrowUpRight, Send, GitCompare, Search, Gauge, Play, ImageIcon, Battery, BatteryCharging
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
import { getVehiclePhoto } from "../lib/vehicle-images";
import { sortVehiclesByBrandRank, sortBrandsByRank, type BrandRankItem } from "../lib/brand-rankings";
import { getVehicleCardSpecs } from "../lib/listing-specs";

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
  types?: string[];
  body_type?: string;
  bodyType?: string;
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
  video_links?: Array<{ url: string; title?: string; variantId?: string | null; variantName?: string | null }>;
  batterySpecs?: Array<{
    variantName?: string;
    maxPower?: string;
    maxTorque?: string;
    batteryCapacity?: string;
    [key: string]: any;
  }>;
  batteryVariants?: Array<{
    capacity?: string;
    range?: string;
    [key: string]: any;
  }>;
  power?: string;
  torque?: string;
  battery?: string;
  batteryCapacity?: string;
  battery_capacity?: string;
  battery_capacity_kwh?: string;
  max_power_bhp?: string;
  max_torque_nm?: string;
};

function getEmbedUrl(url: string) {
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
      } else {
        videoId = new URL(url).searchParams.get("v") || "";
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&mute=1` : null;
    }
    if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1` : null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

const VEHICLE_BACKGROUNDS = [
  "/listingbackground.jpg",
  "/listingbackgroundsecond.jpg",
  "/listingbackgroundthird.jpg",
  "/listingbackgroundforth.jpg",
  "/listingbackgroundfifth.jpg",
];

function CatalogCard({ item, index, isInCompare, addToCompare, removeFromCompare }: { 
  item: CatalogItem, index: number, isInCompare: (s:string)=>boolean, addToCompare: (s:string)=>void, removeFromCompare: (s:string)=>void 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const launched = isLaunched(item.launchdate);
  const launchLabel = formatLaunchDate(item.launchdate);
  const slug = item.slug ?? toSlug(item.brand, item.name);
  const { power, torque, battery } = getVehicleCardSpecs(item);

  const videoUrl = item.video_links?.[0]?.url;
  const isYoutubeOrVimeo = videoUrl && (
    videoUrl.includes("youtube.com") ||
    videoUrl.includes("youtu.be") ||
    videoUrl.includes("vimeo.com")
  );
  const isDirectVideo = videoUrl && !isYoutubeOrVimeo;

  const bgImage = VEHICLE_BACKGROUNDS[index % VEHICLE_BACKGROUNDS.length];

  return (
    <motion.article
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.9,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border backdrop-blur-lg shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white/60 hover:bg-white/90 dark:bg-[#071E15]/50 dark:hover:bg-[#071E15]/75 border-zinc-200/80 hover:border-emerald-400/80 dark:border-emerald-900/40 dark:hover:border-[#8FE24A]"
      style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#f0fdf9]/85 dark:bg-zinc-900/85 backdrop-blur-[1px] pointer-events-none" />
      <Link href={`/product/${slug}`} className="relative flex flex-1 flex-col justify-between">
        {/* Top Image Banner */}
        <div
          className="relative aspect-[4/3] overflow-hidden bg-white/30 dark:bg-black/20"
          style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <Image
            src={getVehiclePhoto(item.photo, item)}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isPlaying ? "opacity-0" : "opacity-100"}`}
          />

          {isDirectVideo && isPlaying && (
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute inset-0 z-10 bg-black">
              <video
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain pointer-events-none"
              />
            </div>
          )}

          {isYoutubeOrVimeo && isPlaying && (
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute inset-0 z-10 bg-black">
              {getEmbedUrl(videoUrl) ? (
                <iframe
                  src={getEmbedUrl(videoUrl)!}
                  className="h-full w-full border-0 pointer-events-none"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  tabIndex={-1}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white">Invalid Video URL</div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />

          {/* Status Badge */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold backdrop-blur-md shadow-xs ${launched ? "bg-[#34ebb1]/90 text-zinc-950" : "bg-amber-400/90 text-zinc-950"}`}>
              {launched ? <BadgeCheck size={11} /> : <CalendarDays size={11} />} {launchLabel}
            </span>
          </div>

          {item.commercial && (
            <span className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold backdrop-blur-md bg-orange-500/90 text-white shadow-xs">
              <Truck size={11} /> Commercial
            </span>
          )}

          {/* Compare Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isInCompare(slug) ? removeFromCompare(slug) : addToCompare(slug);
            }}
            aria-label={isInCompare(slug) ? `Remove ${item.brand} ${item.name} from comparison` : `Add ${item.brand} ${item.name} to comparison`}
            className={`absolute bottom-2.5 left-2.5 z-20 grid h-7 w-7 place-items-center rounded-full backdrop-blur-xl transition shadow-xs ${
              isInCompare(slug)
                ? "bg-[#1F7A4D] text-white ring-2 ring-white/50"
                : "bg-white/85 dark:bg-zinc-900/85 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
            }`}
          >
            <GitCompare size={13} />
          </button>

          {/* Play/Photo Toggle Button */}
          {videoUrl && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsPlaying(!isPlaying); }}
              aria-label={isPlaying ? "Show photos" : "Play video preview"}
              className="absolute bottom-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black transition shadow-xs"
            >
              {isPlaying ? <ImageIcon size={13} /> : <Play size={13} className="ml-0.5 fill-current" />}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1F7A4D] dark:text-emerald-400/80">{item.brand}</p>
            {/* Name on left, Price on right side of Name */}
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <h2 className="text-xs sm:text-sm font-bold text-[#0A2A1E] dark:text-white line-clamp-1 group-hover:underline flex-1 min-w-0" title={item.name}>
                {item.name}
              </h2>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs sm:text-sm font-black tracking-tight text-[#1F7A4D] dark:text-[#8FE24A]">
                  {item.pricing || "TBA"}
                </span>
                {item.baas && (
                  <span className="text-[9px] font-mono font-bold bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 px-1 py-0.5 rounded">
                    BAAS
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card Bottom: Power, Torque, Battery capacity (3-column spec grid) */}
          <div className="grid grid-cols-3 gap-1 mt-3 pt-2.5 border-t text-center border-[#D0E2CC]/60 dark:border-emerald-900/30">
            {/* Power */}
            <div className="flex items-center justify-center gap-1.5 min-w-0" title="Power">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2.4} />
              <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                {power || (item.topSpeed ? `${item.topSpeed} km/h` : "—")}
              </span>
            </div>

            {/* Torque */}
            <div className="flex items-center justify-center gap-1.5 min-w-0 border-x px-1 border-[#D0E2CC]/60 dark:border-emerald-900/30" title="Torque">
              <Gauge className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" strokeWidth={2.4} />
              <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                {torque || "—"}
              </span>
            </div>

            {/* Battery Capacity */}
            <div className="flex items-center justify-center gap-1.5 min-w-0" title="Battery / Range">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.4} />
              <span className="text-[11px] sm:text-xs font-extrabold text-[#0A2A1E] dark:text-slate-100 truncate font-mono">
                {battery || (item.drivingRange ? `${item.drivingRange} km` : "—")}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex gap-2 pt-1 border-t border-zinc-100 dark:border-white/5">
            <span className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-200/90 dark:group-hover:bg-zinc-700 transition">
              Details <ArrowUpRight size={12} />
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerEnquiryModal(`${item.brand} ${item.name}`); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1F7A4D] hover:bg-[#289660] dark:bg-emerald-600 dark:hover:bg-emerald-500 py-2 text-xs font-bold text-white active:scale-[0.98] transition shadow-xs cursor-pointer"
            >
              Enquire <Send size={12} />
            </button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// // ── Price filter ──────────────────────────────────────────────────────────────

function parsePriceLow(item: CatalogItem): number {
  if (item.prices?.length) {
    const raw = String(item.prices[0]).replace(/[₹,a-zA-Z\s]/g, "");
    const low = parseFloat(raw.split(/[-–]/)[0]);
    if (!isNaN(low) && low > 0) {
      return low > 1000 ? low / 100000 : low;
    }
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

function matchesSearchQuery(item: CatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const brand = (item.brand || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const type = (item.type || "").toLowerCase();
  const slug = (item.slug || "").toLowerCase();
  const usage = (item.usageType || "").toLowerCase();
  const pricing = (item.pricing || "").toLowerCase();

  const fullText = `${brand} ${name} ${type} ${usage} ${slug} ${pricing} ${
    item.commercial
      ? "commercial fleet cargo truck 3w loader tempo auto"
      : "personal passenger 4w 4-wheeler car suv sedan hatchback scooter bike motorcycle"
  }`;

  // Direct substring match
  if (fullText.includes(q)) return true;

  // Split query into tokens
  const words = q.split(/[\s,+/_-]+/).filter(Boolean);
  if (words.length === 0) return true;

  return words.every((word) => {
    if (fullText.includes(word)) return true;

    // Aliases & Vehicle category terms
    if (
      word === "car" ||
      word === "cars" ||
      word === "4w" ||
      word === "4-wheeler" ||
      word === "4-wheelers" ||
      word === "suv" ||
      word === "sedan" ||
      word === "hatchback"
    ) {
      return (
        type.includes("car") ||
        type.includes("4") ||
        fullText.includes("car") ||
        fullText.includes("suv") ||
        fullText.includes("sedan")
      );
    }
    if (
      word === "bike" ||
      word === "bikes" ||
      word === "motorcycle" ||
      word === "motorcycles" ||
      word === "2w"
    ) {
      return (
        type.includes("motorcycle") ||
        type.includes("bike") ||
        fullText.includes("bike") ||
        fullText.includes("motorcycle") ||
        ["revolt", "ultraviolette", "matter", "tork", "oben", "hop", "kabira", "orxa", "raptee"].some(
          (b) => brand.includes(b) || name.includes(b)
        )
      );
    }
    if (word === "scooter" || word === "scooters" || word === "scooty" || word === "moped") {
      return (
        type.includes("scooter") ||
        fullText.includes("scooter") ||
        fullText.includes("scooty") ||
        ["ather", "ola", "tvs", "chetak", "rizta", "iqube", "vida", "river", "bgauss", "bounce", "simple", "okinawa", "ampere", "quantum", "pure"].some(
          (b) => brand.includes(b) || name.includes(b)
        )
      );
    }
    if (word === "ev" || word === "electric" || word === "vehicle" || word === "vehicles") {
      return true; // All items in the catalog are EVs
    }
    if (
      word === "commercial" ||
      word === "cargo" ||
      word === "truck" ||
      word === "tempo" ||
      word === "auto" ||
      word === "3w" ||
      word === "3-wheeler" ||
      word === "3-wheelers" ||
      word === "loader" ||
      word === "rickshaw" ||
      word === "fleet"
    ) {
      return (
        item.commercial === true ||
        type.includes("auto") ||
        type.includes("cargo") ||
        type.includes("3") ||
        type.includes("truck") ||
        usage.includes("commercial")
      );
    }

    return false;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CatalogBrowser({
  items,
  hideComingSoonToggle = false,
  forceUpcoming = false,
  forceNewLaunches = false,
  forceLaunched = false,
  brandRankings = [],
}: {
  items: CatalogItem[];
  hideComingSoonToggle?: boolean;
  forceUpcoming?: boolean;
  forceNewLaunches?: boolean;
  forceLaunched?: boolean;
  brandRankings?: BrandRankItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();

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

  // Read initial state from URL or defaults
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<CatalogCategoryValue>(
    normalizeCatalogCategory(searchParams.get("type"))
  );
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "all");
  const [price, setPrice] = useState(searchParams.get("price") ?? "all");
  const [commercialOnly, setCommercialOnly] = useState(searchParams.get("comm") === "true");
  const [launchedOnly, setLaunchedOnly] = useState(searchParams.get("avail") === "true");
  const [comingSoonOnly, setComingSoonOnly] = useState(searchParams.get("upcoming") === "true");
  const [baasOnly, setBaasOnly] = useState(searchParams.get("baas") === "true");
  const [usage, setUsage] = useState(searchParams.get("usage") ?? "all");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [allItems, setAllItems] = useState<CatalogItem[]>(items);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingSkeleton, setLoadingSkeleton] = useState(false);
  const [hasFetchedAll, setHasFetchedAll] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Sync state if searchParams change
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setCategory(normalizeCatalogCategory(searchParams.get("type")));
    setBrand(searchParams.get("brand") ?? "all");
    setPrice(searchParams.get("price") ?? "all");
    setCommercialOnly(searchParams.get("comm") === "true");
    setLaunchedOnly(searchParams.get("avail") === "true");
    setComingSoonOnly(searchParams.get("upcoming") === "true");
    setBaasOnly(searchParams.get("baas") === "true");
    setUsage(searchParams.get("usage") ?? "all");
  }, [searchParams]);

  // Keep items updated when props change
  useEffect(() => {
    if (items.length > 0) {
      setAllItems((prev) => (prev.length >= items.length ? prev : items));
    }
  }, [items]);

  const fetchAllItems = async () => {
    if (hasFetchedAll) return;
    setLoadingMore(true);
    try {
      const res = await fetch("/api/catalog-all");
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0) {
          setAllItems(data.items);
        }
      }
    } catch { /* use what we have */ }
    setHasFetchedAll(true);
    setLoadingMore(false);
  };

  // If query is present, eagerly fetch full catalog in background
  useEffect(() => {
    if (query.trim() && !hasFetchedAll) {
      fetchAllItems();
    }
  }, [query, hasFetchedAll]);

  const getShareButtonText = () => {
    if (shared) return "Link copied";
    if (query) return `Share "${query}" search`;
    
    const parts: string[] = [];
    if (brand !== "all") {
      parts.push(brand.charAt(0).toUpperCase() + brand.slice(1));
    }
    
    if (category && category !== "all") {
      const catLabel = categoryOptions.find((o) => o.value === category)?.label;
      if (catLabel) parts.push(catLabel);
    } else if (brand !== "all") {
      parts.push("Vehicles");
    }

    if (baasOnly) parts.push("(BaaS)");
    if (parts.length > 0) return `Share ${parts.join(" ")}`;
    
    return "Share catalog";
  };

  const handleShare = async () => {
    const url = window.location.href;
    const desc = getShareButtonText().replace("Share ", "");
    const shareTitle = desc === "catalog" ? "EVPLSE Catalog" : `EVPLSE Catalog - ${desc}`;
    const shareText = desc === "catalog" 
      ? "Check out the electric vehicle catalog on EVPULSE!"
      : `Check out these electric vehicles on EVPULSE: ${desc}`;

    if (navigator.share) {
      await navigator.share({ 
        title: shareTitle, 
        text: shareText, 
        url 
      }).catch(() => { });
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const updateFilters = (updates: Record<string, string | boolean | null>) => {
    // 1. Immediately update reactive state
    if ("q" in updates) setQuery(updates.q ? String(updates.q) : "");
    if ("type" in updates) setCategory(normalizeCatalogCategory(updates.type as string));
    if ("brand" in updates) setBrand(updates.brand ? String(updates.brand) : "all");
    if ("price" in updates) setPrice(updates.price ? String(updates.price) : "all");
    if ("comm" in updates) setCommercialOnly(updates.comm === true || updates.comm === "true");
    if ("avail" in updates) setLaunchedOnly(updates.avail === true || updates.avail === "true");
    if ("upcoming" in updates) setComingSoonOnly(updates.upcoming === true || updates.upcoming === "true");
    if ("baas" in updates) setBaasOnly(updates.baas === true || updates.baas === "true");
    if ("usage" in updates) setUsage(updates.usage ? String(updates.usage) : "all");

    // 2. Silently update URL query params
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, "", newUrl);
  };

  const categoryOptions = useMemo(() => [...CATALOG_CATEGORIES], []);

  const brandOptions = useMemo(() => {
    const rawBrands = [...new Set(allItems.map((i) => i.brand).filter(Boolean))];
    return ["all", ...sortBrandsByRank(rawBrands, category, liveBrandRankings)];
  }, [allItems, category, liveBrandRankings]);

  const filteredItems = useMemo(() => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const matched = allItems.filter((item) => {
      // 1. General search query matcher
      if (!matchesSearchQuery(item, query)) return false;

      // 2. Category matching
      if (!matchesCatalogCategory(item, category as CatalogCategoryValue)) return false;

      // 3. Brand filter
      if (brand !== "all" && item.brand.toLowerCase() !== brand.toLowerCase()) return false;

      // 4. Price filter
      if (!matchesPrice(item, price)) return false;

      // 6. Forced filters
      if (forceUpcoming) {
        if (isLaunched(item.launchdate)) return false;
      } else if (forceLaunched) {
        if (!isLaunched(item.launchdate)) return false;
      } else if (forceNewLaunches) {
        if (!isLaunched(item.launchdate)) return false;
        if (!item.launchdate) return false;
        const d = new Date(item.launchdate);
        if (isNaN(d.getTime()) || d < twoMonthsAgo) return false;
      } else {
        // Standard toggles
        if (launchedOnly && !isLaunched(item.launchdate)) return false;
        if (comingSoonOnly && isLaunched(item.launchdate)) return false;
      }

      if (baasOnly && !item.baas) return false;
      if (usage !== "all" && item.usageType !== usage) return false;
      return true;
    });

    return sortVehiclesByBrandRank(matched, category, liveBrandRankings);
  }, [brand, category, commercialOnly, allItems, launchedOnly, comingSoonOnly, price, query, baasOnly, usage, forceUpcoming, forceNewLaunches, forceLaunched, liveBrandRankings]);

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
    setVisibleCount(12);
  }, [filterKey]);

  const hasActiveFilters = category !== "all" || brand !== "all" || price !== "all" || usage !== "all" || launchedOnly || comingSoonOnly || baasOnly || !!query.trim();
  const activeFilterCount = [category !== "all", brand !== "all", price !== "all", usage !== "all", launchedOnly, comingSoonOnly, baasOnly, !!query.trim()].filter(Boolean).length;

  const [floatingFiltersOpen, setFloatingFiltersOpen] = useState(false);

  // Sticky watcher for Filter Bar & Header minimization
  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);

  useEffect(() => {
    let rafId: number;

    const checkSticky = () => {
      if (!filterContainerRef.current) return;
      const rect = filterContainerRef.current.getBoundingClientRect();
      const sticky = rect.top <= 10;
      if (sticky !== isStickyRef.current) {
        isStickyRef.current = sticky;
        setIsSticky(sticky);
        if (!sticky) {
          setFloatingFiltersOpen(false);
        }
        window.dispatchEvent(
          new CustomEvent("ecosystem-tabs-sticky", { detail: { isSticky: sticky } })
        );
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkSticky);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    checkSticky();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.dispatchEvent(
        new CustomEvent("ecosystem-tabs-sticky", { detail: { isSticky: false } })
      );
    };
  }, []);

  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setBrand("all");
    setPrice("all");
    setCommercialOnly(false);
    setLaunchedOnly(false);
    setComingSoonOnly(false);
    setBaasOnly(false);
    setUsage("all");
    window.history.replaceState(null, "", pathname);
  };

  const renderFilterContent = (isFloatingModal: boolean = false, onClose?: () => void) => (
    <div className="text-zinc-900 dark:text-white">
      {/* If floating modal, show top header with Close button */}
      {isFloatingModal && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-[#8FE24A]">
              <SlidersHorizontal size={16} strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-sm font-black text-zinc-900 dark:text-white">Filter Catalog</span>
              <span className="ml-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                ({filteredItems.length} {filteredItems.length === 1 ? "result" : "results"})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Type Pills */}
      <div className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilters({ type: opt.value })}
              className={`snap-start whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex-shrink-0 cursor-pointer ${
                category === opt.value
                  ? "bg-emerald-600 border-emerald-600 text-white dark:bg-[#34ebb1] dark:border-[#34ebb1] dark:text-zinc-950 shadow-md"
                  : "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/30 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Selects */}
      <div className="p-4 sm:p-5 grid gap-3 sm:gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-3 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-2.5 sm:px-5 sm:py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
            <Search size={17} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => updateFilters({ q: e.target.value })}
              placeholder="Search model or brand..."
              className="flex-1 bg-transparent text-xs sm:text-[15px] font-bold outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-white min-w-0"
            />
            {query && (
              <button onClick={() => updateFilters({ q: null })} aria-label="Clear search" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Brand */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-2.5 sm:px-5 sm:py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">Brand</span>
            <select
              value={brand}
              onChange={(e) => updateFilters({ brand: e.target.value })}
              className="flex-1 bg-transparent text-xs sm:text-[15px] font-bold outline-none text-zinc-900 dark:text-white cursor-pointer appearance-none [&>option]:text-black dark:[&>option]:text-white dark:[&>option]:bg-zinc-950 truncate"
            >
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b === "all" ? "All brands" : b}</option>
              ))}
            </select>
            <ChevronDown size={15} className="text-zinc-500 dark:text-zinc-400 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Price */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-2.5 sm:px-5 sm:py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">Price</span>
            <select
              value={price}
              onChange={(e) => updateFilters({ price: e.target.value })}
              className="flex-1 bg-transparent text-xs sm:text-[15px] font-bold outline-none text-zinc-900 dark:text-white cursor-pointer appearance-none [&>option]:text-black dark:[&>option]:text-white dark:[&>option]:bg-zinc-950 truncate"
            >
              <option value="all">All prices</option>
              <option value="0-5">Under ₹5L</option>
              <option value="5-15">₹5–15L</option>
              <option value="15-30">₹15–30L</option>
              <option value="30+">₹30L+</option>
            </select>
            <ChevronDown size={15} className="text-zinc-500 dark:text-zinc-400 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Usage */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-2.5 sm:px-5 sm:py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">Usage</span>
            <select
              value={usage}
              onChange={(e) => updateFilters({ usage: e.target.value })}
              className="flex-1 bg-transparent text-xs sm:text-[15px] font-bold outline-none text-zinc-900 dark:text-white cursor-pointer appearance-none [&>option]:text-black dark:[&>option]:text-white dark:[&>option]:bg-zinc-950 truncate"
            >
              <option value="all">All usage</option>
              <option value="Passenger">Passenger</option>
              <option value="Goods">Goods</option>
            </select>
            <ChevronDown size={15} className="text-zinc-500 dark:text-zinc-400 pointer-events-none shrink-0" />
          </div>
        </div>
      </div>

      {/* Toggles + Count */}
      <div className="px-5 pb-4 sm:pb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {!hideComingSoonToggle && (
            <button
              onClick={() => updateFilters({ upcoming: !comingSoonOnly })}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                comingSoonOnly
                  ? "border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:border-[#34ebb1]/30 dark:bg-[#34ebb1]/10 dark:text-[#34ebb1]"
                  : "border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
              }`}
            >
              <div className={`relative inline-flex h-4 sm:h-5 w-8 sm:w-9 items-center rounded-full transition-colors ${comingSoonOnly ? 'bg-emerald-500 dark:bg-[#34ebb1]' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                <span className={`inline-block h-3 sm:h-3.5 w-3 sm:w-3.5 transform rounded-full bg-white transition-transform duration-200 ${comingSoonOnly ? 'translate-x-[16px] sm:translate-x-[18px] dark:bg-zinc-900' : 'translate-x-0.5 sm:translate-x-1'}`} />
              </div>
              <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Coming Soon</span>
            </button>
          )}

          <button
            onClick={() => updateFilters({ baas: !baasOnly })}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs sm:text-sm font-bold transition-all ${
              baasOnly
                ? "border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:border-[#34ebb1]/30 dark:bg-[#34ebb1]/10 dark:text-[#34ebb1]"
                : "border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
            }`}
          >
            <div className={`relative inline-flex h-4 sm:h-5 w-8 sm:w-9 items-center rounded-full transition-colors ${baasOnly ? 'bg-emerald-500 dark:bg-[#34ebb1]' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
              <span className={`inline-block h-3 sm:h-3.5 w-3 sm:w-3.5 transform rounded-full bg-white transition-transform duration-200 ${baasOnly ? 'translate-x-[16px] sm:translate-x-[18px] dark:bg-zinc-900' : 'translate-x-0.5 sm:translate-x-1'}`} />
            </div>
            <span className="flex items-center gap-1.5"><Zap size={14} /> BAAS</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-red-500/30 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 transition-all cursor-pointer"
            >
              <X size={15} /> Clear All
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
          <div className="text-zinc-500 dark:text-zinc-400">
            <span className="text-zinc-900 dark:text-white font-black">{filteredItems.length}</span> of {items.length}
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 py-2 text-xs sm:text-sm font-bold text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/20 transition-all cursor-pointer"
          >
            {shared ? <Check className="text-[#34ebb1]" size={15} /> : <Share2 size={15} />}
            {getShareButtonText()}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Inline Glass Filter Panel (Top of Page) ── */}
      <div
        ref={filterContainerRef}
        className="relative z-10 transition-opacity duration-300"
      >
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950/95 backdrop-blur-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/5 overflow-hidden text-zinc-900 dark:text-white">
          {/* Mobile Accordion Header on initial page view */}
          <div
            className="md:hidden flex items-center gap-3 px-5 py-4 cursor-pointer active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <div className="w-8 h-8 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-white/10">
              <SlidersHorizontal size={18} className="text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                {category === "all" ? "All Vehicles" : (categoryOptions.find((o) => o.value === category)?.label || "Vehicles")}
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#34ebb1] text-[10px] font-bold text-zinc-900">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{filteredItems.length} results</div>
            </div>
            
            {filtersOpen ? <ChevronUp size={20} className="text-zinc-500 dark:text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-500 dark:text-zinc-400" />}

            {/* Share Button - Mobile */}
            <button
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              aria-label="Share catalog"
              className="ml-auto w-9 h-9 flex items-center justify-center rounded-2xl bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-600 transition-all border border-zinc-205 dark:border-white/10"
            >
              {shared ? <Check size={18} className="text-[#34ebb1]" /> : <Share2 size={18} className="text-zinc-500 dark:text-zinc-400" />}
            </button>
          </div>

          {/* Filter Content */}
          <div className={filtersOpen ? "block" : "hidden md:block"}>
            {renderFilterContent(false)}
          </div>
        </div>
      </div>

      {/* ── Minimized Floating Filter Pill: Desktop Left ── */}
      <AnimatePresence>
        {isSticky && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="hidden sm:block fixed top-3.5 left-6 z-[120] pointer-events-auto"
          >
            <button
              onClick={() => setFloatingFiltersOpen((v) => !v)}
              title="Filter Options"
              aria-label="Filter options"
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#071E15]/95 backdrop-blur-2xl border-2 border-[#1F7A4D]/40 dark:border-emerald-500/50 shadow-xl shadow-emerald-950/20 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-[#0C2B1F] transition-all cursor-pointer active:scale-95 group"
            >
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-[#8FE24A]">
                <SlidersHorizontal size={14} strokeWidth={2.4} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[11px] sm:text-xs font-black">Filter:</span>
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                {category === "all" ? "All" : (categoryOptions.find((o) => o.value === category)?.label || category)}
              </span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A] text-[9px] font-black text-white dark:text-zinc-950">
                  {activeFilterCount}
                </span>
              )}
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold">
                • {filteredItems.length}
              </span>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#1F7A4D] dark:text-[#8FE24A] font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 ml-0.5">
                <span>{floatingFiltersOpen ? "Close" : "Change"}</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2.6}
                  className={`transition-transform duration-200 ${floatingFiltersOpen ? "rotate-180" : "group-hover:translate-y-0.5"}`}
                />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Minimized Floating Filter Pill: Mobile Below Header ── */}
      <AnimatePresence>
        {isSticky && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="sm:hidden fixed top-10 left-3 right-3 z-[115] pointer-events-auto"
          >
            <button
              onClick={() => setFloatingFiltersOpen((v) => !v)}
              aria-label="Filter options"
              className="w-full flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#071E15]/95 backdrop-blur-2xl border-2 border-[#1F7A4D]/40 dark:border-emerald-500/50 shadow-xl shadow-emerald-950/20 text-xs font-bold text-zinc-900 dark:text-zinc-100 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <SlidersHorizontal size={13} className="text-emerald-600 dark:text-[#8FE24A] shrink-0" strokeWidth={2.5} />
                <span className="text-xs font-black text-zinc-900 dark:text-white truncate">
                  {category === "all" ? "All Vehicles" : (categoryOptions.find((o) => o.value === category)?.label || category)}
                </span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A] text-[9.5px] font-black text-white dark:text-zinc-950 shrink-0">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">{filteredItems.length} results</span>
                <div className="flex items-center gap-1 text-[10px] text-[#1F7A4D] dark:text-[#8FE24A] font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                  <span>{floatingFiltersOpen ? "Hide" : "Filter"}</span>
                  <ChevronDown
                    size={11}
                    strokeWidth={2.6}
                    className={`transition-transform duration-200 ${floatingFiltersOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Expanded Floating Filter Modal (When Minimized Pill Clicked) ── */}
      <AnimatePresence>
        {isSticky && floatingFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[124] pointer-events-auto"
              onClick={() => setFloatingFiltersOpen(false)}
            />

            {/* Floating Filter Card */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-14 sm:top-14 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-4xl sm:w-[calc(100vw-3rem)] max-h-[82vh] overflow-y-auto z-[125] rounded-3xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-2 border-[#1F7A4D]/40 dark:border-emerald-500/50 shadow-2xl shadow-emerald-950/25 pointer-events-auto"
            >
              {renderFilterContent(true, () => setFloatingFiltersOpen(false))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
          <button onClick={clearAll} className="mt-4 text-red-400 hover:text-red-300 hover:underline text-sm font-semibold">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.slice(0, visibleCount).map((item, index) => (
              <CatalogCard
                key={`${category}-${item.slug ?? toSlug(item.brand, item.name)}`}
                item={item}
                index={index}
                isInCompare={isInCompare}
                addToCompare={addToCompare}
                removeFromCompare={removeFromCompare}
              />
            ))}
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