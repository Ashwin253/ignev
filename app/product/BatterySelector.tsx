"use client";

import { BatteryCharging, Zap, IndianRupee } from "lucide-react";

interface BatteryVariant {
  modelName?: string;
  capacity: string;
  range: string;
  charge: string; // in minutes
  price?: string;
  price_baas?: string; // ₹/km rate for BAAS
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

/** Format charge time: if < 60 show as minutes, else convert to hours */
function formatChargeTime(minutes: string | undefined): { value: string; unit: string } {
  if (!minutes) return { value: "N/A", unit: "" };
  const m = parseFloat(minutes);
  if (isNaN(m)) return { value: minutes, unit: "min" };
  if (m >= 60) {
    const hrs = m / 60;
    return { value: hrs.toFixed(1).replace(/\.0$/, ""), unit: "hrs" };
  }
  return { value: String(Math.round(m)), unit: "min" };
}

/** Format price: if > 10000 treat as rupees and convert to lakhs */
function formatPrice(price: string | undefined): { value: string; unit: string } | null {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return { value: price, unit: "L" };
  if (num > 10000) {
    // Full rupees → convert to lakhs
    return { value: (num / 100000).toFixed(2).replace(/\.00$/, ""), unit: "L" };
  }
  // Already in lakhs
  return { value: price, unit: "L" };
}

export default function BatterySelector({
  standardVariants,
  baasVariants,
  hasBaas,
  selectedIndex,
  onSelect,
  showBaas,
  onToggleBaas,
}: BatterySelectorProps) {
  const activeVariants = showBaas ? baasVariants : standardVariants;
  if (!activeVariants || activeVariants.length === 0) return null;

  const active = activeVariants[selectedIndex];
  const canToggle = hasBaas && baasVariants.length > 0 && standardVariants.length > 0;
  const chargeTime = formatChargeTime(active.charge);
  const priceDisplay = formatPrice(active.price);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Battery variants
        </p>
        {canToggle && (
          <div className="flex gap-0.5 bg-white rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => onToggleBaas(false)}
              className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                !showBaas ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => onToggleBaas(true)}
              className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                showBaas ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              BAAS
            </button>
          </div>
        )}
      </div>

      {/* Variant pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {activeVariants.map((v, i) => (
          <button
            key={`${showBaas ? "b" : "s"}-${i}`}
            onClick={() => onSelect(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              selectedIndex === i
                ? showBaas
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-sky-600 border-sky-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-sky-200"
            }`}
          >
            {v.modelName || `${v.capacity} kWh`}
          </button>
        ))}
      </div>

      {/* Specs grid */}
      <div className={`grid gap-2 ${showBaas ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        {/* Range */}
        <div className="rounded-xl bg-white border border-slate-100 p-3">
          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
            <Zap size={11} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Range</span>
          </div>
          <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
            {active.range || "—"}<span className="text-[10px] font-bold text-slate-400 ml-0.5">km</span>
          </p>
        </div>

        {/* Charge time — always show in BAAS, conditional in standard */}
        {(showBaas || chargeTime.value !== "N/A") && (
          <div className="rounded-xl bg-white border border-slate-100 p-3">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <BatteryCharging size={11} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Charge</span>
            </div>
            <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
              {chargeTime.value}<span className="text-[10px] font-bold text-slate-400 ml-0.5">{chargeTime.unit}</span>
            </p>
          </div>
        )}

        {/* BAAS: ₹/km rate */}
        {showBaas && active.price_baas ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
              <IndianRupee size={11} />
              <span className="text-[9px] font-bold uppercase tracking-wider">₹/km</span>
            </div>
            <p className="text-lg font-black text-emerald-700 leading-tight tabular-nums">
              ₹{active.price_baas}<span className="text-[10px] font-bold text-emerald-500 ml-0.5">/km</span>
            </p>
          </div>
        ) : priceDisplay ? (
          <div className="rounded-xl bg-white border border-slate-100 p-3">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <IndianRupee size={11} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Price</span>
            </div>
            <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
              {priceDisplay.value}<span className="text-[10px] font-bold text-slate-400 ml-0.5">{priceDisplay.unit}</span>
            </p>
          </div>
        ) : null}

        {/* BAAS: Base price (upfront) */}
        {showBaas && active.baseprice && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
              <IndianRupee size={11} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Upfront</span>
            </div>
            <p className="text-lg font-black text-emerald-700 leading-tight tabular-nums">
              ₹{formatPrice(active.baseprice)?.value}<span className="text-[10px] font-bold text-emerald-500 ml-0.5">{formatPrice(active.baseprice)?.unit}</span>
            </p>
          </div>
        )}
      </div>

      {showBaas && (
        <p className="mt-3 text-[10px] text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          BAAS: Pay base price upfront + per-km battery subscription
        </p>
      )}
    </div>
  );
}
