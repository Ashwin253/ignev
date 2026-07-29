"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Car,
  Truck,
  Bike,
  Compass,
  Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WPUpdate, EvListing, HeroBanner } from "../lib/wordpress";
import { isLaunched } from "../lib/wordpress";

interface EcosystemSectionProps {
  updates?: WPUpdate[];
  listings?: EvListing[];
  banners?: HeroBanner[];
}

export default function EcosystemSection({ updates = [], listings = [], banners = [] }: EcosystemSectionProps) {
  // Banner slider state
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const activeBanners = useMemo(() => banners ?? [], [banners]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % activeBanners.length);
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
    <div className="w-full bg-[#F6F8F2] pt-8 dark:bg-[#07130E] text-[#0E1F16] dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300 relative z-0">
      {/* 1. HERO / ECOSYSTEM BANNER */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF1E5] dark:bg-[#11291F] border border-[#D8E3D3] dark:border-[#1E4D37] text-xs font-mono font-medium text-[#1F7A4D] dark:text-[#8FE24A]">
              <span className="w-2 h-2 rounded-full bg-[#1F7A4D] dark:bg-[#8FE24A] animate-pulse" />
              INDIA'S ELECTRIC MOBILITY ECOSYSTEM
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0A2A1E] dark:text-white leading-[1.08]">
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

          {/* Hero Right Panel: Only Supabase Banner with details at bottom */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl overflow-hidden min-h-[420px] h-full flex flex-col justify-between bg-[#0A2A1E]">
              {/* Banner Media Layer */}
              {activeBanners.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBannerIdx}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 w-full h-full z-0 overflow-hidden"
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
                    {/* Dark gradient overlay for bottom text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
                  </motion.div>
                </AnimatePresence>
              ) : (
                /* Fallback when activeBanners is empty */
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&auto=format&fit=crop&q=80"
                    alt="EV Ecosystem"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A1E] via-black/40 to-black/20" />
                </div>
              )}

              {/* Top Tag inside Card */}
              <div className="relative z-10 p-6 flex justify-between items-center">
                {/* <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold tracking-wider text-[#8FE24A] uppercase">
                  {activeBanners.length > 0 && activeBanners[currentBannerIdx]?.label
                    ? activeBanners[currentBannerIdx].label
                    : "FEATURED BANNER"}
                </span> */}

                {/* <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-mono font-semibold text-[#8FE24A]">
                  <span className="w-2 h-2 rounded-full bg-[#8FE24A] animate-ping" />
                  LIVE
                </span> */}
              </div>

              {/* Bottom Details Panel inside Card */}
              <div className="relative z-10 p-6 sm:p-8 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-12">
                {activeBanners.length > 0 && activeBanners[currentBannerIdx] ? (
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight font-sans">
                      {activeBanners[currentBannerIdx].details || activeBanners[currentBannerIdx].label || "India's Electric Mobility Platform"}
                    </h3>

                    <div className="flex items-center justify-between pt-2">
                      <Link
                        href={activeBanners[currentBannerIdx].href || "/catalog"}
                        className="inline-flex items-center gap-2 bg-[#8FE24A] hover:bg-[#a0f05d] text-[#07130E] font-bold px-5 py-2.5 rounded-full text-xs transition-all transform hover:scale-105 shadow-lg shadow-[#8FE24A]/20"
                      >
                        {activeBanners[currentBannerIdx].cta || "Explore Now"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {/* Pagination dots if multiple banners exist */}
                      {activeBanners.length > 1 && (
                        <div className="flex gap-1.5 items-center">
                          {activeBanners.map((b: any, idx: number) => (
                            <button
                              key={b.id || idx}
                              onClick={() => setCurrentBannerIdx(idx)}
                              className={`h-2 rounded-full transition-all ${
                                currentBannerIdx === idx ? "w-6 bg-[#8FE24A]" : "w-2 bg-white/30 hover:bg-white/60"
                              }`}
                              aria-label={`Go to banner ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      India's Electric Mobility Ecosystem
                    </h3>
                    <p className="text-xs text-slate-300">
                      Compare EVs, charging stations, and commercial fleets across India.
                    </p>
                    <Link
                      href="/catalog"
                      className="inline-flex items-center gap-2 bg-[#8FE24A] text-[#07130E] font-bold px-5 py-2.5 rounded-full text-xs"
                    >
                      Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trust Strip */}
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
      </section>

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
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0A2A1E] dark:bg-gradient-to-r dark:from-[#0A2A1E] dark:via-[#0D3627] dark:to-[#0A2A1E] border border-[#154C34] dark:border-emerald-800/40 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mb-10">
            <div className="text-xs font-mono text-[#8FE24A] tracking-wider uppercase mb-2">The Difference</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Why EVPLSE?</h2>
            <p className="text-emerald-100/70 text-sm mt-2">
              Trust isn't claimed — it's built into how the platform works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
              <div className="text-xs font-mono text-[#8FE24A] mb-3">01 — TRUST</div>
              <h3 className="text-lg font-bold text-white mb-3">Trust</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/70">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  Verified information, not marketing copy
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  No paid rankings, ever
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  Transparent, side-by-side comparisons
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
              <div className="text-xs font-mono text-[#8FE24A] mb-3">02 — EXPERTISE</div>
              <h3 className="text-lg font-bold text-white mb-3">Expertise</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/70">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  Backed by industry experts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  Real-world, on-road testing
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  The latest EV insights, explained simply
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
              <div className="text-xs font-mono text-[#8FE24A] mb-3">03 — ECOSYSTEM</div>
              <h3 className="text-lg font-bold text-white mb-3">Ecosystem</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/70">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  Vehicles, charging &amp; finance
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  Insurance &amp; genuine parts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FE24A]" />
                  Fleet management — everything connected
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
            <p className="text-[#3C5347] dark:text-emerald-100/70 text-sm mt-1">Real testing, honest opinions — updated regularly.</p>
          </div>
          <Link
            href="/updates"
            className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-[#1F7A4D] dark:text-[#8FE24A] hover:underline"
          >
            SEE ALL UPDATES <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayUpdates.map((item: any, idx) => (
            <Link
              key={idx}
              href={item.href || `/updates/${item.slug || ""}`}
              className="group rounded-2xl bg-white dark:bg-[#0B2117] border border-[#D8E3D3] dark:border-emerald-900/40 hover:border-[#2C9A5F] dark:hover:border-emerald-500/40 overflow-hidden flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-lg transition-all"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                  {item.photo ? (
                    <Image
                      src={item.photo}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#EBF1E5] dark:bg-emerald-900/40 text-[#1F7A4D] dark:text-emerald-500">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  <span className="absolute top-3 left-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0A2A1E]/80 text-[#8FE24A] px-2.5 py-1 rounded-full border border-emerald-700/40 backdrop-blur-sm">
                    {idx === 0 ? "Comparison" : idx === 1 ? "Review" : "Guide"}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-[#0A2A1E] dark:text-white leading-snug group-hover:text-[#1F7A4D] dark:group-hover:text-[#8FE24A] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#6C8377] dark:text-emerald-100/60 mt-2 line-clamp-2 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between text-[11px] font-mono text-[#6C8377] dark:text-emerald-400/60 border-t border-[#D8E3D3] dark:border-emerald-900/30">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1 font-semibold text-[#1F7A4D] dark:text-[#8FE24A] group-hover:translate-x-1 transition-transform">
                  READ STORY →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. VEHICLES ROW + TOOLS LINK */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D8E3D3] dark:border-emerald-900/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <div className="text-xs font-mono text-[#1F7A4D] dark:text-[#8FE24A] tracking-wider uppercase mb-2">Fresh On Road</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2A1E] dark:text-white">New Releases & Upcoming</h2>
            <p className="text-[#3C5347] dark:text-emerald-100/70 text-sm mt-1">Recently launched and upcoming electric vehicles in India.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-[#1F7A4D] dark:text-[#8FE24A] hover:underline"
            >
              VIEW ALL <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Horizontal scrollable vehicle row */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {listings.slice(0, 10).map((l, i) => {
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
                  className="group flex-shrink-0 w-[260px] rounded-2xl border border-[#D8E3D3] dark:border-emerald-900/40 bg-white dark:bg-[#0B2117] overflow-hidden hover:border-[#2C9A5F] dark:hover:border-emerald-500/40 hover:shadow-lg transition-all"
                >
                  <div className="relative h-40 bg-[#F6F8F2] dark:bg-emerald-950/60 overflow-hidden">
                    {l.photo ? (
                      <Image
                        src={l.photo}
                        alt={l.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="260px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6C8377]"><Zap className="w-8 h-8" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                    {!isLaunched(l.launchdate) && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400/90 text-[10px] font-bold text-zinc-900">
                        <Calendar className="inline w-3 h-3 mr-0.5" /> Upcoming
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6C8377] dark:text-emerald-400/60">{l.brand}</p>
                    <h3 className="text-sm font-bold text-[#0A2A1E] dark:text-white mt-0.5 line-clamp-1">{l.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-[#1F7A4D] dark:text-[#8FE24A]">{pricing || "TBA"}</span>
                      {range && <span className="text-[10px] font-mono text-[#6C8377] dark:text-emerald-300/60">{range} km</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

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