"use client";

import { Check } from "lucide-react";

interface ColorListProps {
  colors: string[];
  galleryImages?: string[];
  activeColor: string | null;
  onSelectColor: (hex: string, index: number) => void;
}

export default function ColorList({ colors, galleryImages = [], activeColor, onSelectColor }: ColorListProps) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm p-3 md:p-4 md:bg-slate-50 md:backdrop-blur-none">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2 md:mb-3 hidden md:block">
        Available colors
      </p>
      <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
        {colors.map((hex, i) => {
          const code = hex.startsWith("#") ? hex : `#${hex.replace("#", "")}`;
          const isActive = activeColor === code;

          return (
            <button
              key={i}
              onClick={() => onSelectColor(code, i)}
              className={`group relative transition-all duration-200 ${
                isActive ? "scale-110" : "hover:scale-105"
              }`}
              title={`${code} — click to view`}
            >
              {/* Color swatch */}
              <div
                className={`h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl border-2 shadow-sm transition-all ${
                  isActive
                    ? "border-slate-900 shadow-lg ring-2 ring-slate-200"
                    : "border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:shadow-md"
                }`}
                style={{ backgroundColor: code }}
              >
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                    <Check size={14} className="text-white drop-shadow" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {/* <p className="mt-2 text-[9px] text-slate-400">Tap a color to see the vehicle in that shade</p> */}
    </div>
  );
}
