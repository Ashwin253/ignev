"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatLaunchDate, isLaunched, formatPricing } from "../lib/wordpress";
import { getVehiclePhoto } from "../lib/vehicle-images";

interface MoreLikeThisProps {
  related: any[];
}

export default function MoreLikeThisSection({ related }: MoreLikeThisProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!related || related.length === 0) return null;

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % related.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + related.length) % related.length);
  };

  const currentItem = related[currentIndex];

  return (
    <div className="mt-20 sm:mt-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">More like this</h2>
          <p className="text-xs text-zinc-500 font-medium sm:hidden mt-0.5">
            {currentIndex + 1} of {related.length} similar EVs
          </p>
        </div>

        {/* Right-side navigation arrows on mobile header */}
        {related.length > 1 && (
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 active:scale-90 transition shadow-xs cursor-pointer"
              aria-label="Previous vehicle"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-emerald-300/80 bg-emerald-500 text-white active:scale-90 transition shadow-md shadow-emerald-500/25 cursor-pointer"
              aria-label="Next vehicle"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE VIEW: 1 shown at a time with arrow in right side ── */}
      <div className="block sm:hidden">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id || currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <Link
                href={`/product/${currentItem.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md active:scale-[0.99] transition relative"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
                  <Image
                    src={getVehiclePhoto(currentItem.photo, currentItem)}
                    alt={currentItem.title}
                    fill
                    sizes="100vw"
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#10855f] dark:text-[#34ebb1]">
                      {currentItem.brand}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-zinc-900 dark:text-white">
                      {currentItem.title}
                    </h3>
                    {currentItem.prices && currentItem.prices.length > 0 && (
                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 font-bold">
                        {formatPricing(currentItem.prices)}
                      </p>
                    )}
                    <p className={`mt-1.5 text-xs font-medium ${isLaunched(currentItem.launchdate) ? "text-emerald-600" : "text-amber-600"}`}>
                      {formatLaunchDate(currentItem.launchdate)}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                      View Details <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Floating arrow on the right side of the card */}
          {related.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-[38%] -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 dark:bg-zinc-800/95 shadow-xl border border-zinc-200/80 dark:border-zinc-700 text-zinc-800 dark:text-white hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 transition active:scale-90 cursor-pointer"
              aria-label="Next vehicle"
            >
              <ChevronRight size={22} className="ml-0.5" />
            </button>
          )}
        </div>

        {/* Dots indicator below card on mobile */}
        {related.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-4">
            {related.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to vehicle ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 bg-emerald-500 dark:bg-emerald-400"
                    : "w-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP VIEW: Clean 4-card grid ── */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {related.map((rel) => (
          <Link
            key={rel.id}
            href={`/product/${rel.slug}`}
            className="group flex flex-col h-full overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:border-[#a5e6d1]/60 hover:shadow-xl transition-all duration-350 hover:-translate-y-1"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-transparent shrink-0">
              <Image
                src={getVehiclePhoto(rel.photo, rel)}
                alt={rel.title}
                fill
                sizes="33vw"
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 flex flex-col grow">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#10855f] dark:text-[#34ebb1]">
                  {rel.brand}
                </p>
                <h3 className="mt-1 text-lg font-black text-zinc-900 dark:text-white">
                  {rel.title}
                </h3>
                {rel.prices && rel.prices.length > 0 && (
                  <p className="mt-1 text-sm text-zinc-550 dark:text-zinc-350 font-bold">
                    {formatPricing(rel.prices)}
                  </p>
                )}
                <p className={`mt-1.5 text-xs font-medium ${isLaunched(rel.launchdate) ? "text-emerald-600" : "text-amber-600"}`}>
                  {formatLaunchDate(rel.launchdate)}
                </p>
              </div>
              <div className="mt-auto pt-5">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-zinc-300 transition-all duration-300 group-hover:bg-[#a5e6d1] group-hover:border-[#a5e6d1] group-hover:text-slate-950 group-hover:font-extrabold shadow-inner group-hover:shadow-[0_0_15px_rgba(165,230,209,0.3)]">
                  View Details <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
