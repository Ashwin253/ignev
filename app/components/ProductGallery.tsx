"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
  photos: string[];
  name: string;
}

export default function ProductGallery({ photos, name }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  // Listen for color-triggered image switch from ProductMainUI
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

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + photos.length) % photos.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % photos.length);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-slate-100 select-none">
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
          />
        </AnimatePresence>

        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-700" />
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors"
            >
              <ChevronRight size={20} className="text-slate-700" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 bg-sky-500"
                      : "w-1.5 bg-white/60 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails — shown when there are multiple photos */}
      {photos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              aria-label={`View photo ${i + 1}`}
              className={`flex-shrink-0 h-20 w-28 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === current
                  ? "border-sky-500 shadow-md"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={photo}
                alt={`${name} thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
