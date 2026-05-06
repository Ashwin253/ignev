"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock3, Sparkles, ArrowUpRight } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";

type ComingSoonItem = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  launch: string;
  photo: string;
};

type ComingSoonPayload = {
  coming_soon: {
    electric_cars: ComingSoonItem[];
    electric_two_wheelers: ComingSoonItem[];
    electric_autos: ComingSoonItem[];
  };
};

export default function ComingSoonCars({ comingSoon }: { comingSoon: ComingSoonPayload }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const items = [
    ...comingSoon.coming_soon.electric_cars.slice(0, 2),
    ...comingSoon.coming_soon.electric_two_wheelers.slice(0, 1),
    ...comingSoon.coming_soon.electric_autos.slice(0, 1),
  ];

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateProgress = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }

      setScrollProgress(Math.min(1, Math.max(0, rail.scrollLeft / maxScroll)));
    };

    rail.scrollTo({ left: 0, behavior: "auto" });
    updateProgress();
    rail.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      rail.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [items.length]);

  const progressIndex = Math.min(2, Math.max(0, Math.round(scrollProgress * 2)));

  return (
    <section className="bg-transparent py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              <Clock3 size={14} />
              Coming soon
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Upcoming models
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Fresh launches and anticipated EVs, presented in a clean card grid that matches the white homepage style.
            </p>
          </div>

          {/* <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
            <Sparkles size={16} className="text-amber-500" />
            Updated from `comingsoon.json`
          </div> */}
        </div>

        <div
          ref={railRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-500/70 md:grid md:overflow-visible md:pb-0 md:pr-0 md:grid-cols-2 xl:grid-cols-4 md:[&::-webkit-scrollbar]:hidden"
        >
          {items.map((car, index) => (
            <motion.article
              key={car.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group flex w-[82vw] max-w-sm flex-shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)] md:w-auto md:max-w-none md:flex-shrink md:snap-none flex-col"
            >
              <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                <Image
                  src={car.photo}
                  alt={car.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => triggerEnquiryModal(`Coming Soon: ${car.name}`)}
                    className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 bg-white text-slate-900 px-5 py-2 rounded-full text-xs font-bold shadow-xl transition-all flex items-center gap-2"
                  >
                    Enquire Now <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {car.brand}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    {car.launch}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{car.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{car.type}</p>
                </div>
                <p className="text-sm font-medium text-slate-700">{car.pricing}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
          <span className={`h-1.5 rounded-full transition-all duration-300 ${progressIndex === 0 ? "w-12 bg-sky-500 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]" : "w-8 bg-slate-200"}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${progressIndex === 1 ? "w-12 bg-sky-500 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]" : "w-8 bg-slate-200"}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${progressIndex === 2 ? "w-12 bg-sky-500 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]" : "w-8 bg-slate-200"}`} />
        </div>
      </div>
    </section>
  );
}
