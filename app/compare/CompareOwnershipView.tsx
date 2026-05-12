"use client";

import React, { useState, useMemo } from "react";
import { Banknote, Fuel, Zap, Clock, Sparkles, Tag } from "lucide-react";
import data from "../../own-cost-data.json";

type CompactProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  prices: string[];
  batteryVariants: any[];
};

const stateCosts = data.stateCosts;
const defaults = data.defaults;

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
}

function cleanPrice(val: string | undefined | null): number {
  if (!val) return 0;
  // Remove currency symbols, commas, and letters (like L or lakh)
  const cleaned = val.replace(/[₹,a-zA-Z\s]/g, "");
  return parseFloat(cleaned) || 0;
}

function calcEmi(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

export default function CompareOwnershipView({ 
  products,
  selectedVariants = {}
}: { 
  products: CompactProduct[];
  selectedVariants?: Record<string, number>;
}) {
  const [loanYears, setLoanYears] = useState(3);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [dailyDistance, setDailyDistance] = useState(35);
  const [selectedState, setSelectedState] = useState(stateCosts[0].state);

  const state = stateCosts.find(s => s.state === selectedState) ?? stateCosts[0];

  const results = useMemo(() => {
    return products.map(p => {
      const variantIndex = selectedVariants[p.slug] ?? 0;
      const variant = p.batteryVariants?.[variantIndex];
      
      const rawPriceStr = p.prices[0] || "10";
      // Split "14.74 - 19.94" into ["14.74", "19.94"]
      const priceParts = rawPriceStr.split(/[–-]/).map(s => s.trim());
      
      // PRIORITIZE: 1. Variant specific price field, 2. Split price range, 3. Base price
      const specificPriceStr = variant?.price || p.prices[variantIndex] || priceParts[variantIndex] || priceParts[0];
      
      const priceVal = cleanPrice(specificPriceStr) || 10;
      const price = priceVal * 100000;
      const downPayment = (price * downPaymentPercent) / 100;
      const principal = price - downPayment;
      const emi = calcEmi(principal, 9.5, loanYears * 12);
      
      const efficiency = variant?.range 
        ? (parseFloat(variant.capacity) / parseFloat(variant.range)) * 100 
        : defaults.evEfficiencyKwhPer100Km;
        
      const runningCost = ((dailyDistance * 30) * efficiency * state.electricityRsPerKwh) / 100;
      
      return {
        id: p.id,
        price,
        emi,
        downPayment,
        runningCost,
        total: emi + runningCost
      };
    });
  }, [products, loanYears, downPaymentPercent, dailyDistance, state, selectedVariants]);

  return (
    <div className="space-y-8">
      {/* Global Inputs */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 backdrop-blur-sm">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <InputGroup label="Loan Tenure" value={`${loanYears} Years`}>
            <input type="range" min="1" max="7" value={loanYears} onChange={(e) => setLoanYears(parseInt(e.target.value))} className="w-full accent-sky-600" />
          </InputGroup>
          <InputGroup label="Down Payment" value={`${downPaymentPercent}%`}>
            <input type="range" min="0" max="80" step="5" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))} className="w-full accent-sky-600" />
          </InputGroup>
          <InputGroup label="Daily Run" value={`${dailyDistance} km`}>
            <input type="range" min="5" max="200" step="5" value={dailyDistance} onChange={(e) => setDailyDistance(parseInt(e.target.value))} className="w-full accent-sky-600" />
          </InputGroup>
          <InputGroup label="Your State" value={selectedState}>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full bg-transparent text-sm font-bold outline-none">
              {stateCosts.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
            </select>
          </InputGroup>
        </div>
      </div>

      {/* Results Table/Grid */}
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
        {products.map((p, i) => {
          const res = results[i];
          return (
            <div key={p.id} className="flex flex-col gap-4">
              {/* Compact Vehicle Header */}
              <div className="flex items-center gap-3 mb-2 px-1">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                  {p.photo && <img src={p.photo} alt={p.title} className="object-cover w-full h-full" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-sky-600 truncate">{p.brand}</p>
                  <h3 className="text-xs font-black text-slate-900 leading-tight line-clamp-2">{p.title}</h3>
                  {p.batteryVariants?.[selectedVariants[p.slug] ?? 0] && (
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                      {p.batteryVariants[selectedVariants[p.slug] ?? 0].capacity} kWh variant
                    </p>
                  )}
                </div>
              </div>

              {/* Price Reference Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Tag size={14} className="text-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Ex-Showroom Price</span>
                </div>
                <p className="text-lg font-black text-slate-900">₹{rupees(res.price)}</p>
                <p className="text-[8px] text-slate-400 font-medium">For selected variant</p>
              </div>

              {/* Down Payment Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Banknote size={14} className="text-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Down Payment</span>
                </div>
                <p className="text-lg font-black text-slate-900">₹{rupees(res.downPayment)}</p>
              </div>

              {/* EMI Card */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
                <div className="flex items-center gap-2 text-sky-600 mb-3">
                  <Banknote size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Monthly EMI</span>
                </div>
                <p className="text-2xl font-black text-slate-900">₹{rupees(res.emi)}</p>
              </div>

              {/* Running Cost Card */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                <div className="flex items-center gap-2 text-emerald-600 mb-3">
                  <Zap size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Running Cost</span>
                </div>
                <p className="text-2xl font-black text-slate-900">₹{rupees(res.runningCost)}</p>
                <p className="text-[10px] font-bold text-emerald-600 mt-1">at ₹{state.electricityRsPerKwh}/unit</p>
              </div>

              {/* Total Card */}
              <div className="rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-5 shadow-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <Sparkles size={16} className="text-sky-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Monthly</span>
                </div>
                <p className="text-2xl font-black text-white">₹{rupees(res.total)}</p>
                <p className="text-[9px] font-medium text-slate-500 mt-1">EMI + Running Cost</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InputGroup({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-xs font-black text-sky-600">{value}</span>
      </div>
      {children}
    </div>
  );
}
