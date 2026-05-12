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
    variant?.price || item.prices[selectedIndex] || priceParts[selectedIndex] || priceParts[0]
  );
  const priceVal = parseFloat(specificPriceStr) || 10;
  const currentPrice = priceVal * 100000;

  const efficiency = variant?.range
    ? (parseFloat(variant.capacity) / parseFloat(variant.range)) * 100
    : undefined;

  return (
    <div className="mt-20 border-t border-slate-100 pt-16">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm mb-4">
          Ownership
        </span>
        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
          Plan Your <span className="text-sky-600">Ownership</span>
        </h2>
        {variant?.capacity && (
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Estimates for the <span className="font-bold text-slate-900">{variant.capacity} kWh</span> variant
          </p>
        )}
      </div>

      {/* Full-width two-column calculators */}
      <div className="grid gap-8 lg:grid-cols-2">
        <LoanCalculator initialPrice={currentPrice} />
        <CostEstimator initialPrice={currentPrice} efficiency={efficiency} />
      </div>

      <p className="mt-10 text-center text-[11px] text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
        * Prices and ownership estimates may vary based on state subsidies, RTO charges, and insurance.{" "}
        <span className="font-bold text-sky-600">Please enquire for exact on-road pricing in your city.</span>
      </p>
    </div>
  );
}
