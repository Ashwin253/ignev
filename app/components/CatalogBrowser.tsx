// app/components/CatalogBrowser.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Zap, CalendarDays, BadgeCheck, Share2, Check, ArrowRight, X, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, Truck, ArrowUpRight, Send, GitCompare, Search, Gauge, Play, ImageIcon, Battery
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
import { sortVehiclesByBrandRank, sortBrandsByRank } from "../lib/brand-rankings";

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-md ring-1 ring-zinc-200/60 dark:ring-zinc-800/60 shadow-sm hover:shadow-md transition-all"
      style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#f0fdf9]/85 dark:bg-zinc-900/85 backdrop-blur-[1px]" />
      <Link href={`/product/${slug}`} className="relative flex flex-1 flex-col">
        <div
          className="relative aspect-[4/3] overflow-hidden"
          style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <Image
            src={getVehiclePhoto(item.photo, item)}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isPlaying ? "opacity-0" : "opacity-100"}`}
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent pointer-events-none" />

          {/* Status Badge */}
          <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${launched ? "bg-[#34ebb1]/90 text-zinc-900" : "bg-amber-400/90 text-zinc-900"}`}>
            {launched ? <BadgeCheck size={12} /> : <CalendarDays size={12} />} {launchLabel}
          </span>

          {item.commercial && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md bg-orange-500/90 text-white">
              <Truck size={12} /> Commercial
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
            className={`absolute bottom-3 left-3 grid h-8 w-8 place-items-center rounded-full backdrop-blur-xl transition ${isInCompare(slug)
                ? "bg-zinc-900 dark:bg-zinc-800 text-white"
                : "bg-white/80 dark:bg-zinc-950/80 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900"
              }`}
          >
            <GitCompare size={14} />
          </button>

          {/* Play/Photo Toggle Button */}
          {videoUrl && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsPlaying(!isPlaying); }}
              aria-label={isPlaying ? "Show photos" : "Play video preview"}
              className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-white backdrop-blur-md hover:bg-zinc-800 transition"
            >
              {isPlaying ? <ImageIcon size={14} /> : <Play size={14} className="ml-0.5 fill-current" />}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{item.brand}</p>
            <h2 className="mt-0.5 line-clamp-1 text-[17px] font-bold tracking-tight text-zinc-900 dark:text-white">{item.name}</h2>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm w-full">
            <span className="font-bold text-zinc-900 dark:text-white">
              {item.pricing || "TBA"} 
              {item.baas && <span className="ml-1 text-[10px] font-mono bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 px-1.5 py-0.5 rounded">BAAS</span>}
            </span>
            <div className="flex items-center gap-3">
              {item.topSpeed != null && <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 dark:text-zinc-400"><Gauge size={12} />{item.topSpeed} km/h</span>}
              {item.drivingRange && <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 dark:text-zinc-400"><Battery size={12} className="text-emerald-500"/>{item.drivingRange} km</span>}
            </div>
          </div>

          <div className="mt-auto flex gap-2 pt-1">
            <span className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition">Details <ArrowUpRight size={12} /></span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerEnquiryModal(`${item.brand} ${item.name}`); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 dark:hover:bg-emerald-700 active:scale-[0.98] transition"
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
}: {
  items: CatalogItem[];
  hideComingSoonToggle?: boolean;
  forceUpcoming?: boolean;
  forceNewLaunches?: boolean;
  forceLaunched?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();

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
    
    if (category) {
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
    return ["all", ...sortBrandsByRank(rawBrands, category)];
  }, [allItems, category]);

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

    return sortVehiclesByBrandRank(matched, category);
  }, [brand, category, commercialOnly, allItems, launchedOnly, comingSoonOnly, price, query, baasOnly, usage, forceUpcoming, forceNewLaunches, forceLaunched]);

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

  const hasActiveFilters = category !== "cars" || brand !== "all" || price !== "all" || usage !== "all" || launchedOnly || comingSoonOnly || baasOnly || !!query.trim();
  const activeFilterCount = [category !== "cars", brand !== "all", price !== "all", usage !== "all", launchedOnly, comingSoonOnly, baasOnly, !!query.trim()].filter(Boolean).length;

  const clearAll = () => {
    setQuery("");
    setCategory("cars");
    setBrand("all");
    setPrice("all");
    setCommercialOnly(false);
    setLaunchedOnly(false);
    setComingSoonOnly(false);
    setBaasOnly(false);
    setUsage("all");
    window.history.replaceState(null, "", pathname);
  };

  return (
    <div className="space-y-6">

      {/* ── Glass Filter Panel (2026) ── */}
      <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950/95 backdrop-blur-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/5 overflow-hidden relative z-10 text-zinc-900 dark:text-white">
        
        {/* Mobile Header */}
        <div
          className="md:hidden flex items-center gap-3 px-5 py-4 cursor-pointer active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <div className="w-8 h-8 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-white/10">
            <SlidersHorizontal size={18} className="text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              {categoryOptions.find((o) => o.value === category)?.label || "Vehicles"}
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#34ebb1] text-[10px] font-bold text-zinc-900">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-zinc-550 dark:text-zinc-400">{filteredItems.length} results</div>
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

          {/* Type Pills - Glass style */}
          <div className="px-5 pt-5 pb-4 border-b border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilters({ type: opt.value })}
                  className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border flex-shrink-0 ${category === opt.value
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
          <div className="p-5 grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Search */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
                <Search size={18} className="text-zinc-500 dark:text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => updateFilters({ q: e.target.value })}
                  placeholder="Search by model or brand..."
                  className="flex-1 bg-transparent text-[15px] font-bold outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-white"
                />
                {query && (
                  <button onClick={() => updateFilters({ q: null })} aria-label="Clear search" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Brand */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">Brand</span>
                <select
                  value={brand}
                  onChange={(e) => updateFilters({ brand: e.target.value })}
                  className="flex-1 bg-transparent text-[15px] font-bold outline-none text-zinc-900 dark:text-white cursor-pointer appearance-none [&>option]:text-black dark:[&>option]:text-white dark:[&>option]:bg-zinc-950"
                >
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>{b === "all" ? "All brands" : b}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="text-zinc-500 dark:text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Price */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">Price</span>
                <select
                  value={price}
                  onChange={(e) => updateFilters({ price: e.target.value })}
                  className="flex-1 bg-transparent text-[15px] font-bold outline-none text-zinc-900 dark:text-white cursor-pointer appearance-none [&>option]:text-black dark:[&>option]:text-white dark:[&>option]:bg-zinc-950"
                >
                  <option value="all">All prices</option>
                  <option value="0-5">Under ₹5L</option>
                  <option value="5-15">₹5–15L</option>
                  <option value="15-30">₹15–30L</option>
                  <option value="30+">₹30L+</option>
                </select>
                <ChevronDown size={16} className="text-zinc-500 dark:text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Usage */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-3.5 focus-within:border-emerald-500 dark:focus-within:border-[#34ebb1]/50 transition-all">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0">Usage</span>
                <select
                  value={usage}
                  onChange={(e) => updateFilters({ usage: e.target.value })}
                  className="flex-1 bg-transparent text-[15px] font-bold outline-none text-zinc-900 dark:text-white cursor-pointer appearance-none [&>option]:text-black dark:[&>option]:text-white dark:[&>option]:bg-zinc-950"
                >
                  <option value="all">All usage</option>
                  <option value="Passenger">Passenger</option>
                  <option value="Goods">Goods</option>
                </select>
                <ChevronDown size={16} className="text-zinc-500 dark:text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Toggles + Count */}
          <div className="px-5 pb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {!hideComingSoonToggle && (
                <button
                  onClick={() => updateFilters({ upcoming: !comingSoonOnly })}
                  className={`inline-flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 text-sm font-bold transition-all ${
                    comingSoonOnly
                      ? "border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:border-[#34ebb1]/30 dark:bg-[#34ebb1]/10 dark:text-[#34ebb1]"
                      : "border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${comingSoonOnly ? 'bg-emerald-500 dark:bg-[#34ebb1]' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${comingSoonOnly ? 'translate-x-[18px] dark:bg-zinc-900' : 'translate-x-1'}`} />
                  </div>
                  <span className="flex items-center gap-1.5"><CalendarDays size={15} /> Coming Soon</span>
                </button>
              )}

              <button
                onClick={() => updateFilters({ baas: !baasOnly })}
                className={`inline-flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 text-sm font-bold transition-all ${
                  baasOnly
                    ? "border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:border-[#34ebb1]/30 dark:bg-[#34ebb1]/10 dark:text-[#34ebb1]"
                    : "border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-white/20"
                }`}
              >
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${baasOnly ? 'bg-emerald-500 dark:bg-[#34ebb1]' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${baasOnly ? 'translate-x-[18px] dark:bg-zinc-900' : 'translate-x-1'}`} />
                </div>
                <span className="flex items-center gap-1.5"><Zap size={15} /> BAAS</span>
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                >
                  <X size={16} /> Clear
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4 text-sm font-bold">
              <div className="text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-900 dark:text-white">{filteredItems.length}</span> of {items.length}
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/10 px-5 py-2.5 text-sm font-bold text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/20 hover:border-zinc-300 dark:hover:border-white/30 active:scale-[0.985] transition-all"
              >
                {shared ? <Check className="text-[#34ebb1]" size={17} /> : <Share2 size={17} />}
                {getShareButtonText()}
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
          <button onClick={clearAll} className="mt-4 text-red-400 hover:text-red-300 hover:underline text-sm font-semibold">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.slice(0, visibleCount).map((item, index) => (
              <CatalogCard
                key={item.slug ?? toSlug(item.brand, item.name)}
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