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
  usage_type?: string | null;
  continuing_variant_id?: string | null;
  baas_monthly_rental?: string;
  launch_date?: string | null;
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
  hideCityDropdown?: boolean;
  hideOnRoad?: boolean;
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

function isFutureVariant(v: BatteryVariant): boolean {
  if (v.usage_type && ["Coming Soon", "Announced", "Concept", "Facelift"].includes(v.usage_type)) {
    return true;
  }
  if (!v.launch_date) return false;
  const clean = v.launch_date.trim().toLowerCase();
  if (["tba", "coming soon", "concept", "announced", "facelift"].some(k => clean.includes(k))) return true;
  const d = new Date(v.launch_date);
  if (isNaN(d.getTime())) {
    const matches = v.launch_date.match(/\d{4}/);
    if (matches) {
      const year = parseInt(matches[0]);
      return year > new Date().getFullYear();
    }
    return false;
  }
  return d > new Date();
}

function rupees(v: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v));
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
  hideCityDropdown = false,
  hideOnRoad = false,
  cityPricing = [],
}: BatterySelectorProps) {
  const [showHelp, setShowHelp] = useState(false);
  const activeVariants = showBaas ? baasVariants : standardVariants;
  if (!activeVariants || activeVariants.length === 0) return null;

  const active = activeVariants[selectedIndex];
  const canToggle = hasBaas && baasVariants.length > 0 && standardVariants.length > 0;
  const chargeTime = formatChargeTime(active.charge);
  const priceDisplay = formatPrice(active.price);
  const isFuture = isFutureVariant(active);

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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner text-slate-900 flex flex-col gap-4">
      {/* Mode Selector Tabs */}
      {canToggle && (
        <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              onToggleBaas(false);
              onSelect(0);
            }}
            className={`py-3 text-xs font-bold rounded-lg transition-all ${
              !showBaas 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Standard Plan (With Battery)
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleBaas(true);
              onSelect(0);
            }}
            className={`py-3 text-xs font-bold rounded-lg transition-all ${
              showBaas 
                ? "bg-[#a5e6d1] text-slate-955 font-extrabold shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            BaaS Plan (Battery Rental)
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
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
      </div>

      {/* Help popup */}
      {showHelp && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-750 leading-relaxed relative shadow-md">
          <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
            <X size={12} />
          </button>
          <p className="font-bold text-slate-900 mb-1.5">What does this mean?</p>
          <div className="space-y-1.5">
            <p><span className="font-extrabold bg-[#a5e6d1] text-slate-955 px-1 py-0.5 rounded text-[9px] mr-1">🔋 Included</span> — Battery is part of the vehicle price. You own it outright.</p>
            <p><span className="font-extrabold bg-slate-200 text-slate-705 px-1 py-0.5 rounded text-[9px] mr-1">🔋 Excluded</span> — Battery is rented separately. Lower upfront cost, you pay per km or monthly for battery usage.</p>
          </div>
        </div>
      )}

      {/* Variant selector — always dropdown */}
      {!hideVariantSelector && activeVariants.length > 1 && (
        <div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
            <BatteryCharging size={14} className="text-brand" />
            <select
              value={selectedIndex}
              onChange={(e) => onSelect(Number(e.target.value))}
              className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              {activeVariants.map((v, i) => (
                <option key={`${showBaas ? "b" : "s"}-${i}`} value={i} className="bg-white text-slate-955">
                  {v.modelName || `${v.capacity} kWh`}
                </option>
              ))}
            </select>
            <svg className="h-4 w-4 text-slate-500 shrink-0 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </label>
        </div>
      )}

      {/* Specs grid */}
      {(() => {
        const hasOnRoad = !hideOnRoad && availableCities.length > 0;
        const totalCardsRow1 = 4 + (hasOnRoad ? 1 : 0);
        const gridColsRow1 = totalCardsRow1 === 5 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4";

        return (
          <div className="flex flex-col gap-2">
            {/* First Row */}
            <div className={`grid gap-2 ${gridColsRow1}`}>
              {/* Pricing (First card) */}
              {!showBaas ? (
                <div className="rounded-xl bg-[#a5e6d1] border border-[#a5e6d1] p-3 shadow-xs">
                  <div className="flex items-center gap-1 text-slate-850 mb-0.5">
                    <IndianRupee size={11} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Price</span>
                  </div>
                  <p className={`font-black text-slate-955 leading-tight tabular-nums ${priceDisplay ? "text-lg" : "text-xs"}`}>
                    {priceDisplay ? (
                      <>
                        {priceDisplay.value}<span className="text-[10px] font-bold text-slate-850 ml-0.5">{priceDisplay.unit}</span>
                      </>
                    ) : isFuture ? (
                      "Coming Soon"
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-[#a5e6d1] border border-[#a5e6d1] p-3 shadow-xs">
                  <div className="flex items-center gap-1 text-slate-855 mb-0.5">
                    <IndianRupee size={11} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Upfront</span>
                  </div>
                  <p className={`font-black text-slate-955 leading-tight tabular-nums ${active.baseprice ? "text-lg" : "text-xs"}`}>
                    {active.baseprice ? (
                      <>
                        {formatPrice(active.baseprice)?.value}<span className="text-[10px] font-bold text-slate-850 ml-0.5">{formatPrice(active.baseprice)?.unit || "L"}</span>
                      </>
                    ) : isFuture ? (
                      "Coming Soon"
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              )}

              {/* Capacity */}
              <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <BatteryCharging size={11} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Capacity</span>
                </div>
                <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
                  {active.capacity || "—"}<span className="text-[10px] font-bold text-slate-500 ml-0.5">kWh</span>
                </p>
              </div>

              {/* Range */}
              <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <Zap size={11} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Range</span>
                </div>
                <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
                  {active.range || "—"}<span className="text-[10px] font-bold text-slate-500 ml-0.5">km</span>
                </p>
              </div>

              {/* DC Fast Charge Speed */}
              <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <BatteryCharging size={11} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Charge</span>
                </div>
                <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
                  {chargeTime.value}<span className="text-[10px] font-bold text-slate-500 ml-0.5">{chargeTime.unit}</span>
                </p>
              </div>

              {/* On-Road Price */}
              {hasOnRoad && (
                <div className="rounded-xl bg-[#a5e6d1]/10 border border-[#a5e6d1]/30 p-3 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between text-brand mb-0.5">
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-brand" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">On-Road</span>
                    </div>
                    {!hideCityDropdown && availableCities.length > 1 ? (
                      <select
                        value={activeCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-transparent text-[9px] font-bold text-brand outline-none cursor-pointer border-none p-0 max-w-[65px] text-right"
                      >
                        {availableCities.map(city => (
                          <option key={city} value={city} className="bg-white text-slate-900">{city}</option>
                        ))}
                      </select>
                    ) : (
                      activeCity && (
                        <span className="text-[9px] font-bold text-brand truncate max-w-[80px] text-right">
                          {activeCity}
                        </span>
                      )
                    )}
                  </div>
                  <p className="text-lg font-black text-slate-900 leading-tight tabular-nums mt-1">
                    {(() => {
                      const match = relevantPricing.find(p => p.location_name === activeCity);
                      if (!match || !match.on_road_price) return "—";
                      return `₹${match.on_road_price}`;
                    })()}
                    <span className="text-[10px] font-bold text-slate-500 ml-0.5">L</span>
                  </p>
                </div>
              )}
            </div>

            {/* Second Row (BaaS Billing: 3 cards) */}
            {showBaas && (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 mt-2">
                {/* Rental Rate */}
                <div className="rounded-xl bg-[#a5e6d1]/15 border border-[#a5e6d1]/30 p-3 shadow-xs">
                  <div className="flex items-center gap-1 text-brand mb-0.5">
                    <IndianRupee size={11} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Rental Rate</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
                    ₹{active.price_baas || "—"}<span className="text-[10px] font-bold text-slate-505 ml-0.5">/km</span>
                  </p>
                </div>

                {/* Min. Commitment */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                  <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                    <Zap size={11} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Min. Commitment</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
                    {(() => {
                      const monthlyRental = parseFloat(active.baas_monthly_rental || "0");
                      const rate = parseFloat(active.price_baas || "0");
                      if (monthlyRental > 0 && rate > 0) {
                        const km = Math.round(monthlyRental / rate);
                        return new Intl.NumberFormat("en-IN").format(km);
                      }
                      return "1,500";
                    })()}<span className="text-[10px] font-bold text-slate-505 ml-0.5">km/mo</span>
                  </p>
                </div>

                {/* Min. Monthly Bill */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                  <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                    <IndianRupee size={11} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Min. Monthly Bill</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 leading-tight tabular-nums">
                    ₹{(() => {
                      if (active.baas_monthly_rental) {
                        const val = parseFloat(active.baas_monthly_rental);
                        if (val > 0) return rupees(val);
                      }
                      const rate = parseFloat(active.price_baas || "0");
                      return rate > 0 ? rupees(rate * 1500) : "—";
                    })()}<span className="text-[10px] font-bold text-slate-505 ml-0.5">/mo</span>
                  </p>
                </div>
              </div>
            )}

            {/* Third Row (BaaS Terms: 2 cards) */}
            {showBaas && (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2">
                {/* Battery Ownership */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                  <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                    <BatteryCharging size={11} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Battery Ownership</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    Leased <span className="text-[9px] font-bold text-slate-500 block mt-0.5">({active.modelName ? active.modelName.split(" ")[0] : "OEM"} Leasing Partner)</span>
                  </p>
                </div>

                {/* Battery Warranty */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
                  <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                    <Zap size={11} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Battery Warranty</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    Lifetime Warranty <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">(Free Replacement &lt;70% Health)</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {showBaas && (
        <div className="mt-2 rounded-xl bg-slate-200/60 p-3 text-[10px] text-slate-650 leading-relaxed font-medium">
          *Minimum distance commitments (e.g., 1,500 km/month) and billing loops depend on your chosen financing vendor.
        </div>
      )}
    </div>
  );
}
