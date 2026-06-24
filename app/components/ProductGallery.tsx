"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Palette, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProductSelection } from "../product/ProductSelectionProvider";
import type { EvListing } from "../lib/wordpress";

interface ProductGalleryProps {
  photos: string[];
  name: string;
  colors?: string[];
  item?: EvListing;
}

export default function ProductGallery({ photos, name, colors = [], item }: ProductGalleryProps) {
  const selectionContext = (() => {
    try {
      return useProductSelection();
    } catch {
      return null;
    }
  })();

  const activeVariant = selectionContext
    ? selectionContext.activeVariants[selectionContext.selectedIndex]
    : null;

  const resolvedColors = activeVariant?.has_exclusive_color && activeVariant.exclusive_colors && activeVariant.exclusive_colors.length > 0
    ? activeVariant.exclusive_colors
    : colors;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showColors, setShowColors] = useState(false);
  const [showThumbs, setShowThumbs] = useState(false);

  // Compute resolved list of photos based on selected variant
  const resolvedPhotos = useMemo(() => {
    if (!item) return photos;

    const selectedVariantId = activeVariant?.id;

    const featured = item.featured_photos || [];
    const gallery = item.gallery_raw || [];

    const variantFeatured = featured.filter(p => p.url && p.variantId === selectedVariantId);
    const defaultFeatured = featured.filter(p => p.url && !p.variantId);

    const variantGallery = gallery.filter(p => p.url && p.variantId === selectedVariantId);
    const defaultGallery = gallery.filter(p => p.url && !p.variantId);

    const urls = [
      ...variantFeatured.map(p => p.url),
      ...defaultFeatured.map(p => p.url),
      ...variantGallery.map(p => p.url),
      ...defaultGallery.map(p => p.url)
    ];

    const uniqueUrls = Array.from(new Set(urls)).filter(Boolean);

    if (uniqueUrls.length > 0) return uniqueUrls;

    return item.galleryImages.length > 0 ? item.galleryImages : (item.photo ? [item.photo] : []);
  }, [item, activeVariant?.id, photos]);

  // Reset image view index when variant changes
  useEffect(() => {
    setCurrent(0);
  }, [activeVariant?.id]);

  // Listen for color-triggered image switch
  useEffect(() => {
    const handler = (e: Event) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      if (index >= 0 && index < resolvedPhotos.length) {
        setDirection(index > current ? 1 : -1);
        setCurrent(index);
      }
    };
    window.addEventListener("gallery-set-image", handler);
    return () => window.removeEventListener("gallery-set-image", handler);
  }, [current, resolvedPhotos.length]);

  const prev = () => { setDirection(-1); setCurrent((c) => (c - 1 + resolvedPhotos.length) % resolvedPhotos.length); };
  const next = () => { setDirection(1); setCurrent((c) => (c + 1) % resolvedPhotos.length); };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const handleColorClick = (index: number) => {
    const clickedColor = resolvedColors[index];
    let targetIndex = index;

    if (item && item.gallery_raw) {
      const selectedVariantId = activeVariant?.id;
      const variantGallery = item.gallery_raw.filter(p => p.url && p.variantId === selectedVariantId);
      const defaultGallery = item.gallery_raw.filter(p => p.url && !p.variantId);
      const finalGallery = [...variantGallery, ...defaultGallery];
      
      const match = finalGallery.find(p => p.type === "color" && p.colorCode === clickedColor);
      if (match) {
        const foundIndex = resolvedPhotos.indexOf(match.url);
        if (foundIndex !== -1) {
          targetIndex = foundIndex;
        }
      }
    }

    if (targetIndex >= 0 && targetIndex < resolvedPhotos.length) {
      setDirection(targetIndex > current ? 1 : -1);
      setCurrent(targetIndex);
    }
    
    window.dispatchEvent(new CustomEvent("gallery-set-image", { detail: { index: targetIndex } }));
    setShowColors(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-hidden">
      {/* Main image */}
      <div className="relative aspect-4/3 overflow-hidden rounded-[1.75rem] bg-transparent select-none">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={current}
            src={resolvedPhotos[current]}
            alt={`${name} photo ${current + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-contain"
            loading={current === 0 ? "eager" : "lazy"}
            fetchPriority={current === 0 ? "high" : "auto"}
          />
        </AnimatePresence>

        {/* Prev / Next arrows */}
        {resolvedPhotos.length > 1 && (
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
              {resolvedPhotos.map((_, i) => (
                <button key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-5 bg-[#10855f] shadow-[0_0_8px_rgba(16,133,95,0.4)]" : "w-1.5 bg-slate-350 hover:bg-slate-400"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Floating action buttons (bottom-right) ── */}
        <div className="absolute bottom-12 right-3 flex flex-col gap-2 z-10">
          {/* Colors button */}
          {resolvedColors.length > 0 && (
            <button
              onClick={() => { setShowColors(!showColors); setShowThumbs(false); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold shadow-md transition-all ${
                showColors
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Palette size={13} />
              Colors
            </button>
          )}

          {/* Photos button */}
          {resolvedPhotos.length > 1 && (
            <button
              onClick={() => { setShowThumbs(!showThumbs); setShowColors(false); }}
              className={`flex md:hidden items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold shadow-md transition-all ${
                showThumbs
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
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
              className="absolute bottom-24 right-3 z-10 flex gap-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 shadow-xl"
            >
              {resolvedColors.map((hex, i) => {
                // Handle dualtone hexes (e.g. "ffffff/000000" or "ffffff,000000")
                const splitColors = hex.includes("/") ? hex.split("/") : hex.includes(",") ? hex.split(",") : [hex];
                const formattedColors = splitColors.map(c => c.trim().startsWith("#") ? c.trim() : `#${c.trim()}`);
                
                let backgroundStyle = "";
                if (formattedColors.length > 1) {
                   backgroundStyle = `linear-gradient(135deg, ${formattedColors[0]} 50%, ${formattedColors[1]} 50%)`;
                } else {
                  backgroundStyle = formattedColors[0];
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleColorClick(i)}
                    className={`h-7 w-7 rounded-lg border-2 transition-all hover:scale-110 ${
                      i === current ? "border-slate-900 shadow-md ring-2 ring-slate-100" : "border-slate-350 shadow-sm"
                    }`}
                    style={{ background: backgroundStyle }}
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
              className="absolute bottom-24 right-3 z-10 flex gap-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 p-2 shadow-xl max-w-[75%] overflow-x-auto"
            >
              {resolvedPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); setShowThumbs(false); }}
                  className={`shrink-0 h-12 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                    i === current ? "border-[#34ebb1] shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
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
      {resolvedPhotos.length > 1 && (
        <div className="hidden md:flex gap-3 overflow-x-auto pb-1">
          {resolvedPhotos.map((photo, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`shrink-0 h-20 w-28 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === current ? "border-[#34ebb1] shadow-md" : "border-transparent opacity-60 hover:opacity-100"
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
