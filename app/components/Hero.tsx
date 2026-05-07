"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CarFront, Bike, Truck, Sparkles, Send,
  ChevronLeft, ChevronRight, Star, BatteryCharging,
  MapPin, CalendarDays, BadgeCheck, CheckCircle2, Gauge, Info,
} from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";
import type { EvListing, HeroBanner } from "../lib/wordpress";
import { formatLaunchDate, isLaunched } from "../lib/wordpress";

type Product = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  photo: string;
  slug?: string;
};

type ProductsPayload = {
  electric_cars: Product[];
  electric_two_wheelers: Product[];
  electric_autos: Product[];
};

type TabKey = "featured" | "buy" | "cars" | "twoWheelers" | "autos";

const tabs: Array<{ key: TabKey; label: string; description: string; icon: typeof CarFront }> = [
  { key: "featured",    label: "Featured",   description: "Latest listings", icon: Star      },
  { key: "buy",         label: "All",         description: "All EVs",         icon: Sparkles  },
  { key: "cars",        label: "Cars",        description: "Electric cars",   icon: CarFront  },
  { key: "twoWheelers", label: "2 Wheelers",  description: "City rides",      icon: Bike      },
  { key: "autos",       label: "Autos",       description: "Commercial EVs",  icon: Truck     },
];

const heroSlides = [
  {
    cta: "Explore catalog",
    href: "/catalog",
    imageHorizontal: "/herobanner/banner-1-horizontal.webp",
    imageVertical: "/herobanner/banner-1-vertical.webp",
    accent: "from-sky-600/90 via-sky-500/80 to-cyan-400/80",
  },
  {
    cta: "View two-wheelers",
    href: "/catalog",
    imageHorizontal: "/herobanner/banner-2-horizontal.jpg",
    imageVertical: "/herobanner/banner-2-vertical.jpg",
    accent: "from-emerald-600/90 via-emerald-500/80 to-lime-400/80",
  },
  {
    cta: "Enquire now",
    href: "/catalog",
    imageHorizontal: "/herobanner/banner-3-horizontal.jpg",
    imageVertical: "/herobanner/banner-3-vertical.jpg",
    accent: "from-violet-600/90 via-fuchsia-500/80 to-pink-400/80",
  },
];

// ── Featured card (WP EvListing) ──────────────────────────────────────────────

function FeaturedCard({ listing, index }: { listing: EvListing; index: number }) {
  const launched = isLaunched(listing.launchdate);
  const launchLabel = formatLaunchDate(listing.launchdate);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="group w-[82vw] max-w-sm shrink-0 snap-start md:w-auto md:max-w-none md:shrink md:snap-none overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] flex flex-col"
    >
      <Link href={`/product/${listing.slug}`} className="block">
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          {listing.photo ? (
            <Image
              src={listing.photo}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 82vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-sky-50 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/30 via-transparent to-transparent" />
          <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            launched ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-900"
          }`}>
            {launched
              ? <><BadgeCheck size={11} /> Available</>
              : <><CalendarDays size={11} /> {launchLabel}</>
            }
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 truncate">{listing.brand}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900 line-clamp-1">{listing.title}</h2>
          </div>
          {listing.types[0] && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
              {listing.types[0]}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {listing.prices.length > 0 && (
            <span className="font-semibold text-slate-800">₹{listing.prices.join("–")} L</span>
          )}
          {listing.realWorldRange !== null && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-sky-500" />{listing.realWorldRange} km
            </span>
          )}
          {listing.batteryCapacity !== null && (
            <span className="inline-flex items-center gap-1">
              <BatteryCharging size={11} className="text-emerald-500" />{listing.batteryCapacity} kWh
            </span>
          )}
          {listing.topSpeed !== null && (
            <span className="inline-flex items-center gap-1">
              <Gauge size={11} className="text-amber-500" />{listing.topSpeed} km/h
            </span>
          )}
        </div>

        {listing.commercial && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
            <Truck size={10} /> Commercial
          </span>
        )}

        {listing.pros[0] && (
          <p className="flex items-start gap-1.5 text-xs text-slate-600 line-clamp-2">
            <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
            {listing.pros[0]}
          </p>
        )}

        <div className="mt-auto pt-1">
          <button
            onClick={() => triggerEnquiryModal(`${listing.brand} ${listing.title}`)}
            className="w-full bg-slate-900 hover:bg-sky-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
          >
            Enquire <Send size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ── Standard product card (local JSON) ───────────────────────────────────────

function ProductCard({ product, index, tabKey }: { product: Product; index: number; tabKey: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="group flex h-full w-[82vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] md:w-auto md:max-w-none md:shrink md:snap-none flex-col"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <Image
          src={product.photo}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 82vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/30 via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{product.brand}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 line-clamp-1">{product.name}</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600 shrink-0">
            {product.type}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-600">{product.pricing}</p>
        <div className="mt-auto pt-2">
          <button
            onClick={() => triggerEnquiryModal(`${product.brand} ${product.name}`)}
            className="w-full bg-slate-900 hover:bg-sky-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
          >
            Enquire <Send size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

export default function Hero({
  products,
  featured = [],
  banners = [],
}: {
  products: ProductsPayload;
  featured?: EvListing[];
  banners?: HeroBanner[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(featured.length ? "featured" : "buy");
  const [activeSlide, setActiveSlide] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);

  // Use WP banners when available, fall back to hardcoded slides
  const slides = banners.length > 0 ? banners : heroSlides;

  const visibleTabs = featured.length ? tabs : tabs.filter((t) => t.key !== "featured");

  const catalogProducts = useMemo(() => {
    if (activeTab === "cars") return products.electric_cars;
    if (activeTab === "twoWheelers") return products.electric_two_wheelers;
    if (activeTab === "autos") return products.electric_autos;
    return [
      ...products.electric_cars.slice(0, 2),
      ...products.electric_two_wheelers.slice(0, 2),
      ...products.electric_autos.slice(0, 1),
    ];
  }, [activeTab, products]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ left: 0, behavior: "auto" });
  }, [activeTab]);

  useEffect(() => {
    const t = window.setInterval(() => setActiveSlide((c) => (c + 1) % slides.length), 6000);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const prevSlide = () => setActiveSlide((c) => (c - 1 + slides.length) % slides.length);
  const nextSlide = () => setActiveSlide((c) => (c + 1) % slides.length);
  const activeCategoryLabel = visibleTabs.find((t) => t.key === activeTab)?.label ?? "All";

  return (
    <section id="home" className="relative overflow-hidden bg-linear-to-b from-white via-[#f5f8ff] to-[#edf3fb] pt-28 pb-16 text-slate-900">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel overflow-hidden rounded-4xl border border-slate-200/80 bg-white/70 shadow-[0_18px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">

          {/* Banner */}
          <div className="sticky top-0 z-10 overflow-hidden bg-slate-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.45 }}
                className="relative min-h-96 overflow-hidden md:min-h-[34rem]"
              >
                <div className="absolute inset-0">
                  <Image src={slides[activeSlide].imageHorizontal} alt="Banner" fill sizes="100vw" className="hidden object-cover md:block" priority />
                  <Image src={slides[activeSlide].imageVertical} alt="Banner" fill sizes="100vw" className="object-cover md:hidden" priority />
                </div>
                {/* Subtle bottom gradient for CTA legibility only — no colour overlay */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/50 to-transparent" />

                {/* CTA */}
                <div className="relative z-10 flex min-h-96 items-end md:min-h-[34rem]">
                  <div className="p-6 sm:p-8 md:p-10">
                    <a href={slides[activeSlide].href} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-[1.01] hover:bg-slate-50">
                      {slides[activeSlide].cta} <ArrowRight size={16} />
                    </a>
                  </div>
                </div>

                {/* Info badge — top right, shows banner details on click */}
                <div className="absolute top-4 right-16 z-20">
                  <button
                    onClick={() => setShowInfo((v) => !v)}
                    aria-label="Banner info"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/35 transition-colors"
                  >
                    <Info size={15} />
                  </button>
                  <AnimatePresence>
                    {showInfo && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-10 w-56 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-slate-200 p-4 text-left"
                      >
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Banner details</p>
                        <p className="text-sm font-semibold text-slate-900 mb-1">{slides[activeSlide].cta}</p>
                        <p className="text-xs text-sky-600 break-all">{slides[activeSlide].href}</p>
                        <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                          Slide {activeSlide + 1} of {slides.length}
                          {banners.length > 0 && " · from WordPress"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Prev / Next */}
                <button onClick={prevSlide} aria-label="Previous" className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={nextSlide} aria-label="Next" className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25">
                  <ChevronRight size={18} />
                </button>

                {/* Slide dots */}
                {slides.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {slides.map((_, i) => (
                      <button key={i} onClick={() => setActiveSlide(i)} aria-label={`Slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tab bar */}
          <div className="relative -mt-16 z-20 px-4 pb-5 sm:px-6 md:-mt-20 md:px-8 md:pb-8">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-3 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Browse</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{activeCategoryLabel}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleTabs.map((tab) => {
                  const isActive = tab.key === activeTab;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? tab.key === "featured"
                            ? "border-amber-300 bg-amber-500 text-white shadow-[0_8px_24px_rgba(245,158,11,0.3)]"
                            : "border-sky-300 bg-sky-600 text-white shadow-[0_8px_24px_rgba(2,132,199,0.25)]"
                          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
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
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:px-6 md:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:overflow-visible md:pb-8 md:grid-cols-2 xl:grid-cols-4"
            >
              {activeTab === "featured"
                ? featured.map((listing, i) => (
                    <FeaturedCard key={listing.id} listing={listing} index={i} />
                  ))
                : catalogProducts.map((product, i) => (
                    <ProductCard key={`${activeTab}-${product.name}`} product={product} index={i} tabKey={activeTab} />
                  ))
              }
            </motion.div>
          </AnimatePresence>

          {/* View all */}
          <div className="flex justify-end px-4 pb-6 sm:px-6 md:px-8 md:pb-8">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              View all listings <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
