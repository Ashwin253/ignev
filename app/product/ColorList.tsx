"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function ColorList({ colors }: { colors: string[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (hex: string, index: number) => {
    const code = `#${hex.replace("#", "")}`;
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
        <span className="text-[10px] text-slate-400 font-medium italic">
          Click to copy hex
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        {colors.map((hex, i) => {
          const code = `#${hex.replace("#", "")}`;
          const isCopied = copiedIndex === i;
          
          return (
            <button
              key={i}
              onClick={() => handleCopy(hex, i)}
              className={`group relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300 active:scale-90 ${
                isCopied 
                  ? "border-emerald-500 scale-110 shadow-lg shadow-emerald-100" 
                  : "border-white shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-slate-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1"
              }`}
              style={{ backgroundColor: code }}
              title={code}
            >
              <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-[14px] transition-all duration-300 ${
                isCopied ? "bg-emerald-500/90" : "bg-black/0 group-hover:bg-black/10"
              }`}>
                {isCopied ? (
                  <div className="flex flex-col items-center">
                    <Check size={18} className="text-white" />
                    <span className="text-[7px] font-black uppercase tracking-tighter text-white">Copied</span>
                  </div>
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
