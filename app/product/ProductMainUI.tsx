//app/product/ProductMainUI.tsx
"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import BatterySelector from "./BatterySelector";
import EnquiryTrigger from "./EnquiryTrigger";
import CompareButton from "./CompareButton";
import Link from "next/link";
import { ArrowLeft, Gauge, CheckCircle2, XCircle, Tag } from "lucide-react";
import ColorList from "./ColorList";
import type { EvListing } from "../lib/wordpress";

export default function ProductMainUI({ item, slug }: { item: EvListing, slug: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBaas, setShowBaas] = useState(false);

  // Track active color + photo
  const initialColor = item.colors?.[0] ? (item.colors[0].startsWith('#') ? item.colors[0] : `#${item.colors[0]}`) : null;
  const [activeColor, setActiveColor] = useState<string | null>(initialColor);
  const [mainPhoto, setMainPhoto] = useState(item.photo);

  const handleToggleBaas = (value: boolean) => {
    setShowBaas(value);
    setSelectedIndex(0);
  };

  // When color changes, try to find matching gallery image
  const handleColorSelect = (hex: string) => {
    setActiveColor(hex);
    // If you have color-specific images in gallery, match by filename
    // For now, just keep main photo. To make it work, name images like "red.jpg", "blue.jpg"
    // or store color->image mapping in ACF
    const colorName = hex.replace('#', '').toLowerCase();
    const matchingImg = item.galleryImages.find(img =>
      img.toLowerCase().includes(colorName) || img.toLowerCase().includes(activeColor?.replace('#', '').toLowerCase() || '')
    );
    if (matchingImg) setMainPhoto(matchingImg);
  };

  const cleanPrice = (val: string | undefined | null) => {
    if (!val) return "";
    return val.replace(/[₹,a-zA-Z\s]/g, "");
  };

  const activeVariants = showBaas ? item.baasVariants : item.batteryVariants;
  const activeVariant = activeVariants?.[selectedIndex];
  const displayPriceRaw = activeVariant?.price || item.prices?.[selectedIndex] || item.prices?.[0] || "10";

  const specificPriceStr = useMemo(() => {
    const raw = cleanPrice(displayPriceRaw);
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return raw;
    return value > 1000 ? (value / 100000).toFixed(2).replace(/\.00$/, "") : raw;
  }, [displayPriceRaw]);

  return (
    <div className="flex flex-col gap-5">
      {/* Main Product Image - updates with color */}
      {/* <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
        <Image
          src={mainPhoto}
          alt={`${item.brand} ${item.title} ${activeColor ? `in ${activeColor}` : ''}`}
          fill
          className="object-cover transition-all duration-500"
          priority
        />
        {activeColor && (
          <div
            className="absolute top-4 right-4 w-12 h-12 rounded-2xl border-4 border-white shadow-xl"
            style={{ backgroundColor: activeColor }}
          />
        )}
      </div> */}

      {/* HUGE Starting Price Display */}
      <div className="flex flex-col gap-4 mb-2">
        <div className={`inline-flex items-center gap-3 rounded-3xl px-6 py-4 text-white shadow-2xl transition-all duration-300 ${showBaas ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-emerald-200' : 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-slate-300'}`}>
          <Tag size={24} fill="currentColor" className={showBaas ? 'text-emerald-200' : 'text-slate-400'} />
          <div className="flex flex-col">
            <span className={`text-xs font-black uppercase tracking-widest ${showBaas ? 'text-emerald-200' : 'text-slate-400'}`}>
              {showBaas ? 'BAAS Starting Price' : 'Ex-Showroom Starting'}
            </span>
            <span className="text-4xl md:text-5xl font-black leading-none tracking-tight">
              ₹{specificPriceStr} <span className="text-2xl md:text-3xl">Lakh</span>
            </span>
          </div>
        </div>

        {item.prices.length > 1 && !showBaas && (
          <div className="flex items-center gap-2 px-1">
            <span className="text- font-black uppercase tracking-widest text-slate-400">Full Range:</span>
            <span className="text-base font-bold text-slate-600">₹{item.prices.join(" – ")} L</span>
          </div>
        )}
      </div>

      <BatterySelector
        standardVariants={item.batteryVariants}
        baasVariants={item.baasVariants}
        hasBaas={item.baas}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        showBaas={showBaas}
        onToggleBaas={handleToggleBaas}
      />

      {item.topSpeed !== null && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Gauge size={18} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Top speed</p>
            <p className="font-semibold text-slate-900">{item.topSpeed} km/h</p>
          </div>
        </div>
      )}

      {/* Colors - now clickable */}
      <ColorList
        colors={item.colors}
        activeColor={activeColor}
        onSelectColor={handleColorSelect}
      />

      {(item.pros.length > 0 || item.cons.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-600">Pros</p>
            {item.pros.length > 0 ? (
              <ul className="space-y-2">
                {item.pros.map((pro: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />{pro}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Pros will be updated soon.</p>
            )}
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-600">Cons</p>
            {item.cons.length > 0 ? (
              <ul className="space-y-2">
                {item.cons.map((con: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />{con}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Cons will be updated soon.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <EnquiryTrigger vehicle={`${item.brand} ${item.title}`} />
        <CompareButton slug={slug} name={`${item.brand} ${item.title}`} />
        <Link href="/catalog"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={15} /> Catalog
        </Link>
      </div>
    </div>
  );
}