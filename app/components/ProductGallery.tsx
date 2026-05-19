"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Palette, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
  photos: string[];
  name: string;
  colors?: string[];
}

export default function ProductGallery({ photos, name, colors = [] }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showColors, setShowColors] = useState(false);
  const [showThumbs, setShowThumbs] = useState(false);

  // Listen for color-triggered image switch
  useEffect(() => {
    const handler = (e: Event) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      if (index >= 0 && index < photos.length) {
        setDirection(index > current ? 1 : -1);
        setCurrent(index);
      }
    };
    window.addEventListener("gallery-set-image", handler);
    return () => window.removeEventListener("gallery-set-image", handler);
  }, [current, photos.length]);

  const prev = () => { setDirection(-1); setCurrent((c) => (c - 1 + photos.length) % photos.length); };
  const next = () => { setDirection(1); setCurrent((c) => (c + 1) % photos.length); };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const handleColorClick = (index: number) => {
    if (index < photos.length) {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    }
    window.dispatchEvent(new CustomEvent("gallery-set-image", { detail: { index } }));
    setShowColors(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-4/3 overflow-hidden rounded-[1.75rem] bg-slate-100 select-none">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={current}
            src={photos[current]}
            alt={`${name} photo ${current + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            loading={current === 0 ? "eager" : "lazy"}
            fetchPriority={current === 0 ? "high" : "auto"}
          />
        </AnimatePresence>

        {/* Prev / Next arrows */}
        {photos.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors">
              <ChevronLeft size={20} className="text-slate-700" />
            </button>
            <button onClick={next} aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors">
              <ChevronRight size={20} className="text-slate-700" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-5 bg-sky-500" : "w-1.5 bg-white/60 hover:bg-white"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Floating action buttons (bottom-right) ── */}
        <div className="absolute bottom-12 right-3 flex flex-col gap-2 z-10">
          {/* Colors button */}
          {colors.length > 0 && (
            <button
              onClick={() => { setShowColors(!showColors); setShowThumbs(false); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold shadow-lg transition-all ${
                showColors
                  ? "bg-slate-900 text-white"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              <Palette size={13} />
              Colors
            </button>
          )}

          {/* Photos button */}
          {photos.length > 1 && (
            <button
              onClick={() => { setShowThumbs(!showThumbs); setShowColors(false); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold shadow-lg transition-all ${
                showThumbs
                  ? "bg-slate-900 text-white"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              <LayoutGrid size={13} />
              Photos
            </button>
          )}
        </div>

        {/* ── Colors popup ── */}
        <AnimatePresence>
          {showColors && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-24 right-3 z-10 flex gap-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/10 p-2.5 shadow-xl"
            >
              {colors.map((hex, i) => {
                const code = hex.startsWith("#") ? hex : `#${hex.replace("#", "")}`;
                return (
                  <button
                    key={i}
                    onClick={() => handleColorClick(i)}
                    className={`h-7 w-7 rounded-lg border-2 transition-all hover:scale-110 ${
                      i === current ? "border-white shadow-md" : "border-white/30 shadow-sm"
                    }`}
                    style={{ backgroundColor: code }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Thumbnails popup ── */}
        <AnimatePresence>
          {showThumbs && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-24 right-3 z-10 flex gap-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/10 p-2 shadow-xl max-w-[75%] overflow-x-auto"
            >
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); setShowThumbs(false); }}
                  className={`shrink-0 h-12 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                    i === current ? "border-sky-400 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={photo} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop thumbnails — always visible on md+ */}
      {photos.length > 1 && (
        <div className="hidden md:flex gap-3 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`shrink-0 h-20 w-28 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === current ? "border-sky-500 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={photo} alt={`${name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
