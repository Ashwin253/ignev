"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock3, ArrowUpRight, CalendarDays } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";

export type ComingSoonItem = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  launch: string;       // display string e.g. "May 2026" or "2026"
  photo: string;
  slug?: string;        // WP slug for /product/[slug] link
};

export default function ComingSoonCars({ items }: { items: ComingSoonItem[] }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      setScrollProgress(max <= 0 ? 0 : Math.min(1, rail.scrollLeft / max));
    };
    rail.scrollTo({ left: 0, behavior: "auto" });
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { rail.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [items.length]);

  const dotCount = Math.min(items.length, 4);
  const progressIndex = Math.min(dotCount - 1, Math.max(0, Math.round(scrollProgress * (dotCount - 1))));

  if (!items.length) return null;

  return (
    <section className="bg-transparent py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {/* <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              <Clock3 size={14} />
              Coming soon
            </span> */}
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Upcoming models
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Fresh launches and anticipated EVs — straight from the WordPress catalog.
            </p>
          </div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
          >
            View all listings <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Scroll rail */}
        <div
          ref={railRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:overflow-visible md:pb-0 md:grid-cols-2 xl:grid-cols-4"
        >
          {items.map((car, index) => {
            const card = (
              <motion.article
                key={car.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="group flex w-[82vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)] md:w-auto md:max-w-none md:shrink md:snap-none flex-col"
              >
                {/* Image */}
                <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                  {car.photo ? (
                    <Image
                      src={car.photo}
                      alt={car.name}
                      fill
                      sizes="(max-width: 768px) 82vw, 25vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-amber-50 to-slate-100" />
                  )}
                  {/* Hover enquire overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <button
                      onClick={(e) => { e.preventDefault(); triggerEnquiryModal(`Coming Soon: ${car.brand} ${car.name}`); }}
                      className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 bg-white text-slate-900 px-5 py-2 rounded-full text-xs font-bold shadow-xl transition-all flex items-center gap-2"
                    >
                      Enquire Now <ArrowUpRight size={14} />
                    </button>
                  </div>
                  {/* Launch badge */}
                  {car.launch && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-400/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-slate-900">
                      <CalendarDays size={10} /> {car.launch}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="space-y-2 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {car.brand}
                    </span>
                    <span className="text-xs text-slate-400">{car.type}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{car.name}</h3>
                  {car.pricing && (
                    <p className="text-sm font-medium text-slate-700">{car.pricing}</p>
                  )}
                </div>
              </motion.article>
            );

            // Wrap in Link if we have a WP slug
            return car.slug ? (
              <Link key={car.name} href={`/product/${car.slug}`} className="contents">
                {card}
              </Link>
            ) : card;
          })}
        </div>

        {/* Mobile scroll dots */}
        {dotCount > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                progressIndex === i ? "w-12 bg-amber-500" : "w-8 bg-slate-200"
              }`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
