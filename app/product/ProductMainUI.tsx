"use client";

import React, { useState } from "react";
import BatterySelector from "./BatterySelector";
import LoanCalculator from "../components/LoanCalculator";
import CostEstimator from "../components/CostEstimator";
import EnquiryTrigger from "./EnquiryTrigger";
import CompareButton from "./CompareButton";
import Link from "next/link";
import { ArrowLeft, Gauge, CheckCircle2, XCircle, Tag } from "lucide-react";
import ColorList from "./ColorList";

export default function ProductMainUI({ item, slug }: { item: any, slug: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const variant = item.batteryVariants?.[selectedIndex];
  
  const cleanPrice = (val: string | undefined | null) => {
    if (!val) return "";
    return val.replace(/[₹,a-zA-Z\s]/g, "");
  };

  const rawPriceStr = item.prices[0] || "10";
  const priceParts = rawPriceStr.split(/[–-]/).map((s: string) => s.trim());
  const specificPriceStr = cleanPrice(variant?.price || item.prices[selectedIndex] || priceParts[selectedIndex] || priceParts[0]);
  const priceVal = parseFloat(specificPriceStr) || 10;
  const currentPrice = priceVal * 100000;

  const efficiency = variant?.range 
    ? (parseFloat(variant.capacity) / parseFloat(variant.range)) * 100 
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Dynamic Price Display */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-white shadow-xl shadow-sky-200">
          <Tag size={18} fill="currentColor" className="text-sky-300" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-200">Ex-Showroom Price</span>
            <span className="text-2xl font-black leading-none">₹{specificPriceStr} Lakh</span>
          </div>
        </div>
        
        {item.prices.length > 1 && (
          <div className="flex flex-col px-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Model Range</span>
            <span className="text-sm font-bold text-slate-600">₹{item.prices.join("–")} L</span>
          </div>
        )}
      </div>

      {/* Battery variants */}
      <BatterySelector variants={item.batteryVariants} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />

      {/* Top speed */}
      {item.topSpeed !== null && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Gauge size={18} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Top speed</p>
            <p className="font-semibold text-slate-900">{item.topSpeed} km/h</p>
          </div>
        </div>
      )}

      {/* Colors */}
      <ColorList colors={item.colors} />

      {/* Pros & Cons */}
      {(item.pros.length > 0 || item.cons.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {item.pros.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-600">Pros</p>
              <ul className="space-y-2">
                {item.pros.map((pro: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />{pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.cons.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-600">Cons</p>
              <ul className="space-y-2">
                {item.cons.map((con: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />{con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <EnquiryTrigger vehicle={`${item.brand} ${item.title}`} />
        <CompareButton slug={slug} name={`${item.brand} ${item.title}`} />
        <Link href="/catalog"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={15} /> Catalog
        </Link>
      </div>

      {/* ── Ownership Plan Integration ── */}
      <div className="mt-20 pt-20 border-t border-slate-100 space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Plan Your <span className="text-sky-600">Ownership</span></h2>
          <p className="mt-3 text-slate-500 max-w-2xl mx-auto italic">Estimates for the <span className="font-bold text-slate-900">{variant?.capacity} kWh</span> variant</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <LoanCalculator initialPrice={currentPrice} />
          <CostEstimator 
            initialPrice={currentPrice} 
            efficiency={efficiency} 
          />
        </div>
        
        <p className="text-center text-[11px] text-slate-400 font-medium pb-8 border-b border-slate-100 max-w-2xl mx-auto">
          * Prices and ownership estimates might change as per various reasons. 
          <span className="font-bold text-sky-600"> Please Enquire for updated details</span> and exact on-road pricing in your city.
        </p>
      </div>
    </div>
  );
}
