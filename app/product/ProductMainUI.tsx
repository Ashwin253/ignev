"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import BatterySelector from "./BatterySelector";
import EnquiryTrigger from "./EnquiryTrigger";
import { triggerEnquiryModal } from "../components/EnquiryModal";
import CompareButton from "./CompareButton";
import Link from "next/link";
import {
  ArrowLeft, Gauge, Tag,
  BatteryCharging, Banknote, Fuel, ArrowDown, Zap, ChevronDown,
} from "lucide-react";
import type { EvListing } from "../lib/wordpress";
import { useProductSelection } from "./ProductSelectionProvider";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  { ssr: false }
);

type TabKey = "battery" | "emi" | "energy";

const TABS: { key: TabKey; label: string; icon: typeof BatteryCharging }[] = [
  { key: "battery", label: "Battery",  icon: BatteryCharging },
  // { key: "emi",     label: "EMI",      icon: Banknote },
  { key: "energy",  label: "Energy",   icon: Fuel },
];

function calcEmi(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function rupees(v: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v));
}

export default function ProductMainUI({ item, slug }: { item: EvListing; slug: string }) {
  const { selectedIndex, showBaas, activeVariants, setSelectedIndex: onSelect, setShowBaas: onToggleBaas } = useProductSelection();
  const [activeTab, setActiveTab] = useState<TabKey>("battery");

  const cleanPrice = (val: string | undefined | null) => {
    if (!val) return "";
    return val.replace(/[₹,a-zA-Z\s]/g, "");
  };

  const activeVariant = activeVariants?.[selectedIndex];
  const selectedVariantName = activeVariant?.modelName || (activeVariant?.capacity ? `${activeVariant.capacity} kWh` : "");
  const activeBatterySpec = item.batterySpecs.find((spec) => spec.variantName === selectedVariantName) || item.batterySpecs[selectedIndex];
  const displayPriceRaw = activeVariant?.price || item.prices?.[selectedIndex] || item.prices?.[0] || "10";

  const specificPriceStr = useMemo(() => {
    const raw = cleanPrice(displayPriceRaw);
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return raw;
    return value > 1000 ? (value / 100000).toFixed(2).replace(/\.00$/, "") : raw;
  }, [displayPriceRaw]);

  const priceVal = parseFloat(cleanPrice(displayPriceRaw)) || 10;
  const currentPrice = priceVal > 1000 ? priceVal : priceVal * 100000;

  // EMI quick calc (20% down, 9.5%, 3 years)
  const emiMonthly = useMemo(() => calcEmi(currentPrice * 0.8, 9.5, 36), [currentPrice]);

  // Energy per-km
  const evEfficiency = activeVariant?.range
    ? parseFloat(activeVariant.capacity) / parseFloat(activeVariant.range)
    : 0.14;
  const evCostPerKm = evEfficiency * 9;
  const petrolCostPerKm = 104 / 18;
  const cngCostPerKm = 80 / 28;

  const scrollToOwnership = () => {
    document.getElementById("ownership-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl border-2 border-slate-300 bg-slate-50 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-5">
      {activeVariants.length > 0 && (
        <label className="mb-3 flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5">
          <BatteryCharging size={15} className={showBaas ? "text-emerald-500" : "text-sky-500"} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Model</span>
          {activeVariants.length > 1 ? (
            <select
              value={selectedIndex}
              onChange={(e) => onSelect(Number(e.target.value))}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              {activeVariants.map((variant, index) => (
                <option key={`${showBaas ? "baas" : "standard"}-${index}`} value={index}>
                  {variant.modelName || `${variant.capacity} kWh`}
                </option>
              ))}
            </select>
          ) : (
            <span className="min-w-0 flex-1 text-sm font-bold text-slate-800">{selectedVariantName || item.title}</span>
          )}
          {activeVariants.length > 1 && <ChevronDown size={14} className="text-slate-400 shrink-0" />}
        </label>
      )}

      {/* ── Price display ── */}
      <div className="flex flex-col gap-2 mb-4">
        <div className={`flex items-center justify-between rounded-2xl px-4 py-3 border transition-all duration-300 ${
          showBaas
            ? "bg-emerald-100 border-emerald-300"
            : "bg-slate-100 border-slate-300"
        }`}>
          <div className="flex items-center gap-2.5">
            <Tag size={16} className={showBaas ? "text-emerald-500" : "text-slate-400"} />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                {showBaas ? "BAAS Starting" : "Ex-Showroom Starting"}
              </span>
              <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                ₹{specificPriceStr} <span className="text-sm font-bold text-slate-500">Lakh</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => triggerEnquiryModal(`Offers: ${item.brand} ${item.title}`)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md  bg-linear-to-r from-green-300 to-blue-500 hover:from-amber-600 hover:to-orange-600 text-white text-[15px] font-black uppercase tracking-wider px-4 py-2 shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 hover:scale-105 active:scale-95"
          >
            <DotLottieReact src="/Giftpremiumanimation.lottie" loop autoplay className="h-10 w-10" />
            Latest Offers
          </button>
        </div>
        {item.prices.length > 1 && !showBaas && (() => {
          const nums = item.prices.map((p) => {
            const n = parseFloat(p.replace(/[₹,a-zA-Z\s]/g, ""));
            return Number.isFinite(n) ? (n > 1000 ? n / 100000 : n) : 0;
          }).filter((n) => n > 0);
          if (nums.length < 2) return null;
          const min = Math.min(...nums);
          const max = Math.max(...nums);
          if (min === max) return null;
          const fmt = (v: number) => v % 1 === 0 ? String(v) : v.toFixed(2).replace(/0$/, "");
          return (
            <p className="text-[10px] text-slate-400 px-1">
              <span className="font-bold text-slate-500">Full range:</span> ₹{fmt(min)} – {fmt(max)} L
            </p>
          );
        })()}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex rounded-2xl border-2 border-slate-300 bg-slate-200 p-1 gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="min-h-[220px] pt-4">

        {/* Battery tab */}
        {activeTab === "battery" && (
          <div className="space-y-4">
            <BatterySelector
              standardVariants={item.batteryVariants}
              baasVariants={item.baasVariants}
              hasBaas={item.baas}
              selectedIndex={selectedIndex}
              onSelect={onSelect}
              showBaas={showBaas}
              onToggleBaas={onToggleBaas}
              hideVariantSelector
              cityPricing={item.city_pricing}
            />

            {(item.topSpeed !== null || activeBatterySpec?.maxPower || activeBatterySpec?.maxTorque) && (
              <div className="grid grid-cols-3 gap-2 rounded-2xl border-2 border-slate-300 bg-slate-200 p-2">
                {item.topSpeed !== null && (
                  <div className="rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-1 text-slate-400">
                      <Gauge size={12} className="text-amber-500" />
                      <p className="text-[9px] uppercase tracking-wider font-bold">Top speed</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{item.topSpeed}<span className="ml-0.5 text-[10px] text-slate-400">km/h</span></p>
                  </div>
                )}
                {activeBatterySpec?.maxPower && (
                  <div className="rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-1 text-slate-400">
                      <Zap size={12} className="text-sky-500" />
                      <p className="text-[9px] uppercase tracking-wider font-bold">Max power</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{activeBatterySpec.maxPower}<span className="ml-0.5 text-[10px] text-slate-400">bhp</span></p>
                  </div>
                )}
                {activeBatterySpec?.maxTorque && (
                  <div className="rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-1 text-slate-400">
                      <Gauge size={12} className="text-emerald-500" />
                      <p className="text-[9px] uppercase tracking-wider font-bold">Max torque</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{activeBatterySpec.maxTorque}<span className="ml-0.5 text-[10px] text-slate-400">Nm</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* EMI tab */}
        {activeTab === "emi" && (
          <div className="space-y-4">
            {/* Variant selector for EMI */}
            {item.batteryVariants.length > 1 && (
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Banknote size={14} className="text-sky-500 shrink-0" />
                <select
                  value={selectedIndex}
                  onChange={(e) => onSelect(Number(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none appearance-none cursor-pointer"
                >
                  {item.batteryVariants.map((v, i) => (
                    <option key={i} value={i}>
                      {v.modelName || `${v.capacity} kWh`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </label>
            )}

            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Estimated monthly EMI</p>
                <button
                  onClick={() => triggerEnquiryModal(`EMI Enquiry: ${item.brand} ${item.title}`)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-linear-to-r from-emerald-400 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[15px] font-black uppercase tracking-wider px-4 py-2 shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:scale-105 active:scale-95"
                >
                 <DotLottieReact src="/rupeediscount.lottie" loop autoplay className="h-10 w-10" />
                 Get Best Rate
                </button>
              </div>
              <p className="text-4xl font-black text-slate-900">
                ₹{rupees(emiMonthly)}<span className="text-base font-medium text-slate-400">/mo</span>
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-white p-3 border border-sky-100">
                  <p className="text-slate-400 mb-0.5">Down (20%)</p>
                  <p className="font-bold text-slate-800">₹{rupees(currentPrice * 0.2)}</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-sky-100">
                  <p className="text-slate-400 mb-0.5">Rate</p>
                  <p className="font-bold text-slate-800">9.5%</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-sky-100">
                  <p className="text-slate-400 mb-0.5">Tenure</p>
                  <p className="font-bold text-slate-800">3 years</p>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-slate-400">
                * Indicative. Actual EMI depends on bank, credit score, and tenure.
              </p>
            </div>

            <button
              onClick={scrollToOwnership}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3.5 text-sm font-bold text-sky-600 hover:bg-sky-50 transition-colors"
            >
              <ArrowDown size={15} /> Detailed EMI Calculator below
            </button>
          </div>
        )}

        {/* Energy tab */}
        {activeTab === "energy" && (
          <EnergyTabContent item={item} evCostPerKm={evCostPerKm} petrolCostPerKm={petrolCostPerKm} cngCostPerKm={cngCostPerKm} />
        )}
      </div>

      {/* ── CTAs ── */}
      </div>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <EnquiryTrigger vehicle={`${item.brand} ${item.title}`} />
        <CompareButton slug={slug} name={`${item.brand} ${item.title}`} />
        <Link href="/catalog"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={15} /> Catalog
        </Link>
      </div>
    </div>
  );
}

// ── Energy Tab with Fuel Type / Models sub-tabs ──────────────────────────────

type EnergySubTab = "fuel" | "models";

function EnergyTabContent({ item, evCostPerKm, petrolCostPerKm, cngCostPerKm }: {
  item: EvListing; evCostPerKm: number; petrolCostPerKm: number; cngCostPerKm: number;
}) {
  const [subTab, setSubTab] = useState<EnergySubTab>("fuel");
  const [dailyKm, setDailyKm] = useState(50);
  const [editingKm, setEditingKm] = useState(false);

  const selfEntry = item.energyComparison.find(c => c.fuelType?.toLowerCase() === "self");
  const parsedSelfCost = selfEntry ? parseFloat(selfEntry.fuelPrice) : NaN;
  const selfCostPerKm = Number.isFinite(parsedSelfCost) ? parsedSelfCost : evCostPerKm;
  const currentVehicleSubtitle = selfEntry
    ? `${selfEntry.modelused ? `${selfEntry.modelused} - ` : ""}Rs ${selfEntry.fuelPrice}/km - ${selfEntry.mileage} km range`
    : "Estimated from selected battery and range";

  // Models = all entries from Supabase/WP energy comparisons (except "self")
  const modelEntries = item.energyComparison.filter(c => c.fuelType?.toLowerCase() !== "self");

  return (
    <div className="space-y-4">
      {/* Sub-tabs: Fuel Type | Models */}
      <div className="flex rounded-xl border-2 border-slate-300 bg-slate-200 p-1 gap-1">
        <button onClick={() => setSubTab("fuel")} className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${subTab === "fuel" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
          Fuel Type
        </button>
        <button onClick={() => setSubTab("models")} className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${subTab === "models" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
          Models {modelEntries.length > 0 && <span className="ml-1 text-[8px] bg-sky-100 text-sky-600 rounded-full px-1.5">{modelEntries.length}</span>}
        </button>
      </div>

      {/* Daily km editor */}
      {/* {subTab === "models" && (
        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
          <span>Based on</span>
          {editingKm ? (
            <input type="number" value={dailyKm} onChange={(e) => setDailyKm(Number(e.target.value) || 50)} onBlur={() => setEditingKm(false)} autoFocus
              className="w-12 rounded-md border border-sky-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-800 outline-none text-center" />
          ) : (
            <button onClick={() => setEditingKm(true)} className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700">
              {dailyKm} km <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          )}
          <span>daily ride</span>
        </div>
      )} */}

      {/* Fuel Type — generic commodity comparison */}
      {subTab === "fuel" && (
        <>
          <CurrentVehicleCostCard name={item.title} subtitle={currentVehicleSubtitle} costPerKm={selfCostPerKm} />
          <CompareCard name="Avg Petrol Vehicle" subtitle="Petrol · ₹104/L · 18 km/L" costPerKm={petrolCostPerKm} isEv={false} />
          <CompareCard name="Avg Diesel Vehicle" subtitle="Diesel · ₹90/L · 22 km/L" costPerKm={90 / 22} isEv={false} />
          <CompareCard name="Avg CNG Vehicle" subtitle="CNG · ₹80/kg · 28 km/kg" costPerKm={cngCostPerKm} isEv={false} />
        </>
      )}

      {/* Models — all entries from team dashboard */}
      {subTab === "models" && (
        <>
          <CurrentVehicleCostCard name={item.title} subtitle={currentVehicleSubtitle} costPerKm={selfCostPerKm} />
          {modelEntries.length > 0 ? modelEntries.map((comp, i) => {
            const fuelPrice = parseFloat(comp.fuelPrice) || 0;
            const mileage = parseFloat(comp.mileage) || 1;
            const fuel = comp.fuelType?.toLowerCase() ?? "petrol";
            const isEv = fuel === "ev" || fuel === "self";
            const costPerKm = isEv ? fuelPrice : fuelPrice / mileage;
            const isCng = fuel === "cng";
            const subtitle = isEv
              ? `${comp.fuelType} · ₹${comp.fuelPrice}/km · ${comp.mileage} km range`
              : `${comp.fuelType} · ₹${comp.fuelPrice}/${isCng ? "kg" : "L"} · ${comp.mileage} km/${isCng ? "kg" : "L"}`;
            return (
              <CompareCard key={i} name={comp.name} subtitle={subtitle}
                costPerKm={costPerKm} isEv={isEv} modelused={comp.modelused} />
            );
          }) : (
            <p className="text-center text-xs text-slate-400 py-6">No competitor models added yet.</p>
          )}
        </>
      )}

      {/* <button onClick={scrollToOwnership} className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
        <ArrowDown size={15} /> Full ownership cost analysis below
      </button> */}
    </div>
  );
}

function CurrentVehicleCostCard({ name, subtitle, costPerKm }: {
  name: string; subtitle: string; costPerKm: number;
}) {
  return (
    <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-100 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-[10px] text-emerald-700">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-emerald-600 uppercase">Cost/km</p>
          <p className="text-2xl font-black text-emerald-800">₹{costPerKm.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}

function CompareCard({ name, subtitle, costPerKm, isEv, modelused }: {
  name: string; subtitle: string; costPerKm: number; isEv: boolean; modelused?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-300 flex items-center justify-center">
            {isEv ? <Zap size={18} className="text-slate-600" /> : <Fuel size={18} className="text-slate-600" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-[10px] text-slate-500">
              {modelused && <span className="font-medium text-slate-600">{modelused} · </span>}
              {subtitle}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Cost/km</p>
          <p className="text-xl font-black text-slate-900">₹{costPerKm.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}
