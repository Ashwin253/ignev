"use client";

import { useState } from "react";
import LoanCalculator from "../components/LoanCalculator";
import CostEstimator from "../components/CostEstimator";
import type { EvListing } from "../lib/wordpress";

export default function ProductOwnershipSection({ item }: { item: EvListing }) {
  const [selectedIndex] = useState(0);
  const variant = item.batteryVariants?.[selectedIndex];

  const cleanPrice = (val: string | undefined | null) => {
    if (!val) return "";
    return val.replace(/[₹,a-zA-Z\s]/g, "");
  };

  const rawPriceStr = item.prices[0] || "10";
  const priceParts = rawPriceStr.split(/[–-]/).map((s: string) => s.trim());
  const specificPriceStr = cleanPrice(
    item.baas
      ? (item.prices[selectedIndex] || priceParts[selectedIndex] || priceParts[0])
      : (variant?.price || item.prices[selectedIndex] || priceParts[selectedIndex] || priceParts[0])
  );
  const priceVal = parseFloat(specificPriceStr) || 10;
  const currentPrice = priceVal > 1000 ? priceVal : priceVal * 100000;

  const efficiency = variant?.range
    ? (parseFloat(variant.capacity) / parseFloat(variant.range)) * 100
    : undefined;

  return (
    <div className="mt-20 rounded-[3rem] bg-slate-900 px-6 py-16 md:px-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 shadow-sm mb-4">
          Ownership
        </span>
        <h2 className="text-3xl font-black text-white md:text-4xl">
          Plan Your <span className="text-sky-400">Ownership</span>
        </h2>
        {variant?.capacity && (
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Estimates for the <span className="font-bold text-white">{variant.capacity} kWh</span> variant
          </p>
        )}
      </div>

      {/* Full-width two-column calculators */}
      <div className="grid gap-8 lg:grid-cols-2">
        <LoanCalculator initialPrice={currentPrice} />
        <CostEstimator initialPrice={currentPrice} efficiency={efficiency} />
      </div>

      <p className="mt-10 text-center text-[11px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
        * Prices and ownership estimates may vary based on state subsidies, RTO charges, and insurance.{" "}
        <span className="font-bold text-sky-400">Please enquire for exact on-road pricing in your city.</span>
      </p>
    </div>
  );
}
