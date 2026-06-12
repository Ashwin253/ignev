"use client";

import { useState, useMemo } from "react";
import { BatteryCharging, Zap, IndianRupee, HelpCircle, X, MapPin } from "lucide-react";

interface BatteryVariant {
  id?: string;
  modelName?: string;
  capacity: string;
  range: string;
  charge: string; // in minutes
  price?: string;
  price_baas?: string; // ₹/km rate for BAAS
  baseprice?: string; // BAAS upfront base price
  battery_subs?: string; // Battery subscription price fallback
}

interface BatterySelectorProps {
  standardVariants: BatteryVariant[];
  baasVariants: BatteryVariant[];
  hasBaas: boolean;
  selectedIndex: number;
  onSelect: (index: number) => void;
  showBaas: boolean;
  onToggleBaas: (value: boolean) => void;
  hideVariantSelector?: boolean;
  cityPricing?: Array<{
    id?: string;
    location_name: string;
    location_type: "City" | "District";
    showroom_price: string;
    on_road_price: string;
    variant_id?: string | null;
  }>;
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
  hideVariantSelector = false,
  cityPricing = [],
}: BatterySelectorProps) {
  const [showHelp, setShowHelp] = useState(false);
  const activeVariants = showBaas ? baasVariants : standardVariants;
  if (!activeVariants || activeVariants.length === 0) return null;

  const active = activeVariants[selectedIndex];
  const canToggle = hasBaas && baasVariants.length > 0 && standardVariants.length > 0;
  const chargeTime = formatChargeTime(active.charge);
  const priceDisplay = formatPrice(active.price);

  // Filter city pricing for active variant
  const activeVarName = active.modelName || "";
  const activeVarId = active.id || "";

  const relevantPricing = useMemo(() => {
    return (cityPricing || []).filter(p => {
      const pVariant = p.variant_id;
      if (!pVariant || pVariant === "Main Model / Base") {
        return !activeVarName || activeVarName === "Main Model / Base";
      }
      const isMatchById = activeVarId && String(pVariant) === String(activeVarId);
      const isMatchByName = activeVarName && String(pVariant).toLowerCase().trim() === activeVarName.toLowerCase().trim();
      return isMatchById || isMatchByName;
    });
  }, [cityPricing, activeVarName, activeVarId]);

  const availableCities = useMemo(() => {
    return relevantPricing.map(p => p.location_name).filter(Boolean);
  }, [relevantPricing]);

  const [selectedCity, setSelectedCity] = useState<string>("");

  const activeCity = selectedCity && availableCities.includes(selectedCity)
    ? selectedCity
    : availableCities[0] || "";

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Battery variants
          </p>
          {canToggle && (
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center justify-center h-4 w-4 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
            >
              <HelpCircle size={10} />
            </button>
          )}
        </div>
        {canToggle && (
          <div className="flex gap-0.5 bg-slate-200 rounded-lg p-0.5 border border-slate-300">
            <button
              onClick={() => onToggleBaas(false)}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                !showBaas ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Included <BatteryCharging size={12} />
            </button>
            <button
              onClick={() => onToggleBaas(true)}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                showBaas ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Excluded <BatteryCharging size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Help popup */}
      {showHelp && (
        <div className="mb-3 rounded-xl border border-slate-300 bg-white p-3 text-[11px] text-slate-600 leading-relaxed relative">
          <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
            <X size={12} />
          </button>
          <p className="font-bold text-slate-800 mb-1.5">What does this mean?</p>
          <div className="space-y-1.5">
            <p><span className="font-bold text-sky-600">🔋 Included</span> — Battery is part of the vehicle price. You own it outright.</p>
            <p><span className="font-bold text-emerald-600">🔋 Excluded</span> — Battery is rented separately. Lower upfront cost, you pay per km or monthly for battery usage. Batteries are swappable/replaceable.</p>
          </div>
        </div>
      )}

      {/* Variant selector — always dropdown */}
      {!hideVariantSelector && activeVariants.length > 1 && (
        <div className="mb-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5">
            <BatteryCharging size={14} className={showBaas ? "text-emerald-500" : "text-sky-500"} />
            <select
              value={selectedIndex}
              onChange={(e) => onSelect(Number(e.target.value))}
              className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              {activeVariants.map((v, i) => (
                <option key={`${showBaas ? "b" : "s"}-${i}`} value={i}>
                  {v.modelName || `${v.capacity} kWh`}
                </option>
              ))}
            </select>
            <svg className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </label>
        </div>
      )}

      {/* Specs grid */}
      {(() => {
        const hasOnRoad = availableCities.length > 0;
        const totalCards = 2 + 
          (showBaas || chargeTime.value !== "N/A" ? 1 : 0) + 
          (showBaas && active.baseprice ? 1 : 0) + 
          (hasOnRoad ? 1 : 0);
        const gridCols = totalCards >= 4 ? "grid-cols-2 sm:grid-cols-4" : totalCards === 3 ? "grid-cols-3" : "grid-cols-2";

        return (
          <div className={`grid gap-2 ${gridCols}`}>
            {/* Range */}
            <div className="rounded-xl bg-white border border-slate-300 p-3">
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
              <div className="rounded-xl bg-white border border-slate-300 p-3">
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
              <div className="rounded-xl bg-emerald-100 border border-emerald-300 p-3">
                <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
                  <IndianRupee size={11} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">₹/km</span>
                </div>
                <p className="text-lg font-black text-emerald-700 leading-tight tabular-nums">
                  ₹{active.price_baas}<span className="text-[10px] font-bold text-emerald-500 ml-0.5">/km</span>
                </p>
              </div>
            ) : priceDisplay ? (
              <div className="rounded-xl bg-white border border-slate-300 p-3">
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
              <div className="rounded-xl bg-emerald-100 border border-emerald-300 p-3">
                <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
                  <IndianRupee size={11} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Upfront</span>
                </div>
                <p className="text-lg font-black text-emerald-700 leading-tight tabular-nums">
                  ₹{formatPrice(active.baseprice)?.value}<span className="text-[10px] font-bold text-emerald-500 ml-0.5">{formatPrice(active.baseprice)?.unit}</span>
                </p>
              </div>
            )}

            {/* On-Road Price */}
            {hasOnRoad && (
              <div className="rounded-xl bg-sky-50 border border-sky-300 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-sky-600 mb-0.5">
                  <div className="flex items-center gap-1">
                    <MapPin size={11} className="text-sky-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">On-Road</span>
                  </div>
                  {availableCities.length > 1 && (
                    <select
                      value={activeCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="bg-transparent text-[9px] font-bold text-sky-700 outline-none cursor-pointer border-none p-0 max-w-[65px] text-right"
                    >
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="text-lg font-black text-slate-900 leading-tight tabular-nums mt-1">
                  {(() => {
                    const match = relevantPricing.find(p => p.location_name === activeCity);
                    if (!match || !match.on_road_price) return "—";
                    return `₹${match.on_road_price}`;
                  })()}
                  <span className="text-[10px] font-bold text-slate-400 ml-0.5">L</span>
                </p>
                {availableCities.length <= 1 && activeCity && (
                  <span className="text-[8px] font-bold text-slate-400 leading-none mt-0.5 truncate">{activeCity}</span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {showBaas && (
        <p className="mt-3 text-[10px] text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          BAAS: Pay base price upfront + per-km battery subscription
        </p>
      )}
    </div>
  );
}
