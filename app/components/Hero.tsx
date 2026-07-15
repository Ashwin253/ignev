"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CarFront, Bike, Truck, Sparkles, Send,
  Star, BadgeCheck, CalendarDays, Gauge, Battery,
  ChevronDown, ArrowUpRight, GitCompare, X, Search, Play, ImageIcon,
} from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";
import { useCompare } from "../context/CompareContext";
import type { EvListing, HeroBanner } from "../lib/wordpress";
import { formatLaunchDate, isLaunched, formatPricing } from "../lib/wordpress";
import { catalogFilterUrl } from "../lib/catalog-filters";

type Product = {
  name: string; brand: string; type: string; pricing: string; photo: string; slug?: string;
  topSpeed?: number | null; drivingRange?: string;
  video_links?: Array<{ url: string; title?: string; variantId?: string | null; variantName?: string | null }>;
  bodyType?: string;
};
type ProductsPayload = {
  electric_cars: Product[]; electric_two_wheelers: Product[]; electric_autos: Product[];
};
type TabKey = "dropdown" | "cars" | "twoWheelers" | "commercial";
type SubCategoryKey = "trending" | "fresh" | "upcoming";

function toSlug(brand: string, name: string) {
  return `${brand}-${name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

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

// ── Shared Card Shell (no Link inside) ───────────────────────────────────────

function CardBase({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group relative flex flex-col overflow-hidden rounded-md ring-1 ring-zinc-200/60 shadow-sm hover:shadow-md transition-all w-full sm:w-[300px] md:w-auto shrink-0 snap-center h-auto sm:h-full"
      style={{ backgroundImage: "url('/listingbackground.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* light mint overlay */}
      <div className="absolute inset-0 bg-[#f0fdf9]/85 backdrop-blur-[1px] pointer-events-none z-0" />
      {children}
    </motion.article>
  );
}

function FeaturedCard({ listing, index }: { listing: EvListing; index: number }) {
  const launched = isLaunched(listing.launchdate);
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const inCompare = isInCompare(listing.slug);

  const videoUrl = listing.video_links?.[0]?.url;
  const isYoutubeOrVimeo = videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo.com"));
  const isDirectVideo = videoUrl && !isYoutubeOrVimeo;

  const [isPlaying, setIsPlaying] = useState(false);
  const href = `/product/${listing.slug}`;

  return (
    <CardBase index={index}>
      <Link href={href} className="relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Action buttons inside the image container */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); inCompare ? removeFromCompare(listing.slug) : addToCompare(listing.slug); }}
            className={`absolute bottom-3 left-3 z-20 grid h-8 w-8 place-items-center rounded-full backdrop-blur-xl transition ${inCompare ? "bg-zinc-900 text-white" : "bg-white/80 text-zinc-700 hover:bg-white"}`}
            aria-label="Compare"
          >
            <GitCompare size={14} />
          </button>

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
          {listing.photo && (
            <Image
              src={listing.photo}
              alt={listing.title}
              fill
              sizes="(max-width:768px) 90vw, 25vw"
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${isPlaying ? "opacity-0" : "opacity-100"}`}
            />
          )}

          {isDirectVideo && isPlaying && (
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute inset-0 z-10 bg-black">
              <video src={videoUrl} autoPlay muted loop playsInline className="h-full w-full object-contain pointer-events-none" />
            </div>
          )}

          {isYoutubeOrVimeo && isPlaying && (
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute inset-0 z-10 bg-black">
              {getEmbedUrl(videoUrl) ? (
                <iframe src={getEmbedUrl(videoUrl)!} className="h-full w-full border-0 pointer-events-none" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" tabIndex={-1} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white">Invalid Video URL</div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent pointer-events-none" />

          <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${launched ? "bg-[#34ebb1]/90 text-zinc-900" : "bg-amber-400/90 text-zinc-900"}`}>
            {launched ? <BadgeCheck size={12} /> : <CalendarDays size={12} />} {formatLaunchDate(listing.launchdate)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{listing.brand}</p>
            <h2 className="mt-0.5 line-clamp-1 text-[17px] font-semibold tracking-tight text-zinc-900">{listing.title}</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm w-full">
            {listing.prices.length > 0 && <span className="font-medium text-zinc-900">{formatPricing(listing.prices)}</span>}
            <div className="flex items-center gap-3">
              {listing.topSpeed != null && <span className="inline-flex items-center gap-1 text-xs text-zinc-500"><Gauge size={12} />{listing.topSpeed} km/h</span>}
              {listing.batteryVariants?.[0]?.range && <span className="inline-flex items-center gap-1 text-xs text-zinc-500"><Battery size={12} className="text-emerald-500" />{listing.batteryVariants[0].range} km</span>}
            </div>
          </div>
        </div>
      </Link>

      {/* Bottom actions bar — OUTSIDE Link for reliable mobile clicks */}
      <div className="relative z-10 flex gap-2 px-5 pb-5 pt-1">
        <Link href={href} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-zinc-100 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition">
          Details <ArrowUpRight size={12} />
        </Link>
        <button
          onClick={() => triggerEnquiryModal(`${listing.brand} ${listing.title}`)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-xs font-medium text-white hover:bg-zinc-800 active:scale-[0.98] transition"
        >
          Enquire <Send size={12} />
        </button>
      </div>
    </CardBase>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const slug = product.slug ?? toSlug(product.brand, product.name);
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const inCompare = isInCompare(slug);

  const videoUrl = product.video_links?.[0]?.url;
  const isYoutubeOrVimeo = videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo.com"));
  const isDirectVideo = videoUrl && !isYoutubeOrVimeo;

  const [isPlaying, setIsPlaying] = useState(false);
  const href = `/product/${slug}`;

  return (
    <CardBase index={index}>
      <Link href={href} className="relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Action buttons inside the image container */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); inCompare ? removeFromCompare(slug) : addToCompare(slug); }}
            className={`absolute bottom-3 left-3 z-20 grid h-8 w-8 place-items-center rounded-full backdrop-blur-xl transition ${inCompare ? "bg-zinc-900 text-white" : "bg-white/80 text-zinc-700 hover:bg-white"}`}
            aria-label="Compare"
          >
            <GitCompare size={14} />
          </button>

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
          {product.photo && (
            <Image
              src={product.photo}
              alt={product.name}
              fill
              sizes="(max-width:768px) 90vw, 20vw"
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${isPlaying ? "opacity-0" : "opacity-100"}`}
            />
          )}

          {isDirectVideo && isPlaying && (
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute inset-0 z-10 bg-black">
              <video src={videoUrl} autoPlay muted loop playsInline className="h-full w-full object-contain pointer-events-none" />
            </div>
          )}

          {isYoutubeOrVimeo && isPlaying && (
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute inset-0 z-10 bg-black">
              {getEmbedUrl(videoUrl) ? (
                <iframe src={getEmbedUrl(videoUrl)!} className="h-full w-full border-0 pointer-events-none" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" tabIndex={-1} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white">Invalid Video URL</div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent pointer-events-none" />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{product.brand}</p>
            <h2 className="mt-0.5 line-clamp-1 text-[17px] font-semibold tracking-tight text-zinc-900">{product.name}</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm w-full">
            <span className="font-medium text-zinc-900">{product.pricing}</span>
            <div className="flex items-center gap-3">
              {product.topSpeed != null && <span className="inline-flex items-center gap-1 text-xs text-zinc-500"><Gauge size={12} />{product.topSpeed} km/h</span>}
              {product.drivingRange && <span className="inline-flex items-center gap-1 text-xs text-zinc-500"><Battery size={12} className="text-emerald-500" />{product.drivingRange} km</span>}
            </div>
          </div>
        </div>
      </Link>

      {/* Bottom actions bar — OUTSIDE Link for reliable mobile clicks */}
      <div className="relative z-10 flex gap-2 px-5 pb-5 pt-1">
        <Link href={href} className="flex-1 rounded-xl bg-zinc-100 py-2.5 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition">
          Details
        </Link>
        <button
          onClick={() => triggerEnquiryModal(`${product.brand} ${product.name}`)}
          className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-center text-xs font-medium text-white hover:bg-zinc-800 active:scale-[0.98] transition"
        >
          Enquire
        </button>
      </div>
    </CardBase>
  );
}

// ── Hero Component ───────────────────────────────────────────────────────────

export default function Hero({
  products,
  listings = [],
  freshReleases = [],
  upcoming = [],
}: {
  products: ProductsPayload;
  listings?: EvListing[];
  freshReleases?: EvListing[];
  upcoming?: EvListing[];
  banners?: HeroBanner[];
}) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"2 Wheeler" | "4 Wheeler" | "commercial">("2 Wheeler");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [activeTab, setActiveTab] = useState<TabKey>("dropdown");
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategoryKey>("trending");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const subCategories = [
    { key: "trending", label: "Trending", icon: Star },
    { key: "fresh", label: "New Release", icon: Sparkles },
    { key: "upcoming", label: "Coming Soon", icon: CalendarDays },
  ] as const;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / (el.scrollWidth / currentItems.length));
    setActiveIndex(index);
  };

  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [activeTab, activeSubCategory]);

  const POPULAR_BRANDS = useMemo(() => {
    if (selectedType === "4 Wheeler") return ["Tata", "Mahindra", "BYD", "Vinfast"];
    if (selectedType === "commercial") return ["Euler", "Bajaj", "TVS", "Grevol"];
    return ["Ather", "TVS", "Bajaj", "Euler"];
  }, [selectedType]);

  const catalogProducts = useMemo(() => {
    if (activeTab === "cars") {
      const excluded = ["auto", "autos", "tempo", "tempos", "rickshaw", "3 wheeler", "commercial"];
      const normalized = (s: string) => s?.toLowerCase().trim() || "";
      const validCars = products.electric_cars.filter(p => {
        const t = normalized(p.type);
        return !excluded.some(ex => t === ex || t.startsWith(ex + " ") || t.endsWith(" " + ex));
      });
      const allowed = ["suv", "hatchback", "compact suv"];
      const filtered = validCars.filter(p => allowed.includes(p.bodyType?.toLowerCase().trim() || ""));
      return filtered.slice(0, 4);
    }
    if (activeTab === "twoWheelers") return products.electric_two_wheelers.slice(0, 4);
    if (activeTab === "commercial") {
      return listings
        .filter(l => l.commercial === true)
        .map(l => ({
          name: l.title,
          brand: l.brand,
          type: l.types[0] || "",
          pricing: formatPricing(l.prices),
          photo: l.photo,
          slug: l.slug,
          topSpeed: l.topSpeed,
          drivingRange: l.batteryVariants?.[0]?.range || "",
          commercial: l.commercial,
          video_links: l.video_links,
        }))
        .slice(0, 4);
     }
    return [...products.electric_cars.slice(0, 2), ...products.electric_two_wheelers.slice(0, 2)];
  }, [activeTab, products]);

  const currentItems = useMemo(() => {
    if (activeTab === "dropdown") {
      if (activeSubCategory === "trending") {
        const explicitFeatured = listings.filter(l => (l as any).featured === true);
        if (explicitFeatured.length > 0) return explicitFeatured;

        // Fallback: show a mix of cars, two wheelers, and autos
        const cars = listings.filter(l => {
          const t = (l.types && l.types[0] || "").toLowerCase();
          return t.includes("car") || t.includes("suv") || t.includes("sedan") || t.includes("hatchback") || t.includes("4 wheeler");
        }).slice(0, 4);

        const twoWheelers = listings.filter(l => {
          const t = (l.types && l.types[0] || "").toLowerCase();
          return t.includes("scooter") || t.includes("bike") || t.includes("motorcycle") || t.includes("2 wheeler") || t.includes("2-wheeler");
        }).slice(0, 4);

        const autos = listings.filter(l => {
          const t = (l.types && l.types[0] || "").toLowerCase();
          return t.includes("auto") || t.includes("rickshaw") || t.includes("3 wheeler") || t.includes("3-wheeler") || t.includes("tempo");
        }).slice(0, 2);

        return [...cars, ...twoWheelers, ...autos];
      }
      if (activeSubCategory === "fresh") {
        return freshReleases;
      }
      if (activeSubCategory === "upcoming") {
        return upcoming;
      }
      return listings.slice(0, 8);
    }
    return catalogProducts;
  }, [activeTab, activeSubCategory, listings, freshReleases, upcoming, catalogProducts]);

  const BRAND_MAP: Record<string, string> = { Ather: "ATHER", Euler: "EULER MOTORS", TVS: "TVS", Bajaj: "BAJAJ", Ola: "OLA", Vida: "VIDA", Revolt: "REVOLT", Mahindra: "MAHINDRA LAST MILE MOBILITY", Montra: "MONTRA", Tata: "TATA MOTORS", BYD: "BYD", Vinfast: "VINFAST", Grevol: "GREVOL" };

  const handleBrandClick = (brand: string) => {
    setSelectedBrand(brand);
    router.push(catalogFilterUrl({
      brand: BRAND_MAP[brand] || brand,
      type: selectedType === "commercial" ? null : selectedType === "4 Wheeler" ? "Electric Car" : selectedType,
      comm: selectedType === "commercial" ? true : undefined,
    }));
  };

  const handleSearch = () => router.push(catalogFilterUrl({
    type: selectedType === "commercial" ? null : selectedType === "4 Wheeler" ? "Electric Car" : selectedType,
    comm: selectedType === "commercial" ? true : undefined,
    brand: selectedBrand !== "all" ? BRAND_MAP[selectedBrand] || selectedBrand : null,
    q: searchQuery || null
  }));

  return (
    <section id="home" className="relative text-zinc-900" style={{ backgroundImage: "url('/listingbackgroundsecond.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      {/* Hero (unchanged) */}
      <div className="relative min-h-[750px] sm:h-screen sm:min-h-[640px] w-full overflow-hidden">
        <Image src="/evhomepage.webp" alt="Electric Vehicle" fill priority className="object-cover" sizes="80vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none" />
        <div className="relative z-20 md:z-10 mx-auto flex min-h-[750px] sm:h-full sm:min-h-[640px] max-w-7xl flex-col items-center justify-center px-6 py-12 sm:py-0 text-center">
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Drive Electric. <span className="text-[#34ebb1]">Buy Smart.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-zinc-200 sm:text-base">Compare, filter, and enquire in seconds.</p>

          <div className="mt-8 w-full max-w-2xl rounded-3xl border border-white/15 bg-black/40 p-2 shadow-xl sm:p-5 backdrop-blur-xl relative z-20 touch-manipulation">
            <div className="flex gap-1.5 border-b border-white/10 pb-3">
              {(["2 Wheeler", "4 Wheeler", "commercial"] as const).map(tab => (
                <button key={tab} onClick={() => setSelectedType(tab)} className={`relative rounded-md px-3.5 py-1.5 text-xs font-medium transition ${selectedType === tab ? "text-zinc-900" : "text-zinc-300 hover:text-white"}`}>
                  {selectedType === tab && <motion.span layoutId="heroTab" className="absolute inset-0 -z-10 rounded-md bg-[#d1fae5] border-2 border-emerald-800 font-bold ring-1 ring-emerald-200" />}
                  {tab === "commercial" ? "Commercial" : tab}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 focus-within:border-[#34ebb1]/60 focus-within:bg-white/10">
                <Search size={16} className="text-zinc-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder={`Search ${selectedType === "4 Wheeler" ? "Tata Sierra EV" : selectedType === "commercial" ? "Euler Hiload EV" : "Rizta, Ola S1"}...`} className="h-11 w-full bg-transparent text-sm text-white placeholder:text-zinc-400 outline-none" />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search query"><X size={14} className="text-zinc-400" /></button>}
              </div>
              <button onClick={handleSearch} className="rounded-2xl bg-[#34ebb1] px-5 text-sm font-medium text-zinc-900 hover:bg-[#2bd49e] active:scale-[0.98]">Search</button>
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">Popular brands</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {POPULAR_BRANDS.map((brand) => {
                  const active = selectedBrand === brand;
                  return (
                    <button key={brand} onClick={() => handleBrandClick(brand)} className={`group flex items-center text-center justify-center gap-2.5 rounded-md border p-2.5 transition ${active ? "border-[#34ebb1]/50 bg-[#34ebb1]/15" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}`}>
                      <span className={`text-xs text-center font-medium truncate ${active ? "text-white" : "text-zinc-200"}`}>{brand}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="relative z-10 md:z-20 mx-auto mt-0 sm:-mt-16 w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.06)] bg-cover bg-center bg-no-repeat">
          <div className="relative z-10 p-6 md:p-8">
            {/* Tabs */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between">
              {/* Mobile tabs (Select Dropdown) */}
              <div className="md:hidden flex-1 max-w-[220px] relative">
                <select
                  value={activeTab === "dropdown" ? activeSubCategory : activeTab}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "trending" || val === "fresh" || val === "upcoming") {
                      setActiveTab("dropdown");
                      setActiveSubCategory(val as SubCategoryKey);
                    } else {
                      setActiveTab(val as TabKey);
                    }
                  }}
                  className="w-full rounded-md border border-zinc-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium outline-none appearance-none text-zinc-700"
                >
                  <option value="trending">⭐ Trending</option>
                  <option value="fresh">✨ New Release</option>
                  <option value="upcoming">📅 Coming Soon</option>
                  <option value="cars">🚗 Cars</option>
                  <option value="twoWheelers">🏍️ 2 Wheelers</option>
                  <option value="commercial">🚚 Commercial</option>
                </select>
                <ChevronDown size={16} className="text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Desktop tabs */}
              <div className="hidden md:flex gap-1.5 rounded-md bg-[#f0fdf9] p-1 ring-1 ring-emerald-100 relative">
                {/* Dropdown Tab Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      if (activeTab !== "dropdown") {
                        setActiveTab("dropdown");
                      } else {
                        setIsDropdownOpen(!isDropdownOpen);
                      }
                    }}
                    className={`relative flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                      activeTab === "dropdown"
                        ? "text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm ring-1 ring-emerald-700"
                        : "text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 ring-1 ring-zinc-200/50"
                    }`}
                  >
                    {activeSubCategory === "trending" && <Star size={15} className={activeTab === "dropdown" ? "text-yellow-300 fill-current" : "text-zinc-500"} />}
                    {activeSubCategory === "fresh" && <Sparkles size={15} className={activeTab === "dropdown" ? "text-teal-200" : "text-zinc-500"} />}
                    {activeSubCategory === "upcoming" && <CalendarDays size={15} className={activeTab === "dropdown" ? "text-sky-200" : "text-zinc-500"} />}
                    {activeSubCategory === "trending" ? "Trending" : activeSubCategory === "fresh" ? "New Release" : "Coming Soon"}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute left-0 mt-2 w-48 rounded-md bg-white p-1 shadow-lg ring-1 ring-zinc-200/50 z-40"
                        >
                          {subCategories.map((sub) => (
                            <button
                              key={sub.key}
                              onClick={() => {
                                setActiveSubCategory(sub.key);
                                setActiveTab("dropdown");
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left rounded-md px-3 py-2 text-sm font-medium transition flex items-center gap-2 ${
                                activeSubCategory === sub.key && activeTab === "dropdown"
                                  ? "bg-[#d1fae5] text-emerald-950 font-semibold"
                                  : "text-zinc-700 hover:bg-zinc-50"
                              }`}
                            >
                              <sub.icon size={14} className={sub.key === "trending" ? "text-amber-500 fill-current" : "text-emerald-600"} />
                              {sub.label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cars Tab Button */}
                <button
                  onClick={() => { setActiveTab("cars"); setIsDropdownOpen(false); }}
                  className={`relative flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition ${
                    activeTab === "cars" ? "text-emerald-950 font-bold bg-[#d1fae5] shadow-sm ring-1 ring-emerald-200" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <CarFront size={15} /> Cars
                </button>

                {/* 2 Wheelers Tab Button */}
                <button
                  onClick={() => { setActiveTab("twoWheelers"); setIsDropdownOpen(false); }}
                  className={`relative flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition ${
                    activeTab === "twoWheelers" ? "text-emerald-950 font-bold bg-[#d1fae5] shadow-sm ring-1 ring-emerald-200" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Bike size={15} /> 2 Wheelers
                </button>

                {/* Commercial Tab Button */}
                <button
                  onClick={() => { setActiveTab("commercial"); setIsDropdownOpen(false); }}
                  className={`relative flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition ${
                    activeTab === "commercial" ? "text-emerald-950 font-bold bg-[#d1fae5] shadow-sm ring-1 ring-emerald-200" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Truck size={15} /> Commercial
                </button>
              </div>

              <Link href={activeTab === "cars" ? catalogFilterUrl({ type: "Electric Car" }) : activeTab === "twoWheelers" ? catalogFilterUrl({ type: "2 Wheeler" }) : activeTab === "commercial" ? catalogFilterUrl({ comm: true }) : "/catalog"} className="flex items-center p-2.5 rounded-md font-bold gap-1.5 text-sm bg-[#d1fae5] text-zinc-600 hover:text-zinc-900 whitespace-nowrap shrink-0">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {/* Grid - now works on mobile too (no more horizontal scroll issues) */}
            <AnimatePresence mode="wait">
              <motion.div
                ref={scrollRef}
                onScroll={handleScroll}
                key={activeTab === "dropdown" ? `${activeTab}-${activeSubCategory}` : activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:snap-none"
              >
                {currentItems.length === 0 ? (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-center w-full">
                    <div className="rounded-full bg-[#f0fdf9] p-4 text-emerald-600 ring-4 ring-[#d1fae5]">
                      <CarFront size={28} className="animate-pulse" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-zinc-900 font-sans">No Vehicles Found</h3>
                    <p className="mt-1 text-sm text-zinc-500 max-w-xs font-sans">
                      We couldn't find any listings matching this category. Please check back later.
                    </p>
                  </div>
                ) : activeTab === "dropdown" ? (
                  (currentItems as EvListing[]).map((l, i) => <FeaturedCard key={l.id} listing={l} index={i} />)
                ) : (
                  (currentItems as Product[]).map((p, i) => <ProductCard key={p.name + i} product={p} index={i} />)
                )}
              </motion.div>
            </AnimatePresence>

            {/* Mobile Carousel Indicators */}
            {currentItems.length > 1 && (
              <div className="flex md:hidden justify-center gap-1.5 mt-2">
                {currentItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const el = scrollRef.current;
                      if (el) {
                        el.scrollTo({
                          left: i * (el.scrollWidth / currentItems.length),
                          behavior: "smooth"
                        });
                      }
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "w-5 bg-emerald-600 shadow-[0_0_8px_rgba(16,133,95,0.4)]"
                        : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}