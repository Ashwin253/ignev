"use client";

import { useState } from "react";
import LoanCalculator from "../components/LoanCalculator";
import CostEstimator from "../components/CostEstimator";
import { Banknote, Fuel } from "lucide-react";
import type { EvListing } from "../lib/wordpress";

type OwnershipTab = "emi" | "cost";

export default function ProductOwnershipSection({ item }: { item: EvListing }) {
  return <div id="ownership-section"><ProductOwnershipInner item={item} /></div>;
}

function ProductOwnershipInner({ item }: { item: EvListing }) {
  const [selectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<OwnershipTab>("emi");
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
    <div className="mt-20 rounded-3xl bg-white border border-slate-200 px-5 py-10 md:px-10 md:py-14 shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        {/* <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 shadow-sm mb-4">
          Ownership
        </span> */}
        <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
          Plan Your <span className="text-[#10855f]">Ownership</span>
        </h2>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-2xl bg-slate-100 border border-slate-200 p-1 gap-1 mb-8">
        <button
          onClick={() => setActiveTab("emi")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
            activeTab === "emi"
              ? "bg-[#a5e6d1] text-slate-950 font-black shadow-md"
              : "text-slate-500 hover:text-slate-900 hover:bg-white"
          }`}
        >
          <Banknote size={16} />
          Loan & EMI
        </button>
        <button
          onClick={() => setActiveTab("cost")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
            activeTab === "cost"
              ? "bg-[#a5e6d1] text-slate-950 font-black shadow-md"
              : "text-slate-500 hover:text-slate-900 hover:bg-white"
          }`}
        >
          <Fuel size={16} />
          Ride & Cost
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "emi" && <LoanCalculator initialPrice={currentPrice} />}
        {activeTab === "cost" && <CostEstimator initialPrice={currentPrice} efficiency={efficiency} />}
      </div>

      <p className="mt-8 text-center text-[11px] text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
        * Estimates may vary based on state subsidies, RTO charges, and insurance.{" "}
        <span className="font-bold text-[#10855f]">Enquire for exact on-road pricing.</span>
      </p>
    </div>
  );
}
