//app/product/ColorList.tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ColorListProps {
  colors: string[];
  activeColor: string | null;
  onSelectColor: (hex: string) => void;
}

export default function ColorList({ colors, activeColor, onSelectColor }: ColorListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleClick = (hex: string, index: number) => {
    const code = hex.startsWith('#') ? hex : `#${hex.replace("#", "")}`;
    onSelectColor(code);
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!colors || colors.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Available colors
        </p>
        <span className="text- text-slate-400 font-medium italic">
          Click to select + copy
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        {colors.map((hex, i) => {
          const code = hex.startsWith('#') ? hex : `#${hex.replace("#", "")}`;
          const isCopied = copiedIndex === i;
          const isActive = activeColor === code;

          return (
            <button
              key={i}
              onClick={() => handleClick(hex, i)}
              className={`group relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300 active:scale-90 ${isActive
                  ? "border-slate-900 scale-110 shadow-xl ring-4 ring-slate-200"
                  : isCopied
                    ? "border-emerald-500 scale-110 shadow-lg shadow-emerald-100"
                    : "border-white shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-slate-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1"
                }`}
              style={{ backgroundColor: code }}
              title={`${code} - Click to select`}
            >
              <div className={`absolute inset-0 flex flex-col items-center justify-center rounded- transition-all duration-300 ${isCopied
                  ? "bg-emerald-500/90"
                  : isActive
                    ? "bg-black/20"
                    : "bg-black/0 group-hover:bg-black/10"
                }`}>
                {isCopied ? (
                  <div className="flex flex-col items-center">
                    <Check size={18} className="text-white" />
                    <span className="text- font-black uppercase tracking-tighter text-white">Copied</span>
                  </div>
                ) : isActive ? (
                  <Check size={18} className="text-white drop-shadow-lg" />
                ) : (
                  <Copy size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}