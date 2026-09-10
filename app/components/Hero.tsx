"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import type { EvListing, HeroBanner } from "../lib/wordpress";
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

export default function Hero({
  products,
  listings = [],
  freshReleases = [],
  upcoming = [],
  banners = [],
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

  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  const activeBanners = useMemo(() => {
    return banners ?? [];
  }, [banners]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners]);

  const POPULAR_BRANDS = useMemo(() => {
    if (selectedType === "4 Wheeler") return ["Tata", "Mahindra", "BYD", "Vinfast"];
    if (selectedType === "commercial") return ["Euler", "Bajaj", "TVS", "Grevol"];
    return ["Ather", "TVS", "Bajaj", "Euler"];
  }, [selectedType]);

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
    <section 
      id="home" 
      className="relative text-zinc-900 transition-all duration-1000" 
      style={
        activeBanners[currentBannerIdx]?.background_color
          ? { backgroundColor: activeBanners[currentBannerIdx].background_color }
          : { backgroundImage: "url('/listingbackgroundsecond.jpg')", backgroundSize: "cover", backgroundPosition: "center" }
      }
    >
      {/* Hero */}
      <div className="relative min-h-[100svh] w-full overflow-hidden">
        {/* Animated Banner Slider connected to Supabase */}
        <AnimatePresence mode="wait">
          {activeBanners.length > 0 ? (
            <motion.div
              key={currentBannerIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
              style={{ backgroundColor: activeBanners[currentBannerIdx]?.background_color || 'transparent' }}
            >
              {activeBanners[currentBannerIdx].video_url ? (
                (() => {
                  const vUrl = activeBanners[currentBannerIdx].video_url || "";
                  const ytMatch = vUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                  const ytId = ytMatch ? ytMatch[1] : null;
                  if (ytId) {
                    return (
                      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1`}
                          title={activeBanners[currentBannerIdx].cta || "Hero Video"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] object-cover border-0"
                        />
                      </div>
                    );
                  }
                  return (
                    <video
                      src={vUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  );
                })()
              ) : (
                <>
                  {(activeBanners[currentBannerIdx].image_vertical || activeBanners[currentBannerIdx].imageVertical) && (
                    <Image
                      src={activeBanners[currentBannerIdx].image_vertical || activeBanners[currentBannerIdx].imageVertical}
                      alt={activeBanners[currentBannerIdx].cta || "Banner Vertical"}
                      fill
                      priority={currentBannerIdx === 0}
                      className="object-cover sm:hidden"
                      sizes="(max-width: 640px) 100vw"
                    />
                  )}
                  {(activeBanners[currentBannerIdx].image_horizontal || activeBanners[currentBannerIdx].imageHorizontal) && (
                    <Image
                      src={activeBanners[currentBannerIdx].image_horizontal || activeBanners[currentBannerIdx].imageHorizontal}
                      alt={activeBanners[currentBannerIdx].cta || "Banner Horizontal"}
                      fill
                      priority={currentBannerIdx === 0}
                      className={`object-cover ${(activeBanners[currentBannerIdx].image_vertical || activeBanners[currentBannerIdx].imageVertical) ? "hidden sm:block" : ""}`}
                      sizes="100vw"
                    />
                  )}
                  {/* Fallback: no images at all — show gradient placeholder */}
                  {!(activeBanners[currentBannerIdx].image_horizontal || activeBanners[currentBannerIdx].imageHorizontal || activeBanners[currentBannerIdx].image_vertical || activeBanners[currentBannerIdx].imageVertical) && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-slate-900" />
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <Image src="/evhomepage.webp" alt="Electric Vehicle" fill priority className="object-cover" sizes="80vw" />
          )}
        </AnimatePresence>

        <div className="relative z-20 md:z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-between px-4 sm:px-6 pt-20 pb-6 sm:pt-28 sm:pb-10 text-center">
          
          {/* Top Heading */}
          <div className="mt-8 sm:mt-12">
            {/* <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Drive Electric. <span className="text-[#34ebb1]">Buy Smart.</span>
            </h1>
            <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-200 sm:text-base">Compare, filter, and enquire in seconds.</p> */}
          </div>

          {/* Bottom Search & Popular Brands panel */}
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-black/40 p-2 shadow-xl sm:p-5 backdrop-blur-xl relative z-20 touch-manipulation mb-2 sm:mb-4">
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
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="mb-2 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">Popular brands</p>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
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
    </section>
  );
}