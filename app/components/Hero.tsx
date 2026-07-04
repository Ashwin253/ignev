"use client";

import { useEffect, useMemo, useState } from "react";
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
};
type ProductsPayload = {
  electric_cars: Product[]; electric_two_wheelers: Product[]; electric_autos: Product[];
};
type TabKey = "featured" | "fresh" | "buy" | "cars" | "twoWheelers" | "autos";

const tabs: Array<{ key: TabKey; label: string; icon: typeof CarFront }> = [
  { key: "featured", label: "Newly Added", icon: Star },
  { key: "fresh", label: "New Release", icon: Sparkles },
  { key: "cars", label: "Cars", icon: CarFront },
  { key: "twoWheelers", label: "2 Wheelers", icon: Bike },
  { key: "autos", label: "Autos", icon: Truck },
];

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
      className="group relative flex h-full flex-col overflow-hidden rounded-md ring-1 ring-zinc-200/60 shadow-sm hover:shadow-md transition-all w-full"
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
      {/* Action buttons OUTSIDE Link — reliable on mobile */}
      <button
        onClick={() => { inCompare ? removeFromCompare(listing.slug) : addToCompare(listing.slug); }}
        className={`absolute bottom-3 left-3 z-20 grid h-8 w-8 place-items-center rounded-full backdrop-blur-xl transition ${inCompare ? "bg-zinc-900 text-white" : "bg-white/80 text-zinc-700 hover:bg-white"}`}
        aria-label="Compare"
      >
        <GitCompare size={14} />
      </button>

      {videoUrl && (
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-white backdrop-blur-md hover:bg-zinc-800 transition"
        >
          {isPlaying ? <ImageIcon size={14} /> : <Play size={14} className="ml-0.5 fill-current" />}
        </button>
      )}

      <Link href={href} className="relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
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
            <h3 className="mt-0.5 line-clamp-1 text-[17px] font-semibold tracking-tight text-zinc-900">{listing.title}</h3>
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
      <div className="flex gap-2 px-5 pb-5 pt-1">
        <span className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-zinc-100 py-2.5 text-xs font-medium text-zinc-700 group-hover:bg-zinc-200 transition">Details <ArrowUpRight size={12} /></span>
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
      {/* Action buttons OUTSIDE Link — reliable on mobile */}
      <button
        onClick={() => { inCompare ? removeFromCompare(slug) : addToCompare(slug); }}
        className={`absolute bottom-3 left-3 z-20 grid h-8 w-8 place-items-center rounded-full backdrop-blur-xl transition ${inCompare ? "bg-zinc-900 text-white" : "bg-white/80 text-zinc-700 hover:bg-white"}`}
        aria-label="Compare"
      >
        <GitCompare size={14} />
      </button>

      {videoUrl && (
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-white backdrop-blur-md hover:bg-zinc-800 transition"
        >
          {isPlaying ? <ImageIcon size={14} /> : <Play size={14} className="ml-0.5 fill-current" />}
        </button>
      )}

      <Link href={href} className="relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
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
            <h3 className="mt-0.5 line-clamp-1 text-[17px] font-semibold tracking-tight text-zinc-900">{product.name}</h3>
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
      <div className="flex gap-2 px-5 pb-5 pt-1">
        <span className="flex-1 rounded-xl bg-zinc-100 py-2.5 text-center text-xs font-medium text-zinc-700 group-hover:bg-zinc-200 transition">Details</span>
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
  featured = [],
  freshReleases = [],
}: {
  products: ProductsPayload;
  featured?: EvListing[];
  freshReleases?: EvListing[];
  banners?: HeroBanner[];
}) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"2 Wheeler" | "3 Wheeler" | "commercial">("2 Wheeler");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [activeTab, setActiveTab] = useState<TabKey>(featured.length ? "featured" : "cars");

  const POPULAR_BRANDS = ["Ather", "TVS", "Bajaj", "Euler"];
  const visibleTabs = useMemo(() => tabs.filter(t => (t.key !== "featured" || featured.length) && (t.key !== "fresh" || freshReleases.length)), [featured.length, freshReleases.length]);

  const catalogProducts = useMemo(() => {
    if (activeTab === "cars") {
      const excluded = ["auto", "autos", "tempo", "tempos", "rickshaw", "3 wheeler", "commercial"];
      const normalized = (s: string) => s?.toLowerCase().trim() || "";
      const validCars = products.electric_cars.filter(p => {
        const t = normalized(p.type);
        return !excluded.some(ex => t === ex || t.startsWith(ex + " ") || t.endsWith(" " + ex));
      });
      const allowed = ["suv", "hatchback", "compact suv", "sedan"];
      const filtered = validCars.filter(p => allowed.includes(p.type?.toLowerCase().trim() || ""));
      return (filtered.length ? filtered : validCars).slice(0, 4);
    }
    if (activeTab === "twoWheelers") return products.electric_two_wheelers.slice(0, 4);
    if (activeTab === "autos") return products.electric_autos.slice(0, 4);
    return [...products.electric_cars.slice(0, 2), ...products.electric_two_wheelers.slice(0, 2)];
  }, [activeTab, products]);

  const BRAND_MAP: Record<string, string> = { Ather: "ATHER", Euler: "EULER MOTORS", TVS: "TVS", Bajaj: "BAJAJ", Ola: "OLA", Vida: "VIDA", Revolt: "REVOLT", Mahindra: "MAHINDRA LAST MILE MOBILITY", Montra: "MONTRA", Tata: "TATA MOTORS" };

  const handleBrandClick = (brand: string) => {
    setSelectedBrand(brand);
    router.push(catalogFilterUrl({ brand: BRAND_MAP[brand] || brand }));
  };

  const handleSearch = () => router.push(catalogFilterUrl({
    type: selectedType === "commercial" ? null : selectedType,
    comm: selectedType === "commercial" ? true : undefined,
    brand: selectedBrand !== "all" ? BRAND_MAP[selectedBrand] || selectedBrand : null,
    q: searchQuery || null
  }));

  return (
    <section id="home" className="relative text-zinc-900" style={{ backgroundImage: "url('/listingbackgroundsecond.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      {/* Hero (unchanged) */}
      <div className="relative min-h-[750px] sm:h-screen sm:min-h-[640px] w-full overflow-hidden">
        <Image src="/customhero.jpg" alt="Electric Vehicle" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none" />
        <div className="relative z-20 md:z-10 mx-auto flex min-h-[750px] sm:h-full sm:min-h-[640px] max-w-7xl flex-col items-center justify-center px-6 py-12 sm:py-0 text-center">
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Drive Electric. <span className="text-[#34ebb1]">Buy Smart.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-zinc-200 sm:text-base">Compare, filter, and enquire in seconds.</p>

          <div className="mt-8 w-full max-w-2xl rounded-3xl border border-white/15 bg-black/40 p-2 shadow-xl sm:p-5 backdrop-blur-xl relative z-20 touch-manipulation">
            <div className="flex gap-1.5 border-b border-white/10 pb-3">
              {(["2 Wheeler", "3 Wheeler", "commercial"] as const).map(tab => (
                <button key={tab} onClick={() => setSelectedType(tab)} className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition ${selectedType === tab ? "text-zinc-900" : "text-zinc-300 hover:text-white"}`}>
                  {selectedType === tab && <motion.span layoutId="heroTab" className="absolute inset-0 -z-10 rounded-full bg-[#d1fae5] border-2 border-emerald-800 font-bold ring-1 ring-emerald-200" />}
                  {tab === "commercial" ? "Commercial" : tab}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 focus-within:border-[#34ebb1]/60 focus-within:bg-white/10">
                <Search size={16} className="text-zinc-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Search Rizta, S1, Nexon EV..." className="h-11 w-full bg-transparent text-sm text-white placeholder:text-zinc-400 outline-none" />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")}><X size={14} className="text-zinc-400" /></button>}
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
              <div className="md:hidden flex-1 max-w-[220px] relative">
                <select value={activeTab} onChange={e => setActiveTab(e.target.value as TabKey)} className="w-full rounded-md border border-zinc-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium outline-none appearance-none">
                  {visibleTabs.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <ChevronDown size={16} className="text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Desktop tabs */}
              <div className="hidden md:flex gap-1.5 rounded-md bg-[#f0fdf9] p-1 ring-1 ring-emerald-100">
                {visibleTabs.map(tab => {
                  const active = tab.key === activeTab;
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition ${active ? "text-white font-bold bg-emerald-600" : "text-zinc-600 hover:text-zinc-900"}`}>
                      {active && <motion.span layoutId="tabPill" className="absolute inset-0 -z-10 rounded-md bg-[#d1fae5] shadow-sm ring-1 ring-emerald-200" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                      <tab.icon size={15} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              <Link href={activeTab === "cars" ? catalogFilterUrl({ type: "Electric Car" }) : activeTab === "twoWheelers" ? catalogFilterUrl({ type: "2 Wheeler" }) : activeTab === "autos" ? catalogFilterUrl({ type: "3 Wheeler" }) : "/catalog"} className="flex items-center p-2.5 rounded-md font-bold gap-1.5 text-sm bg-[#d1fae5] text-zinc-600 hover:text-zinc-900 whitespace-nowrap shrink-0">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {/* Grid - now works on mobile too (no more horizontal scroll issues) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 grid grid-cols-2 gap-4 pb-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              >
                {activeTab === "featured" ? featured.map((l, i) => <FeaturedCard key={l.id} listing={l} index={i} />)
                  : activeTab === "fresh" ? freshReleases.map((l, i) => <FeaturedCard key={l.id} listing={l} index={i} />)
                  : catalogProducts.map((p, i) => <ProductCard key={p.name + i} product={p} index={i} />)
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}