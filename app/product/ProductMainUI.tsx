"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import BatterySelector from "./BatterySelector";
import EnquiryTrigger from "./EnquiryTrigger";
import { triggerEnquiryModal } from "../components/EnquiryModal";
import CompareButton from "./CompareButton";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Gauge, Tag,
  BatteryCharging, Fuel, Zap, ChevronDown, Share2, Navigation, X,
} from "lucide-react";
import type { EvListing } from "../lib/wordpress";
import { useProductSelection } from "./ProductSelectionProvider";
import LoanCalculator from "../components/LoanCalculator";
import { supabase } from "../lib/supabase";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  { ssr: false }
);

type TabKey = "pricing" | "battery" | "energy";
const TABS = [
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "battery", label: "Battery", icon: BatteryCharging },
  { key: "energy", label: "Energy", icon: Fuel },
] as const;

function calcEmi(p: number, r: number, n: number) {
  const m = r / 12 / 100;
  return m === 0? p / n : (p * m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1);
}
function rupees(v: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v));
}

interface NetworkDetails {
  name: string;
  connectors: string;
  power: string;
  type: "charging" | "swapping";
}

const NETWORK_DETAILS: Record<string, NetworkDetails> = {
  statiq: {
    name: "Statiq Network",
    connectors: "CCS2 (DC), Type 2 (AC)",
    power: "50 kW DC / 22 kW AC",
    type: "charging",
  },
  honda: {
    name: "Honda e: Swap Network",
    connectors: "Honda Mobile Power Pack e:",
    power: "1.5 kW Swap Dock",
    type: "swapping",
  },
  vinfast: {
    name: "VinFast Charging Network",
    connectors: "CCS2, Type 2",
    power: "60 kW DC",
    type: "charging",
  },
  tata: {
    name: "Tata Power EZ Charge",
    connectors: "CCS2 (DC), Type 2 (AC)",
    power: "30 kW DC / 7.4 kW AC",
    type: "charging",
  },
  ather: {
    name: "Ather Grid",
    connectors: "Ather Connector / Type 2",
    power: "22 kW AC",
    type: "charging",
  },
  generic: {
    name: "Generic 15A Socket",
    connectors: "3-pin Home Plug",
    power: "3.3 kW AC",
    type: "charging",
  }
};

const getProductSupportedNetworks = (brand: string, type: string): string[] => {
  const b = brand.toLowerCase().trim();
  const t = type.toLowerCase().trim();
  
  if (b.includes("honda")) {
    return ["honda", "generic"];
  }
  if (b.includes("ather")) {
    return ["ather", "generic"];
  }
  if (b.includes("tata")) {
    return ["tata", "statiq", "generic"];
  }
  if (b.includes("vinfast")) {
    return ["vinfast", "statiq", "generic"];
  }
  if (b.includes("euler") || b.includes("grevol")) {
    return ["statiq", "generic"];
  }
  if (t.includes("car") || t.includes("4 wheeler")) {
    return ["statiq", "tata", "generic"];
  }
  return ["generic", "statiq"];
};

export default function ProductMainUI({ item, slug, dbFuelPrices = [], content = [], offers = [] }: { item: EvListing; slug: string; dbFuelPrices?: any[]; content?: any[]; offers?: any[] }) {
  const { selectedIndex, showBaas, activeVariants, setSelectedIndex: onSelect, setShowBaas: onToggleBaas } = useProductSelection();
  const [activeTab, setActiveTab] = useState<TabKey>("pricing");
  const [usageFilter, setUsageFilter] = useState("All");
  const [copied, setCopied] = useState(false);

  const hasUsageType = useMemo(() => {
    const isVal = (val: any) => {
      if (!val) return false;
      const s = String(val).toLowerCase().trim();
      return s !== "" && s !== "null" && s !== "none" && s !== "undefined";
    };
    const uniqueUsages = new Set<string>();
    if (isVal(item.usage_type)) {
      uniqueUsages.add(String(item.usage_type).toLowerCase().trim());
    }
    activeVariants.forEach(v => {
      if (isVal(v.usage_type)) {
        uniqueUsages.add(String(v.usage_type).toLowerCase().trim());
      }
    });
    return uniqueUsages.size > 1;
  }, [item.usage_type, activeVariants]);

  const handleShare = async () => {
    const shareData = {
      title: `${item.brand} ${item.title} | Evezy`,
      text: `Compare and explore ${item.brand} ${item.title} on Evezy!`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredVariants = useMemo(() => {
    const list = activeVariants.filter(v => usageFilter === "All"? true : (v.usage_type || item.usage_type || "Passenger").toLowerCase() === usageFilter.toLowerCase());
    return list.length? list : activeVariants;
  }, [activeVariants, usageFilter, item.usage_type]);

  const cleanPrice = (val?: string | null) => val? val.replace(/[₹,a-zA-Z\s]/g, "") : "";
  const activeVariant = activeVariants?.[selectedIndex];
  const isPriceBlank = activeVariant ? (activeVariant.price === "" || activeVariant.price === null || activeVariant.price === undefined) : false;
  const isFuture = useMemo(() => {
    if (!activeVariant) return false;
    if (activeVariant.usage_type && ["Coming Soon", "Announced", "Concept", "Facelift"].includes(activeVariant.usage_type)) {
      return true;
    }
    const launch_date = (activeVariant as any).launch_date;
    if (!launch_date) return false;
    const clean = launch_date.trim().toLowerCase();
    if (["tba", "coming soon", "concept", "announced", "facelift"].some((k: string) => clean.includes(k))) return true;
    const d = new Date(launch_date);
    if (isNaN(d.getTime())) {
      const matches = launch_date.match(/\d{4}/);
      if (matches) {
        const year = parseInt(matches[0]);
        return year > new Date().getFullYear();
      }
      return false;
    }
    return d > new Date();
  }, [activeVariant]);

  const selectedVariantName = activeVariant?.modelName || (activeVariant?.capacity? `${activeVariant.capacity} kWh` : "");
  const activeBatterySpec = item.batterySpecs.find(s => s.variantName === selectedVariantName) || item.batterySpecs[selectedIndex];
  const displayPriceRaw = isPriceBlank ? "" : (activeVariant?.price || item.prices?.[selectedIndex] || item.prices?.[0] || "");
  const priceVal = parseFloat(cleanPrice(displayPriceRaw)) || 10;
  const currentPrice = priceVal > 1000? priceVal : priceVal * 100000;
  const specificPriceStr = useMemo(() => {
    const v = parseFloat(cleanPrice(displayPriceRaw));
    return Number.isFinite(v) && v > 1000? (v / 100000).toFixed(2).replace(/\.00$/, "") : cleanPrice(displayPriceRaw);
  }, [displayPriceRaw]);
  const emiMonthly = useMemo(() => calcEmi(currentPrice * 0.8, 9.5, 36), [currentPrice]);
  const evEfficiency = activeVariant?.range? parseFloat(activeVariant.capacity) / parseFloat(activeVariant.range) : 0.14;

  const [stations, setStations] = useState<any[]>([]);
  const [showEmiCalculator, setShowEmiCalculator] = useState(false);
  const [chargers, setChargers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStations() {
      const staticLocs = [
        { id: "1", type: "charging", lat: 28.638807, lng: 77.085715, name: "EV Fast Charger",       address: "West Delhi", network: "Honda" },
        { id: "3", type: "charging", lat: 28.600843, lng: 77.087613, name: "Supercharger IndianOil", address: "North Delhi", network: "Statiq" },
        { id: "4", type: "spare",    lat: 28.627204, lng: 77.071554, name: "EV Repair and Spare",    address: "West Delhi", network: "VinFast" },
      ];
      
      let statiqLocs: any[] = [];
      try {
        const data = await import("../../public/statiq_stations.json");
        statiqLocs = data.default.map((s: any, idx: number) => ({
          id: `statiq-${idx}`,
          type: "charging",
          lat: s.lat,
          lng: s.lng,
          name: s.name,
          address: "Statiq EV Station",
          network: "Statiq",
        }));
      } catch (err) {
        console.warn("Could not load statiq stations", err);
      }
      
      let dbLocs: any[] = [];
      try {
        const { data, error } = await supabase.from("ev_stations").select("*");
        if (data && !error) {
          dbLocs = data.map((s: any) => ({
            id: String(s.id),
            type: s.type || "charging",
            lat: Number(s.lat),
            lng: Number(s.lng),
            name: s.name,
            address: s.address || `${s.city || 'EV'} Station`,
            network: s.network || "",
          }));
        }
      } catch (err) {
        console.warn("Could not load ev_stations from DB", err);
      }
      
      setStations([...staticLocs, ...statiqLocs, ...dbLocs]);
    }
    async function fetchChargers() {
      try {
        const { data } = await supabase.from("ev_chargers").select("*");
        if (data) setChargers(data);
      } catch (err) {
        console.warn("Could not load ev_chargers from DB", err);
      }
    }
    fetchStations();
    fetchChargers();
  }, []);

  const vehicleType = item.types?.[0] || "";
  const supportedNetworkKeys = useMemo(() => {
    return getProductSupportedNetworks(item.brand, vehicleType);
  }, [item.brand, vehicleType]);

  // Get all charger networks compatible with active vehicle
  const compatibleNetworks = useMemo(() => {
    const name = `${item.brand} ${item.title}`;
    return chargers
      .filter((c: any) => c.is_active && (
        c.compatible_vehicles.toLowerCase().includes(name.toLowerCase()) ||
        c.compatible_vehicles.toLowerCase().includes(item.slug.toLowerCase())
      ))
      .map((c: any) => c.network.toLowerCase().trim());
  }, [item.brand, item.title, item.slug, chargers]);

  const supportedStations = useMemo(() => {
    return stations.filter(station => {
      const net = (station.network || "").toLowerCase().trim();
      
      // If we have charger configurations in DB, use them:
      if (chargers.length > 0) {
        if (station.type === "spare") return true;
        const stationNets = net.split(",").map((n: string) => n.trim()).filter(Boolean);
        return stationNets.some((sn: string) => 
          compatibleNetworks.some((cn: string) => sn.includes(cn) || cn.includes(sn))
        );
      } else {
        // Fallback to static rules
        return supportedNetworkKeys.some(key => {
          const netDetail = NETWORK_DETAILS[key];
          return netDetail && (
            net.includes(key) ||
            net.includes(netDetail.name.toLowerCase()) ||
            (key === "generic" && net === "")
          );
        });
      }
    });
  }, [stations, chargers, compatibleNetworks, supportedNetworkKeys]);

  const getStationNetworkDetails = (network: string) => {
    const net = network.toLowerCase().trim();
    for (const key of Object.keys(NETWORK_DETAILS)) {
      const detail = NETWORK_DETAILS[key];
      if (net.includes(key) || net.includes(detail.name.toLowerCase())) {
        return detail;
      }
    }
    return NETWORK_DETAILS.generic;
  };

  return (
    <div className="flex flex-col gap-6 text-zinc-900 dark:text-zinc-100">
      <div className="rounded-[28px] border-2 border-black bg-white/70 backdrop-blur-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.05)] dark:bg-zinc-900/60 dark:border-zinc-800 p-5 sm:p-6">

        {/* selectors */}
        <div className={`mb-4 grid ${hasUsageType ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-3`}>
          {/* Model Selector */}
          <div className="relative flex items-center gap-2.5 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3.5 py-3 dark:bg-zinc-800/50 dark:border-zinc-700">
            <BatteryCharging size={16} className="text-emerald-600 shrink-0 pointer-events-none" />
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 leading-none mb-0.5 pointer-events-none">Model</span>
              <select
                value={selectedIndex}
                onChange={e => onSelect(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-semibold outline-none appearance-none pr-6 dark:text-white cursor-pointer relative z-10"
              >
                {filteredVariants.map(v => {
                  const idx = activeVariants.indexOf(v);
                  return <option key={idx} value={idx} className="dark:bg-zinc-900">{v.modelName || `${v.capacity} kWh`}</option>
                })}
              </select>
            </div>
            <ChevronDown size={14} className="text-zinc-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Usage Selector */}
          {hasUsageType && (
            <div className="relative flex items-center gap-2.5 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3.5 py-3 dark:bg-zinc-800/50 dark:border-zinc-700">
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 leading-none mb-0.5 pointer-events-none">Usage</span>
                <select
                  value={usageFilter}
                  onChange={e => setUsageFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none appearance-none pr-6 dark:text-white cursor-pointer relative z-10"
                >
                  <option className="dark:bg-zinc-900">All</option>
                  <option className="dark:bg-zinc-900">Passenger</option>
                  <option className="dark:bg-zinc-900">Goods</option>
                </select>
              </div>
              <ChevronDown size={14} className="text-zinc-400 absolute right-3 pointer-events-none" />
            </div>
          )}
        </div>

        {/* tabs */}
        <div className="flex rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition ${activeTab === t.key? "bg-white shadow-sm text-zinc-900 dark:bg-zinc-700 dark:text-white" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {activeTab === "pricing" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-zinc-50 to-white p-5 border border-zinc-200/60 dark:from-zinc-800/50 dark:to-zinc-900/50 dark:border-zinc-800">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-1">{showBaas? "BaaS Starting" : "Ex-Showroom"}</p>
                  {specificPriceStr ? (
                    <p className="text-[32px] font-semibold tracking-tight leading-none">₹{specificPriceStr}<span className="text-lg font-medium text-zinc-500 ml-1">Lakh</span></p>
                  ) : (
                    <p className="text-2xl font-semibold tracking-tight leading-none text-zinc-700 dark:text-zinc-300">{isFuture ? "Coming Soon" : "TBA"}</p>
                  )}
                </div>
                <button onClick={() => triggerEnquiryModal(`Offers: ${item.brand} ${item.title}`)} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition">
                  <DotLottieReact src="/Giftpremiumanimation.lottie" loop autoplay className="h-5 w-5" />Offers
                </button>
              </div>

              {specificPriceStr && (
                <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 dark:bg-zinc-900/50 dark:border-zinc-800 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 mb-1">EMI Starting at</p>
                    <p className="text-3xl font-semibold">₹{rupees(emiMonthly)}<span className="text-base font-normal text-zinc-500">/mo</span></p>
                  </div>
                  <button
                    onClick={() => setShowEmiCalculator(true)}
                    className="rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 px-4.5 py-2.5 text-xs font-bold transition shadow-md active:scale-95 shrink-0"
                  >
                    EMI Calculator
                  </button>
                </div>
              )}

              {/* Brand Offers */}
              {offers && offers.length > 0 && (
                <div className="rounded-2xl border border-emerald-250 bg-emerald-50/20 p-5 dark:bg-emerald-950/10 dark:border-emerald-900/40 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Available Offers</h4>
                  </div>
                  <div className="divide-y divide-emerald-100 dark:divide-emerald-900/30">
                    {offers.map((offer, idx) => (
                      <div key={offer.id || idx} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2.5">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white mt-0.5">
                            %
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{offer.text}</p>
                            <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                              {offer.cities && (
                                <span className="inline-flex rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium">
                                  Cities: {offer.cities}
                                </span>
                              )}
                              {offer.valid_until && (
                                <span className="inline-flex rounded-md bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-400">
                                  Valid till: {new Date(offer.valid_until).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {offer.image && (
                          <div className="relative w-full h-24 mt-1 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                            <Image 
                              src={offer.image} 
                              alt="Offer Banner" 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "battery" && (
            <div className="space-y-5">
              <BatterySelector standardVariants={item.batteryVariants} baasVariants={item.baasVariants} hasBaas={item.baas} selectedIndex={selectedIndex} onSelect={onSelect} showBaas={showBaas} onToggleBaas={onToggleBaas} hideVariantSelector cityPricing={item.city_pricing} />
              
              <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 dark:bg-zinc-900/50 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-[#10855f] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <BatteryCharging size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Compatible Charging Stations</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {supportedStations.length > 0 
                        ? `${Math.min(4, Math.max(1, supportedStations.length))} station${Math.min(4, Math.max(1, supportedStations.length)) !== 1 ? 's' : ''} available within 5km`
                        : "3 stations available within 5km"
                      }
                    </p>
                  </div>
                </div>
                <Link
                  href={`/map?model=${item.slug}`}
                  className="rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 px-4.5 py-2 text-xs font-bold transition shadow-md active:scale-95 shrink-0"
                >
                  Find on Map
                </Link>
              </div>
            </div>
          )}

          {activeTab === "energy" && (
            <EnergyTabContent item={item} evEfficiency={evEfficiency} dbFuelPrices={dbFuelPrices} />
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <EnquiryTrigger vehicle={`${item.brand} ${item.title}`} />
        <CompareButton slug={slug} name={`${item.brand} ${item.title}`} />
        <button
          onClick={handleShare}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition active:scale-95 shadow-xs"
        >
          <Share2 size={16} />
          {copied ? "Link Copied!" : "Share"}
        </button>
      </div>

      {/* EMI Calculator Popup Modal */}
      {showEmiCalculator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl relative border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">EMI Calculator</h3>
                <p className="text-xs text-zinc-555 dark:text-zinc-400">Calculate custom loan details for {item.brand} {item.title}</p>
              </div>
              <button 
                onClick={() => setShowEmiCalculator(false)} 
                className="text-slate-400 hover:text-slate-650 dark:text-zinc-500 dark:hover:text-zinc-350 transition p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] pr-1">
              <LoanCalculator initialPrice={currentPrice} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ENERGY TAB (now defined in same file) ──────────────────────────────
type EnergySubTab = "fuel" | "models";
const MAJOR_CITIES = ["Delhi","Mumbai","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Kochi"];

function EnergyTabContent({ item, evEfficiency, dbFuelPrices = [] }: { item: EvListing; evEfficiency: number; dbFuelPrices?: any[] }) {
  const [subTab, setSubTab] = useState<EnergySubTab>("fuel");
  const [selectedCity, setSelectedCity] = useState("");
  const [localPrices, setLocalPrices] = useState<any[]>(dbFuelPrices);
  const { selectedIndex, activeVariants } = useProductSelection();
  const activeVariant = activeVariants?.[selectedIndex];

  const cityPrice = localPrices.find(p => p.city.toLowerCase() === selectedCity.toLowerCase());
  const petrolPrice = cityPrice?.petrol_per_litre?? 104;
  const dieselPrice = cityPrice?.diesel_per_litre?? 90;
  const cngPrice = cityPrice?.cng_per_kg?? 80;
  const electricityPrice = cityPrice?.electricity_per_kwh?? 9;

  const evCostPerKm = evEfficiency * electricityPrice;
  const selfEntry = item.energyComparison.find(c => c.fuelType?.toLowerCase() === "self");
  const selfCostPerKm = selfEntry? parseFloat(selfEntry.fuelPrice) || evCostPerKm : evCostPerKm;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 dark:bg-zinc-800 dark:border-zinc-700">
        <span className="text-xs">⚡</span>
        <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="flex-1 bg-transparent text-sm font-medium outline-none">
          <option value="">National Average</option>
          {MAJOR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button onClick={() => setSubTab("fuel")} className={`flex-1 rounded-lg py-2 text-xs font-medium ${subTab==="fuel"?"bg-white shadow-sm dark:bg-zinc-700":"text-zinc-600 dark:text-zinc-400"}`}>Fuel Type</button>
        <button onClick={() => setSubTab("models")} className={`flex-1 rounded-lg py-2 text-xs font-medium ${subTab==="models"?"bg-white shadow-sm dark:bg-zinc-700":"text-zinc-600 dark:text-zinc-400"}`}>Models</button>
      </div>

      {subTab === "fuel" && (
        <>
          <CurrentVehicleCostCard name={item.title} costPerKm={selfCostPerKm} subtitle={`${activeVariant?.range || 300} km range`} />
          <CompareCard name="Petrol" subtitle={`₹${petrolPrice}/L · 18 km/L`} costPerKm={petrolPrice/18} isEv={false} />
          <CompareCard name="Diesel" subtitle={`₹${dieselPrice}/L · 22 km/L`} costPerKm={dieselPrice/22} isEv={false} />
          <CompareCard name="CNG" subtitle={`₹${cngPrice}/kg · 28 km/kg`} costPerKm={cngPrice/28} isEv={false} />
        </>
      )}

      {subTab === "models" && item.energyComparison.filter(c=>c.fuelType?.toLowerCase()!=="self").map((comp,i) => {
        const isEv = comp.fuelType?.toLowerCase()==="ev";
        const cost = isEv? evCostPerKm : (parseFloat(comp.fuelPrice)||0) / (parseFloat(comp.mileage)||1);
        return <CompareCard key={i} name={comp.name} subtitle={`${comp.fuelType} · ${comp.mileage} km`} costPerKm={cost} isEv={isEv} />
      })}
    </div>
  );
}

function CurrentVehicleCostCard({ name, subtitle, costPerKm }: { name: string; subtitle: string; costPerKm: number }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:bg-emerald-950/30 dark:border-emerald-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center"><Zap size={18} className="text-white" /></div>
          <div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-zinc-600 dark:text-zinc-400">{subtitle}</p></div>
        </div>
        <div className="text-right"><p className="text-[10px] uppercase text-zinc-500">Cost/km</p><p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400">₹{costPerKm.toFixed(1)}</p></div>
      </div>
    </div>
  );
}

function CompareCard({ name, subtitle, costPerKm, isEv }: { name: string; subtitle: string; costPerKm: number; isEv: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:bg-zinc-900/50 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
            {isEv? <Zap size={18} className="text-emerald-600" /> : <Fuel size={18} className="text-zinc-500" />}
          </div>
          <div><p className="text-sm font-medium">{name}</p><p className="text-xs text-zinc-500">{subtitle}</p></div>
        </div>
        <p className="text-xl font-semibold">₹{costPerKm.toFixed(1)}</p>
      </div>
    </div>
  );
}