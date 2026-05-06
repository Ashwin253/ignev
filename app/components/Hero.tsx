"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CarFront, Bike, Truck, Sparkles, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";

type Product = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  photo: string;
};

type ProductsPayload = {
  electric_cars: Product[];
  electric_two_wheelers: Product[];
  electric_autos: Product[];
};

type TabKey = "buy" | "cars" | "twoWheelers" | "autos";

const tabs: Array<{
  key: TabKey;
  label: string;
  description: string;
  icon: typeof CarFront;
}> = [
    { key: "buy", label: "All", description: "All ", icon: Sparkles },
    { key: "cars", label: "Cars", description: "Electric cars", icon: CarFront },
    { key: "twoWheelers", label: "2 Wheelers", description: "City rides", icon: Bike },
    { key: "autos", label: "Autos", description: "Commercial EVs", icon: Truck },
  ];

const heroSlides = [
  {
    title: "Drive the EV shift with confidence",
    cta: "Explore catalog",
    href: "/catalog",
    imageHorizontal: "/herobanner/banner-1-horizontal.webp",
    imageVertical: "/herobanner/banner-1-vertical.webp",
    accent: "from-sky-600/90 via-sky-500/80 to-cyan-400/80",
  },
  {
    title: "Compare compact city EVs in one place",
    cta: "View two-wheelers",
    href: "/catalog",
    imageHorizontal: "/herobanner/banner-2-horizontal.jpg",
    imageVertical: "/herobanner/banner-2-vertical.jpg",
    accent: "from-emerald-600/90 via-emerald-500/80 to-lime-400/80",
  },
  {
    title: "See upcoming EVs before they land",
    cta: "Enquire now",
    href: "/catalog",
    imageHorizontal: "/herobanner/banner-3-horizontal.jpg",
    imageVertical: "/herobanner/banner-3-vertical.jpg",
    accent: "from-violet-600/90 via-fuchsia-500/80 to-pink-400/80",
  },
];

export default function Hero({ products }: { products: ProductsPayload }) {
  const [activeTab, setActiveTab] = useState<TabKey>("buy");
  const [activeSlide, setActiveSlide] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const railRef = useRef<HTMLDivElement | null>(null);

  const featuredProducts = useMemo(() => {
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

    const updateProgress = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }

      setScrollProgress(Math.min(1, Math.max(0, rail.scrollLeft / maxScroll)));
    };

    updateProgress();
    rail.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      rail.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [activeTab]);

  const activeCategoryLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? "All";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const prevSlide = () => setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setActiveSlide((current) => (current + 1) % heroSlides.length);

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-b from-white via-[#f5f8ff] to-[#edf3fb] pt-28 pb-16 text-slate-900"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/70 shadow-[0_18px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="sticky top-0 z-10 overflow-hidden bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.45 }}
                className="relative min-h-[24rem] overflow-hidden md:min-h-[34rem]"
              >
                <div className="absolute inset-0">
                  <Image
                    src={heroSlides[activeSlide].imageHorizontal}
                    alt={heroSlides[activeSlide].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 100vw"
                    className="hidden object-cover md:block"
                    priority
                  />
                  <Image
                    src={heroSlides[activeSlide].imageVertical}
                    alt={heroSlides[activeSlide].title}
                    fill
                    sizes="100vw"
                    className="object-cover md:hidden"
                    priority
                  />
                </div>

                <div className={`absolute inset-0 bg-gradient-to-r ${heroSlides[activeSlide].accent}`} />
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative z-10 flex min-h-[24rem] items-end md:min-h-[34rem]">
                  <div className="max-w-3xl p-6 pb-6 sm:p-8 md:p-10">
                    <a
                      href={heroSlides[activeSlide].href}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-[1.01] hover:bg-slate-50"
                    >
                      {heroSlides[activeSlide].cta}
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>

                <button
                  onClick={prevSlide}
                  aria-label="Previous banner"
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next banner"
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25"
                >
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative -mt-16 z-20 px-4 pb-5 sm:px-6 md:-mt-20 md:px-8 md:pb-8">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-3 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Categories
                </p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {activeCategoryLabel}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map((tab) => {
                  const active = tab.key === activeTab;
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`group inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-left transition-all duration-300 ${
                        active
                          ? "border-sky-300 bg-sky-600 text-white shadow-[0_18px_40px_rgba(2,132,199,0.25)]"
                          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="block text-sm font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              ref={railRef}
              key={activeTab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-500/70 md:grid md:overflow-visible md:pb-0 md:pr-0 md:grid-cols-2 xl:grid-cols-5 md:[&::-webkit-scrollbar]:hidden"
            >
              {featuredProducts.map((product, index) => (
                <motion.article
                  key={`${activeTab}-${product.name}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="group flex h-full w-[82vw] max-w-sm flex-shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] md:w-auto md:max-w-none md:flex-shrink md:snap-none flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <Image
                      src={product.photo}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                          {product.brand}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900 line-clamp-1">{product.name}</h2>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600 shrink-0">
                        {product.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">{product.pricing}</p>
                    </div>
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
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
