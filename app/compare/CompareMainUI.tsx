"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  BadgeCheck, BatteryCharging, 
  CalendarDays, CheckCircle2, Gauge, 
  MapPin, Tag, X, GitCompare, Zap, Clock,
  CarFront, Banknote, Sparkles, Trash2
} from "lucide-react";
import { isLaunched } from "../lib/wordpress";
import { useCompare } from "../context/CompareContext";
import AddVehicleToCompare from "./AddVehicleToCompare";
import CompareOwnershipView from "./CompareOwnershipView";

export default function CompareMainUI({ 
  products: filtered, 
  allListings: compactAll, 
  slugs 
}: { 
  products: any[], 
  allListings: any[], 
  slugs: string[] 
}) {
  const [activeTab, setActiveTab] = useState<"specs" | "ownership">("specs");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const { removeFromCompare } = useCompare();

  const cleanPrice = (val: string | undefined | null) => {
    if (!val) return "";
    return val.replace(/[₹,a-zA-Z\s]/g, "");
  };

  const getProductData = (p: any) => {
    const variantIndex = selectedVariants[p.slug] ?? 0;
    const variant = p.batteryVariants?.[variantIndex];
    // If we have variants, price might be different. 
    // Currently prices[0] is often the base price. 
    // If we had variant-specific prices in the API we'd use them here.
    // For now we use the base price but update range/battery/efficiency.
    return { variant, variantIndex };
  };

  const features = [
    {
      label: "Battery Option",
      key: "batteryVariants",
      icon: BatteryCharging,
      format: (_: any, p: any) => {
        if (!p.batteryVariants?.length) return <span className="text-slate-400">Standard</span>;
        return (
          <select 
            value={selectedVariants[p.slug] ?? 0}
            onChange={(e) => setSelectedVariants(prev => ({ ...prev, [p.slug]: parseInt(e.target.value) }))}
            className="w-full rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-xs font-black text-sky-700 outline-none cursor-pointer hover:bg-sky-100 transition-colors"
          >
            {p.batteryVariants.map((v: any, idx: number) => (
              <option key={idx} value={idx}>{v.capacity} kWh variant</option>
            ))}
          </select>
        );
      }
    },
    { 
      label: "Price",      
      key: "prices",     
      icon: Tag,      
      format: (v: string[], p: any) => {
        const { variant, variantIndex } = getProductData(p);
        const rawPriceStr = v[0] || "10";
        const priceParts = rawPriceStr.split(/[–-]/).map((s: string) => s.trim());
        
        // Match logic with Ownership tab for consistency
        const rawVal = cleanPrice(variant?.price || v[variantIndex] || priceParts[variantIndex] || priceParts[0]);
        // If > 1000, it's in full rupees — convert to lakhs
        const displayPrice = rawVal > 1000 ? (rawVal / 100000).toFixed(2).replace(/\.00$/, "") : String(rawVal);
        
        return (
          <div className="flex flex-col gap-1">
            <span className="text-lg font-black text-slate-900">
              ₹{displayPrice} L
            </span>
            {v.length > 1 && (
              <span className="text-[9px] font-medium text-slate-400 italic">
                Range: ₹{v.join("–")} L
              </span>
            )}
          </div>
        );
      }
    },
    { 
      label: "Type",       
      key: "types",      
      icon: Zap,      
      format: (v: string[]) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase">
          {v[0] || "N/A"}
        </span>
      )
    },
    { 
      label: "Range",      
      key: "realWorldRange", 
      icon: MapPin, 
      format: (v: number | null, p: any) => {
        const { variant } = getProductData(p);
        const val = variant ? variant.range : v;
        return (
          <div className="flex items-center gap-2 text-sky-600">
            <MapPin size={14} />
            <span className="font-bold">{val} km</span>
          </div>
        );
      }
    },
    { 
      label: "Battery",    
      key: "batteryCapacity", 
      icon: BatteryCharging, 
      format: (v: number | null, p: any) => {
        const { variant } = getProductData(p);
        const val = variant ? variant.capacity : v;
        return (
          <div className="flex items-center gap-2 text-emerald-600">
            <BatteryCharging size={14} />
            <span className="font-bold">{val} kWh</span>
          </div>
        );
      }
    },
    { 
      label: "Top Speed",  
      key: "topSpeed",   
      icon: Gauge,    
      format: (v: number | null) => (
        <div className="flex items-center gap-2 text-amber-600">
          <Gauge size={14} />
          <span className="font-bold">{v || "N/A"} km/h</span>
        </div>
      )
    },
    { 
      label: "Charging",    
      key: "charge", 
      icon: Clock, 
      format: (v: any, p: any) => {
        const val = p.batteryVariants?.length ? Math.min(...p.batteryVariants.map((v: any) => parseFloat(v.charge))) : null;
        const max = p.batteryVariants?.length ? Math.max(...p.batteryVariants.map((v: any) => parseFloat(v.charge))) : null;
        return (
          <div className="flex items-center gap-2 text-slate-600">
            <Clock size={14} className="text-slate-400" />
            <span className="font-bold">{val}{max && max !== val ? `–${max}` : ""} hrs</span>
          </div>
        );
      }
    },
    { 
      label: "Status",     
      key: "launchdate", 
      icon: CalendarDays, 
      format: (v: string | null) => {
        const launched = isLaunched(v);
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${launched ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {launched ? <BadgeCheck size={11} /> : <CalendarDays size={11} />}
            {launched ? "Available" : "Coming Soon"}
          </span>
        );
      } 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab("specs")}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === "specs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <CarFront size={16} /> Specifications
        </button>
        <button
          onClick={() => setActiveTab("ownership")}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === "ownership" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Banknote size={16} /> Ownership Plan
        </button>
      </div>

      {activeTab === "specs" ? (
        <div className="overflow-x-auto pb-12">
          <div className="inline-block min-w-full align-middle">
            <div 
              className="grid gap-x-6 gap-y-0 px-4" 
              style={{ gridTemplateColumns: `180px repeat(${filtered.length + (filtered.length < 4 ? 1 : 0)}, minmax(280px, 1fr))` }}
            >
              
              {/* Header Row (Images) */}
              <div className="flex items-end pb-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Overview</div>
              {filtered.map((p) => (
                <div key={p.id} className="relative space-y-4">
                  {/* Remove button */}
                  <button
                    onClick={() => removeFromCompare(p.slug)}
                    className="absolute -top-1 -right-1 z-10 flex items-center gap-1 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors shadow-sm px-2.5 py-1 text-[10px] font-bold"
                    title={`Remove ${p.title}`}
                  >
                    <X size={12} /> Remove
                  </button>
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    {p.photo && (
                      <Image src={p.photo} alt={p.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">{p.brand}</p>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{p.title}</h3>
                  </div>
                  <Link href={`/product/${p.slug}`} className="block text-xs font-bold text-sky-600 hover:underline">
                    View Details
                  </Link>
                </div>
              ))}

              {/* Add Button Placeholder */}
              {filtered.length < 4 && (
                <div className="pb-4">
                  <AddVehicleToCompare allProducts={compactAll} currentSlugs={slugs} />
                </div>
              )}

              {/* Comparison Rows */}
              {features.map((f) => (
                <React.Fragment key={f.label}>
                  <div className="flex items-center gap-2 py-4 border-t border-slate-100 text-sm font-semibold text-slate-500 bg-slate-50/50 -mx-4 px-4 sticky left-0 z-10">
                    <f.icon size={16} className="text-slate-400" />
                    {f.label}
                  </div>
                  {filtered.map((p) => (
                    <div key={`${p.id}-${f.key}`} className="py-4 border-t border-slate-100">
                      {/* @ts-ignore */}
                      {f.format(p[f.key], p)}
                    </div>
                  ))}
                  {filtered.length < 4 && <div className="py-4 border-t border-slate-100" />}
                </React.Fragment>
              ))}

              {/* Pros Row */}
              <div className="flex items-center gap-2 py-4 border-t border-slate-100 text-sm font-semibold text-slate-500 bg-slate-50/50 -mx-4 px-4 sticky left-0 z-10">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Key Pros
              </div>
              {filtered.map((p) => (
                <div key={`${p.id}-pros`} className="py-4 border-t border-slate-100">
                  <ul className="space-y-2">
                    {p.pros.slice(0, 3).map((pro: string, i: number) => (
                      <li key={i} className="text-[11px] leading-relaxed text-slate-600 flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {filtered.length < 4 && <div className="py-4 border-t border-slate-100" />}

            </div>
          </div>
        </div>
      ) : (
        <CompareOwnershipView products={filtered} selectedVariants={selectedVariants} />
      )}
    </div>
  );
}
