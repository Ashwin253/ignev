//app/product/BatterySelector.tsx
"use client";

import { BatteryCharging, Zap, IndianRupee } from "lucide-react";

interface BatteryVariant {
  modelName?: string;
  capacity: string;
  range: string;
  charge: string;
  price?: string; // Standard
  price_baas?: string; // BAAS
}

interface BatterySelectorProps {
  standardVariants: BatteryVariant[];
  baasVariants: BatteryVariant[];
  hasBaas: boolean;
  selectedIndex: number;
  onSelect: (index: number) => void;
  showBaas: boolean;
  onToggleBaas: (value: boolean) => void;
}

export default function BatterySelector({
  standardVariants,
  baasVariants,
  hasBaas,
  selectedIndex,
  onSelect,
  showBaas,
  onToggleBaas
}: BatterySelectorProps) {

  const activeVariants = showBaas ? baasVariants : standardVariants;

  if (!activeVariants || activeVariants.length === 0) return null;

  const active = activeVariants[selectedIndex];

  // BAAS mode uses price_baas, Standard uses price
  const displayPrice = showBaas ? active.price_baas : active.price;
  const priceLabel = showBaas ? "BAAS Price" : "Ex-showroom";
  const canToggle = hasBaas && baasVariants.length > 0 && standardVariants.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Battery variants
        </p>
        {canToggle ? (
          <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => onToggleBaas(false)}
              className={`text- font-bold px-2.5 py-1 rounded-md transition-all ${!showBaas
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Standard
            </button>
            <button
              onClick={() => onToggleBaas(true)}
              className={`text- font-bold px-2.5 py-1 rounded-md transition-all ${showBaas
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              BAAS
            </button>
          </div>
        ) : (
          <span className="text- font-bold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
            Select to compare
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {activeVariants.map((v, i) => (
          <button
            key={`${showBaas ? 'baas' : 'std'}-${i}-${v.modelName || v.capacity}`}
            onClick={() => onSelect(i)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${selectedIndex === i
                ? showBaas
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100 scale-105"
                  : "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100 scale-105"
                : "bg-white border-slate-100 text-slate-600 hover:border-sky-200 hover:bg-sky-50"
              }`}
          >
            {v.modelName || `${v.capacity} kWh`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm group hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Zap size={14} className="group-hover:text-emerald-500 transition-colors" />
            <span className="text- font-bold uppercase tracking-tight">Est. Range</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              {active.range}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">km</span>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm group hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <BatteryCharging size={14} className="group-hover:text-amber-500 transition-colors" />
            <span className="text- font-bold uppercase tracking-tight">Charging</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              {active.charge || "N/A"}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">hrs</span>
          </div>
        </div>

        {displayPrice && (
          <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm group hover:border-sky-200 transition-all duration-300">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <IndianRupee size={14} className="group-hover:text-sky-500 transition-colors" />
              <span className="text- font-bold uppercase tracking-tight">{priceLabel}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                {displayPrice}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lakh</span>
            </div>
          </div>
        )}
      </div>

      {showBaas && (
        <div className="mt-4 text- text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Battery-as-a-Service: Separate battery subscription plan
        </div>
      )}
    </div>
  );
}