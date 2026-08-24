"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import type { WPUpdate, EvListing, HeroBanner } from "../lib/wordpress";
import { isLaunched } from "../lib/wordpress";
import { getVehiclePhoto } from "../lib/vehicle-images";

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
      className={`py-10 sm:py-12 px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto my-8 rounded-3xl border transition-all ${
        isUpcoming
          ? "bg-[#FFF9EE] dark:bg-[#151006]/90 border-amber-200/80 dark:border-amber-900/40 shadow-[0_10px_30px_rgba(217,119,6,0.06)]"
          : "bg-[#EDF5EB] dark:bg-[#071E15]/90 border-[#CDE0C9] dark:border-emerald-900/40 shadow-[0_10px_30px_rgba(10,42,30,0.06)]"
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-center">
        {/* Left Column (~30% width on desktop): Section Header & Scroll Buttons */}
        <div className="lg:col-span-2 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${
                isUpcoming
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : "bg-[#1F7A4D]/10 text-[#1F7A4D] dark:text-[#8FE24A] border-[#1F7A4D]/30 dark:border-[#8FE24A]/30"
              }`}
            >
              {/* {isUpcoming ? (
                <>
                  <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Coming Soon
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A] animate-pulse" />
                  Fresh On Road
                </>
              )} */}
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2A1E] dark:text-white tracking-tight">
              {isUpcoming ? "Upcoming Vehicles" : "New Releases"}
            </h2>

          </div>

          <div className="flex flex-row lg:flex-col items-start justify-between gap-4 pt-2">
            <Link
              href={isUpcoming ? "/upcoming" : "/catalog"}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs group ${
                isUpcoming
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                  : "bg-[#1F7A4D] hover:bg-[#289660] text-white shadow-emerald-900/20"
              }`}
            >
              <span>{isUpcoming ? "View All Upcoming" : "View All Launches"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Navigation Arrow Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed shadow-xs active:scale-95 ${
                  isUpcoming
                    ? "bg-white dark:bg-[#201809] border-amber-200 dark:border-amber-800/40 text-slate-800 dark:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-900/40"
                    : "bg-white dark:bg-[#0B2117] border-[#D0E2CC] dark:border-emerald-800/40 text-[#0A2A1E] dark:text-emerald-100 hover:bg-[#E2EEE0] dark:hover:bg-emerald-900/40"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed shadow-xs active:scale-95 ${
                  isUpcoming
                    ? "bg-white dark:bg-[#201809] border-amber-200 dark:border-amber-800/40 text-slate-800 dark:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-900/40"
                    : "bg-white dark:bg-[#0B2117] border-[#D0E2CC] dark:border-emerald-800/40 text-[#0A2A1E] dark:text-emerald-100 hover:bg-[#E2EEE0] dark:hover:bg-emerald-900/40"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (~70% width on desktop): Scrollable Slider */}
        <div className="lg:col-span-7 overflow-hidden">
          <div
            ref={rowRef}
            className="overflow-x-auto pb-2 -mx-5 px-5 lg:mx-0 lg:px-0 scrollbar-hide scroll-smooth flex gap-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {items.map((l, i) => {
              const pricing = l.prices?.length ? (
                parseFloat(String(l.prices[0])) > 100
                  ? `₹${(parseFloat(String(l.prices[0])) / 100000).toFixed(2)}L`
                  : `₹${l.prices[0]}L`
              ) : (l as any).price_bracket || "";
              const range = l.batteryVariants?.[0]?.range || "";
              return (
                <Link
                  key={l.slug || i}
                  href={`/product/${l.slug}`}
                  className={`group flex-shrink-0 w-[240px] sm:w-[260px] rounded-2xl border overflow-hidden transition-all flex flex-col justify-between shadow-xs hover:shadow-xl ${
                    isUpcoming
                      ? "bg-white dark:bg-[#1C1608] border-amber-200/80 dark:border-amber-900/40 hover:border-amber-500 dark:hover:border-amber-400"
                      : "bg-white dark:bg-[#082218] border-[#D0E2CC] dark:border-emerald-900/40 hover:border-[#1F7A4D] dark:hover:border-[#8FE24A]"
                  }`}
                >
                  <div
                    className={`relative h-36 sm:h-40 overflow-hidden ${
                      isUpcoming ? "bg-[#FDF6E2] dark:bg-amber-950/40" : "bg-[#F0F7EE] dark:bg-emerald-950/50"
                    }`}
                  >
                    <Image
                      src={getVehiclePhoto(l.photo, l)}
                      alt={l.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="260px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    {isUpcoming ? (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950 shadow-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Upcoming
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#1F7A4D] text-[10px] font-bold text-white shadow-xs">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isUpcoming ? "text-amber-600 dark:text-amber-400/80" : "text-[#1F7A4D] dark:text-emerald-400/80"
                        }`}
                      >
                        {l.brand}
                      </p>
                      <h3 className="text-sm font-bold text-[#0A2A1E] dark:text-white mt-0.5 line-clamp-1 group-hover:underline">
                        {l.title}
                      </h3>
                    </div>
                    <div
                      className={`flex items-center justify-between mt-3 pt-2 border-t ${
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EcosystemSection({ updates = [], listings = [], banners = [] }: EcosystemSectionProps) {
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
      className="w-full bg-[#F6F8F2] pt-8 dark:bg-[#07130E] text-[#0E1F16] dark:text-slate-100 font-sans overflow-hidden transition-colors duration-1000 relative z-0"
    >
      {/* 1. HERO / ECOSYSTEM BANNER */}
      <section
        className="relative mx-auto mb-8 max-w-7xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/50 px-4 py-10 shadow-[0_20px_60px_rgba(10,42,30,0.08)] backdrop-blur-sm sm:px-6 sm:py-12 lg:px-8 lg:py-16"
        style={
          activeBanners[currentBannerIdx]?.background_color
            ? { backgroundColor: activeBanners[currentBannerIdx].background_color }
            : undefined
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-5 space-y-6">
            
            <h1 
              className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] transition-colors duration-1000 ${
                !activeBanners[currentBannerIdx]?.text_color && !activeBanners[currentBannerIdx]?.background_color
                  ? 'text-[#0A2A1E] dark:text-white'
                  : ''
              }`}
              style={{
                color: activeBanners[currentBannerIdx]?.text_color || (activeBanners[currentBannerIdx]?.background_color ? '#ffffff' : undefined)
              }}
            >
              India's <span className="text-[#1F7A4D] dark:text-[#8FE24A]">Trusted</span> Electric Mobility Platform.
            </h1>

            {/* <p className="text-base sm:text-lg text-[#3C5347] dark:text-emerald-100/70 max-w-2xl leading-relaxed">
              Compare EVs, discover charging solutions, explore commercial fleets, find genuine parts, and make confident electric mobility decisions — all in one place.
            </p> */}

            {/* <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                "Honest comparisons",
                // "Expert reviews",
                "Verified specifications",
                "Commercial & passenger EVs",
                "Parts & charging ecosystem"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#0A2A1E] dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-[#1F7A4D] dark:text-[#8FE24A] shrink-0" />
                  {item}
                </li>
              ))}
            </ul> */}

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#0A2A1E] hover:bg-[#1B6642] text-white dark:bg-[#8FE24A] dark:hover:bg-[#a0f05d] dark:text-[#07130E] font-bold px-6 py-3.5 rounded-full text-sm transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#0A2A1E]/10 dark:shadow-[#8FE24A]/20"
              >
                Explore listings
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Hero Right Panel: Supabase Banner directly on background */}
          <div className="lg:col-span-7">
            <div className="relative w-full h-[450px] flex flex-col justify-end overflow-hidden">
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
              <div className="relative z-10 p-4 sm:p-6 flex flex-col justify-end">
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
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: CTA with Arrow + 'i' Info Button */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={activeBanners[currentBannerIdx].href || "/catalog"}
                          className="inline-flex items-center gap-2 bg-[#8FE24A] hover:bg-[#a0f05d] text-[#07130E] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all transform hover:scale-105 shadow-lg shadow-[#8FE24A]/20 group"
                        >
                          <span>{activeBanners[currentBannerIdx].cta || "Explore Now"}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
{/* <section>
        <div className="mt-16 pt-8 border-t border-[#D8E3D3] dark:border-emerald-900/40">
          <div className="flex flex-col md:flex-row items-center gap-6 text-xs text-[#6C8377] dark:text-emerald-200/60 font-mono">
            <span className="uppercase tracking-widest text-[#1F7A4D] dark:text-emerald-400 shrink-0 font-bold">Popular Brands</span>
            <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-sm font-sans font-semibold text-[#0E1F16] dark:text-slate-300/80">
              <span>Tata Motors</span>
              <span>Ola Electric</span>
              <span>Ather Energy</span>
              <span>Mahindra Last Mile</span>
              <span>Bajaj Auto</span>
              <span>TVS Motor</span>
              <span>Hero Vida</span>
            </div>
          </div>
        </div>
      </section> */}

      {/* 2. STATS SECTION */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D8E3D3] dark:border-emerald-900/30">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { count: 100, label: "Vehicle models compared", width: "88%" },
            { count: 50, label: "Brands on platform", width: "75%" },
            { count: 25, label: "Cities covered nationwide", width: "65%" },
            { count: 500, label: "Verified charging points", width: "95%" }
          ].map((st, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-[#0B2117] border border-[#D8E3D3] dark:border-emerald-800/30 hover:border-[#2C9A5F] dark:hover:border-emerald-500/40 shadow-xs dark:shadow-none transition-all">
              <div className="text-3xl sm:text-4xl font-bold text-[#0A2A1E] dark:text-white font-mono">
                {countProgress > 0 ? `${st.count}+` : "0+"}
              </div>
              <div className="text-xs sm:text-sm text-[#3C5347] dark:text-emerald-200/70 mt-2 font-medium">{st.label}</div>
              <div className="h-1.5 w-full bg-[#EBF1E5] dark:bg-emerald-950 rounded-full mt-4 overflow-hidden">
                {/* <div
                  className="h-full bg-gradient-to-r from-[#1F7A4D] to-[#2C9A5F] dark:from-emerald-500 dark:to-[#8FE24A] transition-all duration-1000 ease-out"
                  style={{ width: countProgress > 0 ? st.width : "0%" }}
                /> */}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. EXPLORE GRID */}
      <section id="explore" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10 max-w-2xl">
          <div className="text-xs font-mono text-[#1F7A4D] dark:text-[#8FE24A] tracking-wider uppercase mb-2">Why We Exist</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2A1E] dark:text-white tracking-tight">
            Buying or running an EV shouldn't take ten open tabs.
          </h2>
          <p className="text-[#3C5347] dark:text-slate-300/70 mt-3 text-sm sm:text-base">
            EVPLSE brings India's electric mobility ecosystem together — so every buyer, business and operator can make one informed decision.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Passenger EVs",
              desc: "Cars for every budget & range",
              icon: Car,
              href: "/catalog?type=Electric+Car"
            },
            {
              title: "Commercial EVs",
              desc: "Vans, trucks & goods carriers",
              icon: Truck,
              href: "/catalog?comm=true"
            },
            {
              title: "Scooters",
              desc: "Daily commute reimagined",
              icon: Bike,
              href: "/catalog?type=2+Wheeler"
            },
            {
              title: "Three Wheelers",
              desc: "Passenger & cargo autos",
              icon: Compass,
              href: "/catalog?type=3+Wheeler"
            },
            // {
            //   title: "Charging",
            //   desc: "Networks, stations & solutions",
            //   icon: Zap,
            //   href: "/charging-station"
            // },
            // {
            //   title: "Parts",
            //   desc: "Genuine, verified components",
            //   icon: Wrench,
            //   href: "/shop"
            // },
            // {
            //   title: "Fleet",
            //   desc: "Manage & scale EV fleets",
            //   icon: Gauge,
            //   href: "/catalog"
            // }
          ].map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                href={cat.href}
                className="group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[160px] bg-white dark:bg-[#0B2117]/80 border-[#D8E3D3] dark:border-emerald-900/40 hover:border-[#2C9A5F] dark:hover:border-emerald-500/50 hover:bg-[#F0F5EC] dark:hover:bg-[#0F2A1E]"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-[#EBF1E5] dark:bg-emerald-950 border border-[#D8E3D3] dark:border-emerald-800/40 text-[#1B6642] dark:text-[#8FE24A] group-hover:bg-[#0A2A1E] group-hover:text-white dark:group-hover:bg-[#8FE24A] dark:group-hover:text-[#07130E]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 transition-all text-[#6C8377] dark:text-emerald-400/50 group-hover:text-[#1F7A4D] dark:group-hover:text-[#8FE24A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div>
                  <h3 className="text-base font-semibold mt-4 text-[#0A2A1E] dark:text-white">{cat.title}</h3>
                  <p className="text-xs mt-1 text-[#6C8377] dark:text-emerald-200/60">{cat.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pinned / Floating "See all categories" at bottom right of section */}
        <div className="flex justify-end mt-6 sm:mt-0 sm:absolute sm:bottom-6 sm:right-8 z-20">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#0A2A1E] dark:bg-[#8FE24A] text-white dark:text-[#07130E] font-bold text-xs sm:text-sm shadow-2xl hover:scale-105 transition-all border border-[#8FE24A]/40 backdrop-blur-md group"
          >
            <span>See all categories</span>
            <ArrowRight className="w-4 h-4 text-[#8FE24A] dark:text-[#07130E] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 4. WHY EVPLSE SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0A2A1E] dark:bg-[#071912] border border-[#184834] dark:border-emerald-800/40 text-white relative overflow-hidden shadow-xl">
          {/* Ambient radial glow for contrast and depth */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1F7A4D]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8FE24A]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mb-10 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#8FE24A]/20 text-[#8FE24A] border border-[#8FE24A]/30 mb-3">
              The Difference
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Why EVPLSE?</h2>
            <p className="text-slate-200 dark:text-emerald-100/90 text-sm sm:text-base mt-2 font-normal leading-relaxed">
              Trust isn't claimed — it's built into how the platform works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Card 1: Trust */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white/10 dark:bg-[#0C241B] border border-white/15 dark:border-emerald-700/40 hover:border-[#8FE24A]/60 transition-all backdrop-blur-md">
              <div className="text-xs font-mono font-bold text-[#8FE24A] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8FE24A]" />
                01 — TRUST
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Trust</h3>
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
            <div className="p-6 sm:p-7 rounded-2xl bg-white/10 dark:bg-[#0C241B] border border-white/15 dark:border-emerald-700/40 hover:border-[#8FE24A]/60 transition-all backdrop-blur-md">
              <div className="text-xs font-mono font-bold text-[#8FE24A] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8FE24A]" />
                02 — EXPERTISE
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Expertise</h3>
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
            <div className="p-6 sm:p-7 rounded-2xl bg-white/10 dark:bg-[#0C241B] border border-white/15 dark:border-emerald-700/40 hover:border-[#8FE24A]/60 transition-all backdrop-blur-md">
              <div className="text-xs font-mono font-bold text-[#8FE24A] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8FE24A]" />
                03 — ECOSYSTEM
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Ecosystem</h3>
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
          </div>
        </div>
      </section>

      {/* 5. REVIEWS, COMPARISONS & INSIGHT */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <div className="text-xs font-mono text-[#1F7A4D] dark:text-[#8FE24A] tracking-wider uppercase mb-2">Fresh From The Road</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2A1E] dark:text-white">Reviews, comparisons &amp; insight.</h2>
            <p className="text-[#3C5347] dark:text-emerald-100/70 text-sm mt-1">
              Editorial deep-dives, Instagram reels, and YouTube video tests — updated regularly.
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
          {/* Box 1: Real Editorial Update (/updates) */}
          <Link
            href={(displayUpdates[0] as any)?.href || `/updates/${displayUpdates[0]?.slug || ""}`}
            className="group rounded-2xl bg-white dark:bg-[#0B2117] border border-[#D8E3D3] dark:border-emerald-900/40 hover:border-[#2C9A5F] dark:hover:border-emerald-500/40 overflow-hidden flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-xl transition-all min-h-[440px]"
          >
            <div>
              <div className="relative h-56 w-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                {displayUpdates[0]?.photo ? (
                  <Image
                    src={displayUpdates[0].photo}
                    alt={displayUpdates[0].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#EBF1E5] dark:bg-emerald-900/40 text-[#1F7A4D] dark:text-emerald-500">
                    <Sparkles className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <span className="absolute top-3 left-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0A2A1E]/85 text-[#8FE24A] px-2.5 py-1 rounded-full border border-emerald-700/40 backdrop-blur-sm">
                  Editorial • Web
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-base font-bold text-[#0A2A1E] dark:text-white leading-snug group-hover:text-[#1F7A4D] dark:group-hover:text-[#8FE24A] transition-colors line-clamp-2">
                  {displayUpdates[0]?.title || "Tata Punch EV vs Mahindra XUV400 — Real-World Range & Efficiency Test"}
                </h3>
                <p className="text-xs text-[#6C8377] dark:text-emerald-100/60 mt-2 line-clamp-3 leading-relaxed">
                  {displayUpdates[0]?.excerpt || "We drove both electric SUVs across city highways and steep climbs to see which vehicle delivers closer to claimed range."}
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex items-center justify-between text-[11px] font-mono text-[#6C8377] dark:text-emerald-400/60 border-t border-[#D8E3D3] dark:border-emerald-900/30">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {displayUpdates[0]?.date ? new Date(displayUpdates[0].date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Latest"}
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#1F7A4D] dark:text-[#8FE24A] group-hover:translate-x-1 transition-transform">
                READ ARTICLE <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Box 2: Live Instagram Embed (@evplseofficial) */}
          <div className="group rounded-2xl bg-white dark:bg-[#0B2117] border border-[#D8E3D3] dark:border-emerald-900/40 hover:border-pink-500/50 dark:hover:border-pink-500/40 overflow-hidden flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-xl transition-all min-h-[440px]">
            <div className="flex flex-col flex-1">
              <div className="p-3.5 flex items-center justify-between border-b border-[#D8E3D3]/60 dark:border-emerald-900/30 bg-slate-50/50 dark:bg-black/20">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-[#833ab4]/90 via-[#fd1d1d]/90 to-[#fcb045]/90 text-white px-2.5 py-1 rounded-full shadow-xs">
                  <FaInstagram className="w-3 h-3" /> @evplseofficial
                </span>
                <span className="text-[10px] font-mono text-[#6C8377] dark:text-slate-400">
                  Latest Post
                </span>
              </div>

              {/* Live Instagram Frame */}
              <div className="relative flex-1 min-h-[300px] w-full bg-slate-50 dark:bg-[#06120D] overflow-hidden">
                <iframe
                  src="https://www.instagram.com/evplseofficial/embed"
                  title="Latest from @evplseofficial on Instagram"
                  className="w-full h-full min-h-[320px] border-0"
                  scrolling="no"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 flex items-center justify-between text-[11px] font-mono border-t border-[#D8E3D3] dark:border-emerald-900/30 bg-white dark:bg-[#0B2117]">
              <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-semibold">
                <FaInstagram className="w-3.5 h-3.5" /> Instagram
              </span>
              <a
                href="https://www.instagram.com/evplseofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400 hover:underline group-hover:translate-x-0.5 transition-transform"
              >
                SEE ON INSTAGRAM <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Box 3: Live YouTube Player (@Evplse) */}
          <div className="group rounded-2xl bg-white dark:bg-[#0B2117] border border-[#D8E3D3] dark:border-emerald-900/40 hover:border-red-500/50 dark:hover:border-red-500/40 overflow-hidden flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-xl transition-all min-h-[440px]">
            <div className="flex flex-col flex-1">
              <div className="p-3.5 flex items-center justify-between border-b border-[#D8E3D3]/60 dark:border-emerald-900/30 bg-slate-50/50 dark:bg-black/20">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#FF0000] text-white px-2.5 py-1 rounded-full shadow-xs">
                  <FaYoutube className="w-3 h-3" /> @Evplse
                </span>
                <span className="text-[10px] font-mono text-[#6C8377] dark:text-slate-400">
                  Latest Video
                </span>
              </div>

              {/* Live YouTube Player Frame */}
              <div className="relative flex-1 min-h-[300px] w-full bg-black overflow-hidden flex items-center justify-center">
                <iframe
                  src="https://www.youtube-nocookie.com/embed?listType=user_uploads&list=Evplse"
                  title="Latest from @Evplse on YouTube"
                  className="w-full h-full min-h-[320px] border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 flex items-center justify-between text-[11px] font-mono border-t border-[#D8E3D3] dark:border-emerald-900/30 bg-white dark:bg-[#0B2117]">
              <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
                <FaYoutube className="w-3.5 h-3.5" /> YouTube
              </span>
              <a
                href="https://www.youtube.com/@Evplse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 hover:underline group-hover:translate-x-0.5 transition-transform"
              >
                WATCH ON YOUTUBE <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEW RELEASES SECTION (30% Controls / 70% Slider) */}
      <VehicleScrollSection
        type="new"
        items={listings.filter((l) => isLaunched(l.launchdate)).slice(0, 12)}
      />

      {/* 7. UPCOMING VEHICLES SECTION (30% Controls / 70% Slider) */}
      <VehicleScrollSection
        type="upcoming"
        items={listings.filter((l) => !isLaunched(l.launchdate)).slice(0, 12)}
      />

      {/* TOOLS BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D8E3D3] dark:border-emerald-900/30">
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