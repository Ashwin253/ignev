"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Palette, LayoutGrid, Maximize, Play, ImageIcon, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProductSelection } from "../product/ProductSelectionProvider";
import type { EvListing } from "../lib/wordpress";

interface ProductGalleryProps {
  photos: string[];
  name: string;
  colors?: string[];
  item?: EvListing;
}

function getEmbedUrl(url: string) {
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
      } else {
        videoId = new URL(url).searchParams.get("v") || "";
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&mute=1` : null;
    }
    if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1` : null;
    }
  } catch (e) {
    return null;
  }
  return null;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute resolved list of photos based on selected variant
  const resolvedPhotos = useMemo(() => {
    if (!item) return photos;

    const selectedVariantId = activeVariant?.id;
    const selectedVariantName = activeVariant?.modelName;

    const featured = item.featured_photos || [];
    const gallery = item.gallery_raw || [];

    const variantFeatured = featured.filter(p => 
      p.url && 
      ((selectedVariantId && p.variantId === selectedVariantId) || 
       (!p.variantId && selectedVariantName && p.variantName === selectedVariantName))
    );
    const defaultFeatured = featured.filter(p => p.url && !p.variantId && !p.variantName);

    const variantGallery = gallery.filter(p => 
      p.url && 
      ((selectedVariantId && p.variantId === selectedVariantId) || 
       (!p.variantId && selectedVariantName && p.variantName === selectedVariantName))
    );
    const defaultGallery = gallery.filter(p => p.url && !p.variantId && !p.variantName);

    const mainPhotoIsForOtherVariant = featured.some(p => 
      p.url === item.photo && (
        (p.variantId && p.variantId !== selectedVariantId) ||
        (p.variantName && p.variantName !== selectedVariantName)
      )
    ) || gallery.some(p => 
      p.url === item.photo && (
        (p.variantId && p.variantId !== selectedVariantId) ||
        (p.variantName && p.variantName !== selectedVariantName)
      )
    );

    const urls: string[] = [];
    if (!mainPhotoIsForOtherVariant && item.photo) {
      urls.push(item.photo);
    }
    variantFeatured.forEach(p => p.url && urls.push(p.url));
    defaultFeatured.forEach(p => p.url && urls.push(p.url));
    variantGallery.forEach(p => p.url && urls.push(p.url));
    defaultGallery.forEach(p => p.url && urls.push(p.url));

    const uniqueUrls = Array.from(new Set(urls));
    let finalUrls = uniqueUrls.length > 0 ? uniqueUrls : Array.from(new Set([
      item.photo,
      ...(item.galleryImages.length > 0 ? item.galleryImages : [])
    ])).filter(Boolean);

    const vUrl = item?.video_links?.[0]?.url;
    if (vUrl) {
      finalUrls.push("video::" + vUrl);
    }

    return finalUrls;
  }, [item, activeVariant?.id, activeVariant?.modelName, photos]);

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
      const selectedVariantName = activeVariant?.modelName;
      const variantGallery = item.gallery_raw.filter(p => 
        p.url && 
        ((selectedVariantId && p.variantId === selectedVariantId) || 
         (!p.variantId && selectedVariantName && p.variantName === selectedVariantName))
      );
      const defaultGallery = item.gallery_raw.filter(p => p.url && !p.variantId && !p.variantName);
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

  const backgrounds = [
    "/listingbackgroundsecond.jpg",
    "/listingbackgroundthird.jpg",
    "/listingbackgroundforth.jpg",
    "/listingbackgroundfifth.jpg"
  ];
  const currentBg = backgrounds[current % backgrounds.length];

  const currentMedia = resolvedPhotos[current] || "";
  const isVideo = currentMedia.startsWith("video::");
  const actualVideoUrl = isVideo ? currentMedia.replace("video::", "") : "";
  const isYoutubeOrVimeo = isVideo && (actualVideoUrl.includes("youtube.com") || actualVideoUrl.includes("youtu.be") || actualVideoUrl.includes("vimeo.com"));
  const isDirectVideo = isVideo && !isYoutubeOrVimeo;

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-hidden">
      {/* Main image */}
      <div 
        className="relative aspect-4/3 overflow-hidden rounded-[1.75rem] bg-transparent select-none ring-1 ring-zinc-200/60 shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-black"
        style={{ backgroundImage: `url('${currentBg}')`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-[#f0fdf9]/85 backdrop-blur-[1px]" />
        
        {mounted && isFullscreen && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute top-4 right-4 z-[99999] flex items-center gap-3">
              {isVideo && actualVideoUrl && (
                <a 
                  href={actualVideoUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/40 backdrop-blur-md flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} /> Play at source
                </a>
              )}
              <button onClick={() => setIsFullscreen(false)} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 backdrop-blur-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <AnimatePresence initial={false} custom={direction} mode="wait">
              {!isVideo ? (
                <motion.img
                  key={`fullscreen-${current}`}
                  src={currentMedia}
                  alt={`${name} photo ${current + 1}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-contain p-10"
                  loading="eager"
                  fetchPriority="high"
                />
              ) : (
                <motion.div
                  key={`fullscreen-${current}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full bg-black flex items-center justify-center p-10"
                >
                  {isDirectVideo && (
                    <video src={actualVideoUrl} autoPlay muted loop playsInline className="h-full w-full object-contain pointer-events-none" />
                  )}
                  {isYoutubeOrVimeo && (
                    getEmbedUrl(actualVideoUrl) ? (
                      <iframe src={getEmbedUrl(actualVideoUrl)!} className="h-full w-full border-0 pointer-events-none" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" tabIndex={-1} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white">Invalid Video URL</div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {resolvedPhotos.length > 1 && (
              <>
                <button onClick={prev} aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-3 shadow-md bg-white/20 text-white hover:bg-white/40 transition-colors z-[99999]">
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button onClick={next} aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-3 shadow-md bg-white/20 text-white hover:bg-white/40 transition-colors z-[99999]">
                  <ChevronRight size={24} className="text-white" />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[99999]">
                  {resolvedPhotos.map((_, i) => (
                    <button key={i}
                      onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                      className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white shadow-lg" : "w-2 bg-white/40 hover:bg-white/70"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>,
          document.body
        )}

        <AnimatePresence initial={false} custom={direction} mode="wait">
          {!isVideo ? (
            <motion.img
              key={current}
              src={currentMedia}
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
          ) : (
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full bg-black z-10"
            >
              {isDirectVideo && (
                <video src={actualVideoUrl} autoPlay muted loop playsInline className="h-full w-full object-contain pointer-events-none" />
              )}
              {isYoutubeOrVimeo && (
                getEmbedUrl(actualVideoUrl) ? (
                  <iframe src={getEmbedUrl(actualVideoUrl)!} className="h-full w-full border-0 pointer-events-none" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" tabIndex={-1} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white">Invalid Video URL</div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prev / Next arrows */}
        {resolvedPhotos.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors text-slate-700">
              <ChevronLeft size={20} className="text-slate-700" />
            </button>
            <button onClick={next} aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors text-slate-700">
              <ChevronRight size={20} className="text-slate-700" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {resolvedPhotos.map((_, i) => (
                <button key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-5 bg-[#10855f] shadow-[0_0_8px_rgba(16,133,95,0.4)]" : "w-1.5 bg-slate-350 hover:bg-slate-400"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Enlarge icon (bottom-right Mobile) ── */}
        <button onClick={() => setIsFullscreen(true)} className="md:hidden absolute bottom-3 right-3 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors z-10">
          <Maximize size={16} className="text-slate-700" />
        </button>

        {/* ── Floating action buttons (bottom-right Desktop) ── */}
        <div className="hidden md:flex absolute bottom-3 right-3 flex-col items-end gap-2 z-10">
          {/* Enlarge button */}
          <button onClick={() => setIsFullscreen(true)} className="rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white transition-colors">
            <Maximize size={16} className="text-slate-700" />
          </button>

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

          {/* Photos button (Usually hidden on md, but keeping logic consistent) */}
          {resolvedPhotos.length > 1 && (
            <button
              onClick={() => { setShowThumbs(!showThumbs); setShowColors(false); }}
              className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold shadow-md transition-all ${
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

        {/* ── Desktop Popups (Inside image container) ── */}
        <AnimatePresence>
          {showColors && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="hidden md:flex absolute bottom-24 right-3 z-10 gap-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 shadow-xl"
            >
              {resolvedColors.map((hex, i) => {
                const splitColors = hex.includes("/") ? hex.split("/") : hex.includes(",") ? hex.split(",") : [hex];
                const formattedColors = splitColors.map(c => c.trim().startsWith("#") ? c.trim() : `#${c.trim()}`);
                let backgroundStyle = formattedColors.length > 1 ? `linear-gradient(135deg, ${formattedColors[0]} 50%, ${formattedColors[1]} 50%)` : formattedColors[0];

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

        <AnimatePresence>
          {showThumbs && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="hidden md:flex absolute bottom-24 right-3 z-10 gap-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 p-2 shadow-xl max-w-[75%] overflow-x-auto"
            >
              {resolvedPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); setShowThumbs(false); }}
                  className={`shrink-0 h-12 w-16 overflow-hidden rounded-lg border-2 bg-transparent transition-all ${
                    i === current ? "border-[#34ebb1] shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  {photo.startsWith("video::") ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <Play size={20} className="text-white opacity-80" />
                    </div>
                  ) : (
                    <img src={photo} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile action buttons below photo ── */}
      <div className="flex md:hidden flex-col gap-2 relative z-10 px-1">
        <div className="flex items-center gap-3">
          {resolvedColors.length > 0 && (
            <button
              onClick={() => { setShowColors(!showColors); setShowThumbs(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all ${
                showColors
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Palette size={14} />
              Colors
            </button>
          )}

          {resolvedPhotos.length > 1 && (
            <button
              onClick={() => { setShowThumbs(!showThumbs); setShowColors(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all ${
                showThumbs
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <LayoutGrid size={14} />
              Photos
            </button>
          )}
        </div>

        {/* Mobile Popups (rendered inline below the buttons) */}
        <AnimatePresence>
          {showColors && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 rounded-2xl bg-white border border-slate-200 p-3 shadow-sm overflow-hidden"
            >
              {resolvedColors.map((hex, i) => {
                const splitColors = hex.includes("/") ? hex.split("/") : hex.includes(",") ? hex.split(",") : [hex];
                const formattedColors = splitColors.map(c => c.trim().startsWith("#") ? c.trim() : `#${c.trim()}`);
                let backgroundStyle = formattedColors.length > 1 ? `linear-gradient(135deg, ${formattedColors[0]} 50%, ${formattedColors[1]} 50%)` : formattedColors[0];

                return (
                  <button
                    key={i}
                    onClick={() => handleColorClick(i)}
                    className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                      i === current ? "border-slate-900 shadow-md ring-2 ring-slate-100" : "border-slate-200 shadow-sm"
                    }`}
                    style={{ background: backgroundStyle }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showThumbs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 rounded-2xl bg-white border border-slate-200 p-3 shadow-sm overflow-x-auto"
            >
              {resolvedPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); setShowThumbs(false); }}
                  className={`shrink-0 h-14 w-20 overflow-hidden rounded-xl border-2 bg-transparent transition-all ${
                    i === current ? "border-[#34ebb1] shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  {photo.startsWith("video::") ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <Play size={24} className="text-white opacity-80" />
                    </div>
                  ) : (
                    <img src={photo} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  )}
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
              className={`shrink-0 h-20 w-28 overflow-hidden rounded-xl border-2 bg-transparent transition-all duration-200 ${
                i === current ? "border-[#34ebb1] shadow-md" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {photo.startsWith("video::") ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <Play size={28} className="text-white opacity-80" />
                </div>
              ) : (
                <img src={photo} alt={`${name} thumbnail ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
