"use client";

import React, { useState, useMemo, useEffect } from "react";
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

export default function ProductMainUI({ item, slug, dbFuelPrices = [] }: { item: EvListing; slug: string; dbFuelPrices?: any[] }) {
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
    <div className="flex flex-col gap-5 text-slate-900">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(52,235,177,0.08)] sm:p-5">
      {activeVariants.length > 0 && (
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-xs">
          <BatteryCharging size={15} className="text-[#10855f]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Model</span>
          {activeVariants.length > 1 ? (
            <select
              value={selectedIndex}
              onChange={(e) => onSelect(Number(e.target.value))}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              {activeVariants.map((variant, index) => (
                <option key={`${showBaas ? "baas" : "standard"}-${index}`} value={index} className="bg-white text-slate-900">
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
            ? "bg-[#34ebb1]/15 border-[#34ebb1]/40 shadow-xs"
            : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <Tag size={16} className={showBaas ? "text-[#10855f]" : "text-slate-400"} />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                {showBaas ? "BAAS Starting" : "Ex-Showroom Starting"}
              </span>
              <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                ₹{specificPriceStr} <span className="text-sm font-bold text-slate-650">Lakh</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => triggerEnquiryModal(`Offers: ${item.brand} ${item.title}`)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[#34ebb1] to-[#14a375] hover:brightness-110 text-slate-950 text-[15px] font-black uppercase tracking-wider px-4 py-2 shadow-[0_0_15px_rgba(52,235,177,0.2)] transition-all hover:shadow-[0_0_25px_rgba(52,235,177,0.4)] hover:scale-105 active:scale-95"
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
      <div className="flex rounded-2xl border border-slate-250 bg-slate-100 p-1 gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                isActive ? "bg-[#34ebb1] text-slate-950 font-black shadow-sm" : "text-slate-500 hover:text-slate-850 hover:bg-slate-200"
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
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                {item.topSpeed !== null && (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
                    <div className="mb-1 flex items-center gap-1 text-slate-400">
                      <Gauge size={12} className="text-amber-600" />
                      <p className="text-[9px] uppercase tracking-wider font-bold">Top speed</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{item.topSpeed}<span className="ml-0.5 text-[10px] text-slate-400 font-medium">km/h</span></p>
                  </div>
                )}
                {activeBatterySpec?.maxPower && (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
                    <div className="mb-1 flex items-center gap-1 text-slate-400">
                      <Zap size={12} className="text-[#10855f]" />
                      <p className="text-[9px] uppercase tracking-wider font-bold">Max power</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{activeBatterySpec.maxPower}<span className="ml-0.5 text-[10px] text-slate-400 font-medium">bhp</span></p>
                  </div>
                )}
                {activeBatterySpec?.maxTorque && (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
                    <div className="mb-1 flex items-center gap-1 text-slate-400">
                      <Gauge size={12} className="text-[#10855f]" />
                      <p className="text-[9px] uppercase tracking-wider font-bold">Max torque</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{activeBatterySpec.maxTorque}<span className="ml-0.5 text-[10px] text-slate-400 font-medium">Nm</span></p>
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
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
                <Banknote size={14} className="text-[#10855f] shrink-0" />
                <select
                  value={selectedIndex}
                  onChange={(e) => onSelect(Number(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none appearance-none cursor-pointer"
                >
                  {item.batteryVariants.map((v, i) => (
                    <option key={i} value={i} className="bg-white text-slate-950">
                      {v.modelName || `${v.capacity} kWh`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </label>
            )}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#10855f]">Estimated monthly EMI</p>
                <button
                  onClick={() => triggerEnquiryModal(`EMI Enquiry: ${item.brand} ${item.title}`)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[#34ebb1] to-[#14a375] hover:brightness-110 text-slate-950 text-[15px] font-black uppercase tracking-wider px-4 py-2 shadow-[0_0_15px_rgba(52,235,177,0.2)] transition-all hover:shadow-[0_0_25px_rgba(52,235,177,0.4)] hover:scale-105 active:scale-95"
                >
                 <DotLottieReact src="/rupeediscount.lottie" loop autoplay className="h-10 w-10" />
                 Get Best Rate
                </button>
              </div>
              <p className="text-4xl font-black text-slate-900">
                ₹{rupees(emiMonthly)}<span className="text-base font-medium text-slate-500">/mo</span>
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <p className="text-slate-500 mb-0.5">Down (20%)</p>
                  <p className="font-bold text-slate-800">₹{rupees(currentPrice * 0.2)}</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <p className="text-slate-500 mb-0.5">Rate</p>
                  <p className="font-bold text-slate-800">9.5%</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <p className="text-slate-500 mb-0.5">Tenure</p>
                  <p className="font-bold text-slate-800">3 years</p>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-slate-500">
                * Indicative. Actual EMI depends on bank, credit score, and tenure.
              </p>
            </div>

            <button
              onClick={scrollToOwnership}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-[#10855f] hover:bg-[#34ebb1]/15 hover:border-[#34ebb1]/40 transition-colors shadow-xs"
            >
              <ArrowDown size={15} /> Detailed EMI Calculator below
            </button>
          </div>
        )}

        {/* Energy tab */}
        {activeTab === "energy" && (
          <EnergyTabContent item={item} evEfficiency={evEfficiency} dbFuelPrices={dbFuelPrices} />
        )}
      </div>

      {/* ── CTAs ── */}
      </div>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <EnquiryTrigger vehicle={`${item.brand} ${item.title}`} />
        <CompareButton slug={slug} name={`${item.brand} ${item.title}`} />
        <Link href="/catalog"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-350 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs">
          <ArrowLeft size={15} /> Catalog
        </Link>
      </div>
    </div>
  );
}

// ── Energy Tab with Fuel Type / Models sub-tabs ──────────────────────────────

type EnergySubTab = "fuel" | "models";

const MAJOR_CITIES = [
  { value: "delhi", label: "Delhi" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bangalore", label: "Bangalore" },
  { value: "chennai", label: "Chennai" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "pune", label: "Pune" },
  { value: "kolkata", label: "Kolkata" },
  { value: "ahmedabad", label: "Ahmedabad" },
  { value: "jaipur", label: "Jaipur" },
  { value: "kochi", label: "Kochi" },
];

function EnergyTabContent({ item, evEfficiency, dbFuelPrices = [] }: {
  item: EvListing; evEfficiency: number; dbFuelPrices?: any[];
}) {
  const [subTab, setSubTab] = useState<EnergySubTab>("fuel");
  const [selectedCity, setSelectedCity] = useState("");
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [localPrices, setLocalPrices] = useState<any[]>(dbFuelPrices || []);

  useEffect(() => {
    setLocalPrices(dbFuelPrices || []);
  }, [dbFuelPrices]);

  const { selectedIndex, activeVariants } = useProductSelection();
  const activeVariant = activeVariants?.[selectedIndex];

  const handleCityChange = async (cityName: string) => {
    setSelectedCity(cityName);
    if (!cityName) return;

    const existing = localPrices.find(p => p.city.toLowerCase() === cityName.toLowerCase());
    
    if (!existing || MAJOR_CITIES.some(c => c.label.toLowerCase() === cityName.toLowerCase())) {
      setLoadingPrice(true);
      try {
        const res = await fetch(`/api/team/live-fuel-prices?city=${encodeURIComponent(cityName.toLowerCase())}`);
        const data = await res.json();
        if (data.success) {
          const newRate = {
            city: data.city,
            petrol_per_litre: data.petrol,
            diesel_per_litre: data.diesel,
            cng_per_kg: data.cng,
            electricity_per_kwh: data.electricity,
          };
          
          setLocalPrices(prev => {
            const filtered = prev.filter(p => p.city.toLowerCase() !== data.city.toLowerCase());
            return [...filtered, newRate];
          });
        }
      } catch (err) {
        console.error("Error fetching live price:", err);
      } finally {
        setLoadingPrice(false);
      }
    }
  };

  const allCityOptions = useMemo(() => {
    const optionsMap = new Map<string, string>();
    
    MAJOR_CITIES.forEach(c => optionsMap.set(c.label.toLowerCase(), c.label));
    dbFuelPrices.forEach(p => optionsMap.set(p.city.toLowerCase(), p.city));
    
    return Array.from(optionsMap.values()).sort();
  }, [dbFuelPrices]);

  const cityPrice = localPrices.find(p => p.city.toLowerCase() === selectedCity.toLowerCase());

  const petrolPrice = cityPrice ? (cityPrice.petrol_per_litre ?? 104) : 104;
  const dieselPrice = cityPrice ? (cityPrice.diesel_per_litre ?? 90) : 90;
  const cngPrice = cityPrice ? (cityPrice.cng_per_kg ?? 80) : 80;
  const electricityPrice = cityPrice ? (cityPrice.electricity_per_kwh ?? 9) : 9;

  const evCostPerKm = evEfficiency * electricityPrice;
  const petrolCostPerKm = petrolPrice / 18;
  const cngCostPerKm = cngPrice / 28;
  const dieselCostPerKm = dieselPrice / 22;

  const selfEntry = item.energyComparison.find(c => c.fuelType?.toLowerCase() === "self");
  const parsedSelfCost = selfEntry ? parseFloat(selfEntry.fuelPrice) : NaN;
  const selfCostPerKm = selectedCity
    ? evCostPerKm
    : (Number.isFinite(parsedSelfCost) ? parsedSelfCost : evCostPerKm);

  const currentVehicleSubtitle = selfEntry
    ? `${selfEntry.modelused ? `${selfEntry.modelused} - ` : ""}Rs ${selfCostPerKm.toFixed(1)}/km - ${selfEntry.mileage || activeVariant?.range || "300"} km range`
    : `Estimated at ₹${selfCostPerKm.toFixed(1)}/km (${(activeVariant?.range || 300)} km range)`;

  // Models = all entries from Supabase/WP energy comparisons (except "self")
  const modelEntries = item.energyComparison.filter(c => c.fuelType?.toLowerCase() !== "self");

  return (
    <div className="space-y-4">
      {/* City selector dropdown */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 shadow-xs focus-within:border-[#34ebb1]/50">
          <span className="text-[#10855f]">⚡ Select City:</span>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="flex-1 bg-transparent text-xs font-extrabold text-[#10855f] outline-none cursor-pointer"
            disabled={loadingPrice}
          >
            <option value="" className="bg-white text-slate-900 font-semibold">National Average</option>
            {allCityOptions.map((city) => (
              <option key={city} value={city} className="bg-white text-slate-900 font-semibold">
                {city}
              </option>
            ))}
          </select>
          {loadingPrice && (
            <span className="animate-pulse text-[10px] text-[#10855f] shrink-0">
              Fetching live rates...
            </span>
          )}
        </div>
        
        {/* Inline showing of rates for the selected city */}
        {selectedCity && cityPrice && !loadingPrice && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-1.5 bg-[#34ebb1]/15 rounded-xl text-[10px] font-bold text-slate-800 border border-[#34ebb1]/30 shadow-xs">
            <span>Petrol: <span className="text-[#10855f]">₹{cityPrice.petrol_per_litre?.toFixed(1)}/L</span></span>
            <span>Diesel: <span className="text-[#10855f]">₹{cityPrice.diesel_per_litre?.toFixed(1)}/L</span></span>
            <span>CNG: <span className="text-[#10855f]">₹{cityPrice.cng_per_kg?.toFixed(1)}/kg</span></span>
            <span>EV: <span className="text-[#10855f]">₹{cityPrice.electricity_per_kwh?.toFixed(1)}/kWh</span></span>
          </div>
        )}
      </div>

      {/* Sub-tabs: Fuel Type | Models */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
        <button onClick={() => setSubTab("fuel")} className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${subTab === "fuel" ? "bg-[#34ebb1] text-slate-950 font-black shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"}`}>
          Fuel Type
        </button>
        <button onClick={() => setSubTab("models")} className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${subTab === "models" ? "bg-[#34ebb1] text-slate-950 font-black shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"}`}>
          Models {modelEntries.length > 0 && <span className="ml-1 text-[8px] bg-slate-200 text-slate-700 rounded-full px-1.5">{modelEntries.length}</span>}
        </button>
      </div>

      {/* Fuel Type — generic commodity comparison */}
      {subTab === "fuel" && (
        <>
          <CurrentVehicleCostCard name={item.title} subtitle={currentVehicleSubtitle} costPerKm={selfCostPerKm} />
          <CompareCard name="Avg Petrol Vehicle" subtitle={`Petrol · ₹${petrolPrice.toFixed(1)}/L · 18 km/L`} costPerKm={petrolCostPerKm} isEv={false} />
          <CompareCard name="Avg Diesel Vehicle" subtitle={`Diesel · ₹${dieselPrice.toFixed(1)}/L · 22 km/L`} costPerKm={dieselCostPerKm} isEv={false} />
          <CompareCard name="Avg CNG Vehicle" subtitle={`CNG · ₹${cngPrice.toFixed(1)}/kg · 28 km/kg`} costPerKm={cngCostPerKm} isEv={false} />
        </>
      )}

      {/* Models — all entries from team dashboard */}
      {subTab === "models" && (
        <>
          <CurrentVehicleCostCard name={item.title} subtitle={currentVehicleSubtitle} costPerKm={selfCostPerKm} />
          {modelEntries.length > 0 ? modelEntries.map((comp, i) => {
            const fuel = comp.fuelType?.toLowerCase() ?? "petrol";
            const isEv = fuel === "ev" || fuel === "self";
            const isCng = fuel === "cng";

            let fuelPrice = parseFloat(comp.fuelPrice) || 0;
            if (selectedCity && cityPrice) {
              if (fuel === "petrol") fuelPrice = petrolPrice;
              else if (fuel === "diesel") fuelPrice = dieselPrice;
              else if (fuel === "cng") fuelPrice = cngPrice;
              else if (isEv) fuelPrice = electricityPrice;
            }

            const mileage = parseFloat(comp.mileage) || 1;
            
            const baseEvRate = 8;
            const costPerKm = isEv 
              ? (selectedCity ? (fuelPrice * (electricityPrice / baseEvRate)) : fuelPrice)
              : (fuelPrice / mileage);

            const displayPriceStr = isEv
              ? (selectedCity ? (fuelPrice * (electricityPrice / baseEvRate)).toFixed(1) : fuelPrice.toFixed(1))
              : fuelPrice.toFixed(1);

            const subtitle = isEv
              ? `${comp.fuelType} · ₹${displayPriceStr}/km · ${comp.mileage} km range`
              : `${comp.fuelType} · ₹${displayPriceStr}/${isCng ? "kg" : "L"} · ${comp.mileage} km/${isCng ? "kg" : "L"}`;

            return (
              <CompareCard key={i} name={comp.name} subtitle={subtitle}
                costPerKm={costPerKm} isEv={isEv} modelused={comp.modelused} />
            );
          }) : (
            <p className="text-center text-xs text-slate-500 py-6">No competitor models added yet.</p>
          )}
        </>
      )}
    </div>
  );
}

function CurrentVehicleCostCard({ name, subtitle, costPerKm }: {
  name: string; subtitle: string; costPerKm: number;
}) {
  return (
    <div className="rounded-2xl border border-[#34ebb1] bg-[#34ebb1] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center">
            <Zap size={18} className="text-[#34ebb1]" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-955">{name}</p>
            <p className="text-[10px] text-slate-800 font-semibold">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-900 uppercase">Cost/km</p>
          <p className="text-2xl font-black text-slate-955">₹{costPerKm.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}

function CompareCard({ name, subtitle, costPerKm, isEv, modelused }: {
  name: string; subtitle: string; costPerKm: number; isEv: boolean; modelused?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-[#34ebb1]/20 flex items-center justify-center text-slate-500">
            {isEv ? <Zap size={18} /> : <Fuel size={18} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{name}</p>
            <p className="text-[10px] text-slate-500">
              {modelused && <span className="font-medium text-slate-650">{modelused} · </span>}
              {subtitle}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-500 uppercase">Cost/km</p>
          <p className="text-xl font-black text-slate-800">₹{costPerKm.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}
