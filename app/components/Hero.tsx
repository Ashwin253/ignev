"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CarFront, Bike, Truck, Sparkles, Send,
  ChevronLeft, ChevronRight, Star, BatteryCharging,
  MapPin, CalendarDays, BadgeCheck, CheckCircle2, Gauge, Info,
  ChevronDown, ArrowUpRight, GitCompare, X, Search,
} from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";
import { useCompare } from "../context/CompareContext";
import type { EvListing, HeroBanner } from "../lib/wordpress";
import { formatLaunchDate, isLaunched, formatPricing } from "../lib/wordpress";
import { catalogFilterUrl } from "../lib/catalog-filters";

type Product = {
  name: string; brand: string; type: string; pricing: string; photo: string; slug?: string;
};
type ProductsPayload = {
  electric_cars: Product[]; electric_two_wheelers: Product[]; electric_autos: Product[];
};
type TabKey = "featured" | "fresh" | "buy" | "cars" | "twoWheelers" | "autos";

const tabs: Array<{ key: TabKey; label: string; icon: typeof CarFront }> = [
  { key: "featured",    label: "Newly Added",   icon: Star      },
  { key: "fresh",       label: "New Release", icon: Sparkles  },
  { key: "cars",        label: "Cars",          icon: CarFront  },
  { key: "twoWheelers", label: "2 Wheelers",    icon: Bike      },
  { key: "autos",       label: "Autos",         icon: Truck     },
];

const heroSlides: Partial<HeroBanner>[] = [
  { cta: "Explore catalog",   href: "/catalog", details: "", imageHorizontal: "/herobanner/banner-1-horizontal.webp", imageVertical: "/herobanner/banner-1-vertical.webp" },
  { cta: "View two-wheelers", href: "/catalog", details: "", imageHorizontal: "/herobanner/banner-2-horizontal.jpg",  imageVertical: "/herobanner/banner-2-vertical.jpg"  },
  { cta: "Enquire now",       href: "/catalog", details: "", imageHorizontal: "/herobanner/banner-3-horizontal.jpg",  imageVertical: "/herobanner/banner-3-vertical.jpg"  },
];

function toSlug(brand: string, name: string) {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ── Featured card ─────────────────────────────────────────────────────────────

function FeaturedCard({ listing, index }: { listing: EvListing; index: number }) {
  const launched = isLaunched(listing.launchdate);
  const launchLabel = formatLaunchDate(listing.launchdate);
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="group w-[82vw] max-w-sm shrink-0 snap-start md:w-auto md:max-w-none md:shrink md:snap-none overflow-hidden rounded-[1.75rem] border border-slate-200  shadow-[0_12px_32px_rgba(15,23,42,0.06)] flex flex-col"
    >
      <Link href={`/product/${listing.slug}`} className="flex flex-col flex-1">
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          {listing.photo ? (
            <Image src={listing.photo} alt={listing.title} fill sizes="(max-width: 768px) 82vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-sky-50 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/30 via-transparent to-transparent" />
          <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${launched ? "text-slate-900" : "bg-amber-400 text-slate-900"}`} style={launched ? { backgroundColor: "#34ebb1" } : {}}>
            {launched ? <><BadgeCheck size={11} /> {launchLabel}</> : <><CalendarDays size={11} /> {launchLabel}</>}
          </span>

          {/* Compare Toggle */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isInCompare(listing.slug) ? removeFromCompare(listing.slug) : addToCompare(listing.slug);
            }}
            className={`absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 ${
              isInCompare(listing.slug)
                ? "bg-sky-600 text-white shadow-lg"
                : "bg-white/70 text-slate-600 hover:bg-white"
            }`}
          >
            <GitCompare size={14} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-5 gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 truncate">{listing.brand}</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900 line-clamp-1">{listing.title}</h2>
            </div>
            {listing.types[0] && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{listing.types[0]}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {listing.prices.length > 0 && <span className="font-semibold text-slate-800">{formatPricing(listing.prices)}</span>}
            
            {listing.topSpeed !== null && (
              <span className="inline-flex items-center gap-1">
                <Gauge size={11} className="text-amber-500" />
                {listing.topSpeed} km/h
              </span>
            )}
          </div>

          {listing.commercial && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
              <Truck size={10} /> Commercial
            </span>
          )}

          {/* {listing.pros[0] && (
            <p className="flex items-start gap-1.5 text-xs text-slate-600 line-clamp-2">
              <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />{listing.pros[0]}
            </p>
          )} */}

          <div className="mt-auto pt-1 flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-[11px] font-bold transition-colors">
              Details <ArrowUpRight size={11} />
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerEnquiryModal(`${listing.brand} ${listing.title}`); }}
              className="flex-1 bg-slate-900 hover:bg-sky-600 text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 group/btn"
            >
              Enquire <Send size={11} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ── Standard product card ─────────────────────────────────────────────────────

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="group flex h-full w-[82vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.06)] md:w-auto md:max-w-none md:shrink md:snap-none flex-col"
    >
      <Link href={`/product/${product.slug ?? toSlug(product.brand, product.name)}`} className="flex flex-col flex-1">
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          {product.photo ? (
            <Image src={product.photo} alt={product.name} fill sizes="(max-width: 768px) 82vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/30 via-transparent to-transparent" />

          {/* Compare Toggle */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const slug = product.slug ?? toSlug(product.brand, product.name);
              isInCompare(slug) ? removeFromCompare(slug) : addToCompare(slug);
            }}
            className={`absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 ${
              isInCompare(product.slug ?? toSlug(product.brand, product.name))
                ? "bg-sky-600 text-white shadow-lg"
                : "bg-white/70 text-slate-600 hover:bg-white"
            }`}
          >
            <GitCompare size={14} />
          </button>
        </div>
        <div className="flex flex-1 flex-col space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{product.brand}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 line-clamp-1">{product.name}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600 shrink-0">{product.type}</span>
          </div>
          <p className="text-sm font-medium text-slate-600">{product.pricing}</p>
          <div className="mt-auto pt-2 flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-[11px] font-bold transition-colors">
              Details <ArrowUpRight size={11} />
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerEnquiryModal(`${product.brand} ${product.name}`); }}
              className="flex-1 bg-slate-900 hover:bg-sky-600 text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 group/btn"
            >
              Enquire <Send size={11} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

export default function Hero({
  products,
  featured = [],
  freshReleases = [],
  banners = [],
}: {
  products: ProductsPayload;
  featured?: EvListing[];
  freshReleases?: EvListing[];
  banners?: HeroBanner[];
}) {
  const router = useRouter();

  // Search widget state
  const [selectedType, setSelectedType] = useState<"2 Wheeler" | "3 Wheeler" | "commercial">("2 Wheeler");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const [activeTab, setActiveTab] = useState<TabKey>(featured.length ? "featured" : "buy");
  const railRef = useRef<HTMLDivElement | null>(null);

  const visibleTabs = useMemo(() => {
    let t = tabs;
    if (!featured.length) t = t.filter((tab) => tab.key !== "featured");
    if (!freshReleases.length) t = t.filter((tab) => tab.key !== "fresh");
    return t;
  }, [featured.length, freshReleases.length]);
  const activeTabMeta = visibleTabs.find((t) => t.key === activeTab) ?? visibleTabs[0];

  const catalogProducts = useMemo(() => {
    if (activeTab === "cars")        return products.electric_cars;
    if (activeTab === "twoWheelers") return products.electric_two_wheelers.slice(0, 4);
    if (activeTab === "autos")       return products.electric_autos;
    return [
      ...products.electric_cars.slice(0, 2),
      ...products.electric_two_wheelers.slice(0, 2),
      ...products.electric_autos.slice(0, 1),
    ];
  }, [activeTab, products]);

  useEffect(() => {
    railRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [activeTab]);

  const BRAND_MAP: Record<string, string> = {
    "Ather": "ATHER",
    "Euler": "EULER MOTORS",
    "TVS": "TVS",
    "Bajaj": "BAJAJ",
    "Ola": "OLA",
    "Vida": "VIDA",
    "Revolt": "REVOLT",
    "Mahindra": "MAHINDRA LAST MILE MOBILITY",
    "Montra": "MONTRA",
    "Tata": "TATA MOTORS",
  };

  const POPULAR_BRANDS = ["Ather", "Euler", "TVS", "Bajaj", "Ola", "Vida", "Revolt", "Mahindra", "Montra", "Tata"];

  const handleSearch = () => {
    const mappedBrand = selectedBrand !== "all" ? (BRAND_MAP[selectedBrand] || selectedBrand) : null;
    const url = catalogFilterUrl({
      type: selectedType === "commercial" ? null : selectedType,
      comm: selectedType === "commercial" ? true : undefined,
      brand: mappedBrand,
      q: searchQuery || null,
    });
    router.push(url);
  };

  const handleBrandSearch = (brandName: string) => {
    setSelectedBrand(brandName);
    const mappedBrand = brandName !== "all" ? (BRAND_MAP[brandName] || brandName) : null;
    const url = catalogFilterUrl({
      brand: mappedBrand,
    });
    router.push(url);
  };

  return (
    <section id="home" className="relative overflow-hidden bg-[#f8f5f0] pt-28 pb-16 text-slate-900">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#34ebb1]/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[#34ebb1]/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-visible bg-transparent border-none shadow-none">

          {/* ── Hero Image (Full Width & Height, Not Fixed) ── */}
          <div className="relative w-full min-h-[640px] md:h-[80vh] overflow-hidden rounded-4xl border border-slate-200 shadow-[0_18px_80px_rgba(15,23,42,0.08)] bg-slate-900 mb-6 flex items-center justify-center">
            <Image
              src="/customhero.jpg"
              alt="Electric Vehicle Hero"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            {/* Elegant overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-transparent" />

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-12 text-center z-10">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#34ebb1]/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#34ebb1] border border-[#34ebb1]/30 w-fit">
                <Sparkles size={12} className="text-[#34ebb1]" /> The Future is Electric
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Drive Electric. <span className="text-[#34ebb1]">Buy Smart.</span>
              </h1>
              <p className="mt-3 text-xs sm:text-sm md:text-base text-slate-350 font-medium max-w-xl">
                Explore India&apos;s leading marketplace for 2-wheelers, 3-wheelers, and commercial Electric Vehicles.
              </p>

              {/* Housing.com style Search Box */}
              <div className="mt-8 w-full max-w-2xl bg-white/60 backdrop-blur-2xl rounded-3xl p-5 md:p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)] shadow-slate-950/20 text-slate-900 border border-white/60">
                {/* Upper Tabs */}
                <div className="flex gap-2 border-b border-slate-900/10 pb-3 mb-4 justify-start">
                  {(["2 Wheeler", "3 Wheeler", "commercial"] as const).map((tab) => {
                    const isActive = selectedType === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setSelectedType(tab);
                          setSelectedBrand("all"); // Reset brand when changing type
                        }}
                        className={`relative px-4 py-2 text-xs md:text-sm font-extrabold transition-all rounded-xl cursor-pointer ${
                          isActive
                            ? "text-slate-950 font-black"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeHeroTab"
                            className="absolute inset-0 bg-[#34ebb1] rounded-xl -z-10 shadow-md shadow-[#34ebb1]/25"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        {tab === "2 Wheeler" && "2-Wheeler"}
                        {tab === "3 Wheeler" && "3-Wheeler"}
                        {tab === "commercial" && "Commercial"}
                      </button>
                    );
                  })}
                </div>

                {/* Main Search Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-3 rounded-2xl border border-white/50 bg-white/80 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all shadow-inner">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={
                        selectedType === "2 Wheeler"
                          ? "Search scooters, motorcycles (e.g. Rizta, S1, Activa)..."
                          : selectedType === "3 Wheeler"
                          ? "Search passenger or cargo autos (e.g. Treo, Stream)..."
                          : "Search commercial loaders, cargo autos..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-sm md:text-base outline-none text-slate-800 placeholder:text-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    className="bg-[#10855f] hover:bg-[#0b6447] text-white font-bold px-8 py-3.5 rounded-2xl text-sm md:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Search <ArrowRight size={16} />
                  </button>
                </div>

                {/* Bottom Tab (Brands) */}
                <div className="mt-4 pt-3 border-t border-slate-900/10 flex flex-col sm:flex-row sm:items-center gap-3 text-left">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">Popular Brands:</span>
                  <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                    <button
                      onClick={() => handleBrandSearch("all")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        selectedBrand === "all"
                          ? "bg-[#10855f] border-[#10855f] text-white shadow-sm"
                          : "bg-white/80 border-white/50 text-slate-600 hover:text-slate-850 hover:bg-white hover:border-slate-350"
                      }`}
                    >
                      All Brands
                    </button>
                    {POPULAR_BRANDS.map((brandName) => {
                      const isActive = selectedBrand === brandName;
                      return (
                        <button
                          key={brandName}
                          onClick={() => handleBrandSearch(isActive ? "all" : brandName)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            isActive
                              ? "bg-slate-900 border-slate-900 text-[#34ebb1] shadow-sm"
                              : "bg-white/80 border-white/50 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-350"
                          }`}
                        >
                          {brandName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tab bar + Card rail — unified panel ── */}
          <div className="relative mt-10 z-20">
            <div className="mx-4 sm:mx-6 md:mx-8 bg-transparent border-none shadow-none overflow-visible">

              {/* Tab bar */}
              <div className="px-4 py-3 border border-slate-250/70 bg-white rounded-3xl shadow-sm mb-4">
                {/* Mobile: native select dropdown */}
                <div className="md:hidden">
                  <label className="relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 cursor-pointer">
                    <activeTabMeta.icon size={17} className="text-sky-600 shrink-0" />
                    <span className="flex-1 text-sm font-semibold text-slate-800">{activeTabMeta.label}</span>
                    <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as TabKey)}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      aria-label="Browse category"
                    >
                      {visibleTabs.map((tab) => (
                        <option key={tab.key} value={tab.key}>{tab.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Desktop: pill chips */}
                <div className="hidden md:flex gap-2">
                  {visibleTabs.map((tab) => {
                    const isActive = tab.key === activeTab;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? tab.key === "featured"
                              ? "border-[#34ebb1] bg-[#34ebb1] text-slate-900 shadow-[0_4px_16px_rgba(52,235,177,0.4)]"
                              : tab.key === "fresh"
                              ? "border-[#34ebb1] bg-[#34ebb1] text-slate-900 shadow-[0_4px_16px_rgba(52,235,177,0.4)]"
                              : "border-sky-300 bg-sky-600 text-white shadow-[0_4px_16px_rgba(2,132,199,0.25)]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card rail */}
              <AnimatePresence mode="wait">
                <motion.div
                  ref={railRef}
                  key={activeTab}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-4 pb-4 sm:px-5 md:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:overflow-visible md:grid-cols-2 xl:grid-cols-4"
                >
                  {activeTab === "featured"
                    ? featured.map((listing, i) => <FeaturedCard key={listing.id} listing={listing} index={i} />)
                    : activeTab === "fresh"
                    ? freshReleases.map((listing, i) => <FeaturedCard key={listing.id} listing={listing} index={i} />)
                    : catalogProducts.map((product, i) => <ProductCard key={`${activeTab}-${product.name}-${i}`} product={product} index={i} />)
                  }
                </motion.div>
              </AnimatePresence>

              {/* View all */}
              <div className="flex justify-end px-4 pb-4 sm:px-5 md:px-6 pt-3">
                <Link href="/catalog" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                  View all listings <ArrowRight size={15} />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
