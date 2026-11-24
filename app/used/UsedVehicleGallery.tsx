"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { RotateCw, Maximize2, X, ChevronLeft, ChevronRight, Eye, ShieldCheck, Sparkles, Image as ImageIcon, Info } from "lucide-react";
import type { UsedVehicleMediaImage } from "../lib/used-vehicles";
import "@cloudimage/360-view/css";

const Vehicle360Viewer = dynamic(() => import("../components/Vehicle360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 sm:h-96 w-full items-center justify-center bg-slate-100 text-xs font-bold text-slate-500">
      <RotateCw className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
      Loading 360° virtual turntable...
    </div>
  ),
});

interface GalleryItem {
  url: string;
  category: "outside" | "inside" | "tyres" | "details" | "all";
  title?: string;
  description?: string;
}

interface UsedVehicleGalleryProps {
  title: string;
  images360: string[];
  galleryImages: string[];
  photo: string;
  mediaImages?: UsedVehicleMediaImage[];
}

export default function UsedVehicleGallery({
  title,
  images360 = [],
  galleryImages = [],
  photo,
  mediaImages = [],
}: UsedVehicleGalleryProps) {
  const valid360Frames = (images360 || []).filter(Boolean);
  const has360 = valid360Frames.length >= 4;

  // Build unified items with categorized metadata
  const items: GalleryItem[] = useMemo(() => {
    const list: GalleryItem[] = [];
    const seenUrls = new Set<string>();

    // 1. Add categorized media images first (they contain rich descriptions)
    if (Array.isArray(mediaImages) && mediaImages.length > 0) {
      mediaImages.forEach((m) => {
        if (m.url && !seenUrls.has(m.url)) {
          seenUrls.add(m.url);
          list.push({
            url: m.url,
            category: m.category || "outside",
            title: m.title,
            description: m.description,
          });
        }
      });
    }

    // 2. Add main cover if not seen
    if (photo && !seenUrls.has(photo)) {
      seenUrls.add(photo);
      list.push({
        url: photo,
        category: "outside",
        title: "Main Exterior Profile",
        description: "Official vehicle exterior profile view.",
      });
    }

    // 3. Add any additional gallery images
    (galleryImages || []).forEach((img, idx) => {
      if (img && !seenUrls.has(img)) {
        seenUrls.add(img);
        list.push({
          url: img,
          category: "outside",
          title: `Vehicle View ${idx + 1}`,
          description: "Inspected vehicle photograph.",
        });
      }
    });

    if (list.length === 0) {
      list.push({
        url: "/vehicles/tatanexonev.webp",
        category: "outside",
        title: "Vehicle View",
        description: "Standard model photo.",
      });
    }

    return list;
  }, [mediaImages, photo, galleryImages]);

  // Counts by category
  const outsideCount = items.filter((i) => i.category === "outside").length;
  const insideCount = items.filter((i) => i.category === "inside").length;

  const [activeTab, setActiveTab] = useState<"360" | "all" | "outside" | "inside">(
    has360 ? "360" : insideCount > 0 ? "outside" : "all"
  );
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Filtered photos based on active category
  const displayPhotos = useMemo(() => {
    if (activeTab === "360") return items;
    if (activeTab === "outside") return items.filter((i) => i.category === "outside" || i.category === "tyres");
    if (activeTab === "inside") return items.filter((i) => i.category === "inside");
    return items;
  }, [items, activeTab]);

  const activePhoto = displayPhotos[selectedPhotoIndex] || displayPhotos[0] || items[0];

  const turntableFrames = valid360Frames.length >= 8
    ? valid360Frames.slice(0, 8)
    : valid360Frames.length === 4
    ? valid360Frames
    : items.map((i) => i.url).slice(0, 8);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Top Gallery View Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {has360 && (
            <button
              type="button"
              onClick={() => setActiveTab("360")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                activeTab === "360"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <RotateCw size={13} className="text-volt" />
              <span>360° Tour</span>
            </button>
          )}

          {outsideCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("outside");
                setSelectedPhotoIndex(0);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                activeTab === "outside"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <span>Outside ({outsideCount})</span>
            </button>
          )}

          {insideCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("inside");
                setSelectedPhotoIndex(0);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                activeTab === "inside"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <span>Inside ({insideCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSelectedPhotoIndex(0);
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <ImageIcon size={13} />
            <span>All ({items.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFullscreenOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 shadow-xs"
          aria-label="Fullscreen view"
        >
          <Maximize2 size={12} />
          <span className="hidden sm:inline">Fullscreen</span>
        </button>
      </div>

      {/* Main Display Area */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 flex items-center justify-center overflow-hidden">
        {activeTab === "360" && has360 ? (
          <div className="relative h-full w-full flex flex-col justify-center">
            <Vehicle360Viewer images={turntableFrames} />
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-xs flex items-center gap-1.5">
              <RotateCw size={12} className="text-volt" />
              <span>Drag or use arrow buttons to rotate 360°</span>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            <Image
              src={activePhoto?.url || items[0].url}
              alt={activePhoto?.title || title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />

            {/* Photo Navigation Arrows */}
            {displayPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : displayPhotos.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-2 text-slate-800 shadow-md hover:bg-white transition"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((prev) => (prev < displayPhotos.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-2 text-slate-800 shadow-md hover:bg-white transition"
                  aria-label="Next photo"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Photo Count Tag */}
            <div className="absolute top-3 right-3 z-10 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
              {selectedPhotoIndex + 1} / {displayPhotos.length}
            </div>

            {/* Inside/Outside Category Badge & Description Overlay */}
            {(activePhoto?.title || activePhoto?.description) && (
              <div className="absolute bottom-3 left-3 right-3 z-10 rounded-2xl bg-slate-950/80 p-3 sm:p-3.5 text-white shadow-lg backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ${
                      activePhoto.category === "inside"
                        ? "bg-indigo-600"
                        : activePhoto.category === "outside"
                        ? "bg-emerald-700"
                        : activePhoto.category === "tyres"
                        ? "bg-amber-600"
                        : "bg-slate-700"
                    }`}
                  >
                    {activePhoto.category === "inside" ? "Inside (Interior)" : activePhoto.category === "outside" ? "Outside (Exterior)" : activePhoto.category}
                  </span>
                  {activePhoto.title && (
                    <h5 className="font-extrabold text-xs sm:text-sm text-white line-clamp-1">
                      {activePhoto.title}
                    </h5>
                  )}
                </div>

                {activePhoto.description && (
                  <p className="mt-1 text-[11px] sm:text-xs text-slate-200 line-clamp-2 leading-relaxed">
                    {activePhoto.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {displayPhotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-slate-50/50 p-3">
          {has360 && (
            <button
              type="button"
              onClick={() => setActiveTab("360")}
              className={`relative flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-xl border text-[10px] font-extrabold transition ${
                activeTab === "360"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <RotateCw size={16} className="text-emerald-700 mb-0.5" />
              <span>360° View</span>
            </button>
          )}

          {displayPhotos.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedPhotoIndex(idx);
              }}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                selectedPhotoIndex === idx && activeTab !== "360"
                  ? "border-emerald-600 ring-2 ring-emerald-500"
                  : "border-slate-200 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={item.url} alt={item.title || `Thumb ${idx + 1}`} fill className="object-cover" />
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.2 capitalize">
                {item.category}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal with Description */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 text-white">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h4 className="text-sm font-bold">{title}</h4>
              {activePhoto && (
                <p className="text-xs text-slate-400 capitalize">
                  {activePhoto.category}: {activePhoto.title}
                </p>
              )}
            </div>
            <button
              onClick={() => setFullscreenOpen(false)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
              aria-label="Close fullscreen"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative flex-1 w-full flex items-center justify-center">
            {activeTab === "360" && has360 ? (
              <Vehicle360Viewer images={turntableFrames} />
            ) : (
              <div className="relative h-full w-full max-h-[80vh]">
                <Image
                  src={activePhoto?.url || items[0].url}
                  alt="Fullscreen view"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {activePhoto?.description && activeTab !== "360" && (
            <div className="mt-2 rounded-xl bg-white/10 p-3 text-xs text-slate-200 text-center max-w-2xl mx-auto">
              <strong>{activePhoto.title}:</strong> {activePhoto.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
