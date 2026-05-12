"use client";

import { useState } from "react";
import { BatteryCharging, Gauge, Zap } from "lucide-react";

interface BatteryVariant {
  capacity: string;
  range: string;
  charge: string;
  price?: string;
}

interface BatterySelectorProps {
  variants: BatteryVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function BatterySelector({ variants, selectedIndex, onSelect }: BatterySelectorProps) {

  if (!variants || variants.length === 0) return null;

  const active = variants[selectedIndex];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Battery variants
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
          Select to compare
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {variants.map((v, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
              selectedIndex === i
                ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100 scale-105"
                : "bg-white border-slate-100 text-slate-600 hover:border-sky-200 hover:bg-sky-50"
            }`}
          >
            {v.capacity} kWh
          </button>
        ))}
      </div>

      {/* Details Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm group hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Zap size={14} className="group-hover:text-emerald-500 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Est. Range</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tight transition-all duration-300">
              {active.range}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">km</span>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm group hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <BatteryCharging size={14} className="group-hover:text-amber-500 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Charging</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tight transition-all duration-300">
              {active.charge}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
