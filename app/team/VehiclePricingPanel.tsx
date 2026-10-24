"use client";

/**
 * VehiclePricingPanel
 *
 * Streamlined Location & On-Road Pricing Manager:
 *   - Select or Add Cities easily (Delhi, Mumbai, Bengaluru, etc.)
 *   - 1-Click Popular / Common Add-ons (Road Tax %, Insurance %, Registration, FastTag, State Subsidy)
 *   - Add custom extra charges / deductions
 *   - Live on-road price calculation & 1-click apply to EV listings
 */

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Save, Loader2, IndianRupee, MapPin,
  Sparkles, CheckCircle2, RotateCcw, AlertCircle,
  Percent, Shield, FileText, Truck, Tag, Gift, Sliders, Check
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CalculationType = "percentage" | "fixed";

export type AddonCharge = {
  id: string;
  label: string;
  calculation_type: CalculationType;
  rate: string;         // % (e.g. "4") or ₹ (e.g. "1500")
  max_cap?: string;     // optional cap in ₹ for %
  is_deduction?: boolean; // true for subsidies/discounts
  amount: string;       // computed or fixed ₹
};

export type CityPricingRule = {
  id: string;
  cityName: string;
  state: string;
  addons: AddonCharge[];
};

export type EvListing = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price_bracket?: string;
  variants?: Array<{ variant_name: string; id?: string; price?: number | null }>;
};

// ── Popular / Common Add-on Presets ──────────────────────────────────────────

export const COMMON_ADDON_PRESETS: Array<{
  key: string;
  label: string;
  icon: any;
  defaultType: CalculationType;
  defaultRate: string;
  defaultCap?: string;
  isDeduction?: boolean;
}> = [
  { key: "rto", label: "Road Tax (RTO)", icon: FileText, defaultType: "percentage", defaultRate: "4", defaultCap: "45000", isDeduction: false },
  { key: "ins", label: "Comprehensive Insurance", icon: Shield, defaultType: "percentage", defaultRate: "3.5", defaultCap: "35000", isDeduction: false },
  { key: "reg", label: "Registration & Smart Card", icon: Tag, defaultType: "fixed", defaultRate: "1500", isDeduction: false },
  { key: "hsrp", label: "FastTag & HSRP Plate", icon: Tag, defaultType: "fixed", defaultRate: "600", isDeduction: false },
  { key: "handling", label: "Logistics & Handling", icon: Truck, defaultType: "fixed", defaultRate: "2000", isDeduction: false },
  { key: "subsidy", label: "State EV Subsidy", icon: Gift, defaultType: "fixed", defaultRate: "10000", isDeduction: true },
];

// Default City Profiles
export const DEFAULT_CITIES: CityPricingRule[] = [
  {
    id: "delhi",
    cityName: "Delhi",
    state: "Delhi",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "0", max_cap: "0", is_deduction: false, amount: "0" },
      { id: "2", label: "Registration & Smart Card", calculation_type: "fixed", rate: "600", amount: "600", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.2", max_cap: "35000", amount: "35000", is_deduction: false },
      { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "800", amount: "800", is_deduction: false },
      { id: "5", label: "Delhi State EV Subsidy", calculation_type: "fixed", rate: "10000", amount: "10000", is_deduction: true },
    ],
  },
  {
    id: "bangalore",
    cityName: "Bangalore",
    state: "Karnataka",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "4", max_cap: "50000", is_deduction: false, amount: "50000" },
      { id: "2", label: "Registration & Cess", calculation_type: "fixed", rate: "1800", amount: "1800", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.5", max_cap: "40000", amount: "40000", is_deduction: false },
      { id: "4", label: "Logistics & Handling", calculation_type: "fixed", rate: "2500", amount: "2500", is_deduction: false },
      { id: "5", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "600", amount: "600", is_deduction: false },
    ],
  },
  {
    id: "mumbai",
    cityName: "Mumbai",
    state: "Maharashtra",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "0", max_cap: "0", is_deduction: false, amount: "0" },
      { id: "2", label: "Registration Charges", calculation_type: "fixed", rate: "1500", amount: "1500", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.3", max_cap: "38000", amount: "38000", is_deduction: false },
      { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "750", amount: "750", is_deduction: false },
      { id: "5", label: "Maharashtra EV Subsidy", calculation_type: "fixed", rate: "5000", amount: "5000", is_deduction: true },
    ],
  },
  {
    id: "chennai",
    cityName: "Chennai",
    state: "Tamil Nadu",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "0", max_cap: "0", is_deduction: false, amount: "0" },
      { id: "2", label: "Registration Fees", calculation_type: "fixed", rate: "1200", amount: "1200", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.4", max_cap: "36000", amount: "36000", is_deduction: false },
      { id: "4", label: "Logistics & Handling", calculation_type: "fixed", rate: "2000", amount: "2000", is_deduction: false },
      { id: "5", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "500", amount: "500", is_deduction: false },
    ],
  },
  {
    id: "hyderabad",
    cityName: "Hyderabad",
    state: "Telangana",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "4", max_cap: "45000", is_deduction: false, amount: "45000" },
      { id: "2", label: "Registration Charges", calculation_type: "fixed", rate: "1500", amount: "1500", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.5", max_cap: "35000", amount: "35000", is_deduction: false },
      { id: "4", label: "Logistics & Handling", calculation_type: "fixed", rate: "2000", amount: "2000", is_deduction: false },
      { id: "5", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "600", amount: "600", is_deduction: false },
    ],
  },
  {
    id: "pune",
    cityName: "Pune",
    state: "Maharashtra",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "0", max_cap: "0", is_deduction: false, amount: "0" },
      { id: "2", label: "Registration Charges", calculation_type: "fixed", rate: "1500", amount: "1500", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.3", max_cap: "38000", amount: "38000", is_deduction: false },
      { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "750", amount: "750", is_deduction: false },
    ],
  },
  {
    id: "kochi",
    cityName: "Kochi",
    state: "Kerala",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "5", max_cap: "45000", is_deduction: false, amount: "45000" },
      { id: "2", label: "Registration & Smart Card", calculation_type: "fixed", rate: "1600", amount: "1600", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.5", max_cap: "35000", amount: "35000", is_deduction: false },
      { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "600", amount: "600", is_deduction: false },
    ],
  },
  {
    id: "kolkata",
    cityName: "Kolkata",
    state: "West Bengal",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "4", max_cap: "40000", is_deduction: false, amount: "40000" },
      { id: "2", label: "Registration Charges", calculation_type: "fixed", rate: "1500", amount: "1500", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.4", max_cap: "35000", amount: "35000", is_deduction: false },
      { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "600", amount: "600", is_deduction: false },
    ],
  },
  {
    id: "ahmedabad",
    cityName: "Ahmedabad",
    state: "Gujarat",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "4", max_cap: "42000", is_deduction: false, amount: "42000" },
      { id: "2", label: "Registration Charges", calculation_type: "fixed", rate: "1500", amount: "1500", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.5", max_cap: "35000", amount: "35000", is_deduction: false },
      { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "600", amount: "600", is_deduction: false },
    ],
  },
  {
    id: "jaipur",
    cityName: "Jaipur",
    state: "Rajasthan",
    addons: [
      { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "4", max_cap: "40000", is_deduction: false, amount: "40000" },
      { id: "2", label: "Registration Charges", calculation_type: "fixed", rate: "1200", amount: "1200", is_deduction: false },
      { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.3", max_cap: "32000", amount: "32000", is_deduction: false },
      { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "500", amount: "500", is_deduction: false },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calculateAddonAmount(addon: Partial<AddonCharge>, showroomPriceNum: number): number {
  if (addon.calculation_type === "percentage") {
    const rateNum = parseFloat(addon.rate || "0") || 0;
    let computed = (showroomPriceNum * rateNum) / 100;
    
    if (addon.max_cap && addon.max_cap.trim() !== "") {
      const capNum = parseFloat(addon.max_cap);
      if (!isNaN(capNum) && capNum > 0 && computed > capNum) {
        computed = capNum;
      }
    }
    
    const rounded = Math.round(computed);
    return addon.is_deduction ? -Math.abs(rounded) : rounded;
  } else {
    const val = parseFloat(addon.amount || addon.rate || "0") || 0;
    return addon.is_deduction ? -Math.abs(val) : val;
  }
}

export const fmtLakh = (val: string | number) => {
  const n = parseFloat(String(val));
  if (isNaN(n)) return "₹0";
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

// Legacy export for backward compatibility with imports in TeamDashboard
export const DEFAULT_AREA_RULES = DEFAULT_CITIES.map(c => ({
  id: c.id,
  name: `${c.cityName} Pricing Rule`,
  area_type: "State" as const,
  state: c.state,
  description: `${c.cityName} EV policy & on-road charges`,
  addons: c.addons.map(({ id: _id, amount: _amount, ...rest }) => rest),
}));

// ── Component ──────────────────────────────────────────────────────────────────

export default function VehiclePricingPanel({
  supabase,
  userEmail: _userEmail,
  listings = [],
}: {
  supabase: any;
  userEmail?: string;
  listings?: EvListing[];
}) {
  const [cities, setCities] = useState<CityPricingRule[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("evezy_city_pricing_rules");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_CITIES;
  });

  const [selectedCityId, setSelectedCityId] = useState<string>(DEFAULT_CITIES[0].id);
  const [newCityName, setNewCityName] = useState("");
  const [showAddCity, setShowAddCity] = useState(false);
  
  // Sample Ex-Showroom price for live preview
  const [sampleShowroomPrice, setSampleShowroomPrice] = useState<string>("1500000"); // 15 Lakh
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active City Rule
  const activeCity = useMemo(() => {
    return cities.find(c => c.id === selectedCityId) || cities[0];
  }, [cities, selectedCityId]);

  // Save to localStorage whenever rules change
  useEffect(() => {
    if (typeof window !== "undefined" && cities.length > 0) {
      localStorage.setItem("evezy_city_pricing_rules", JSON.stringify(cities));
    }
  }, [cities]);

  // Compute live breakdown for current city & sample showroom price
  const showroomNum = parseFloat(sampleShowroomPrice) || 0;

  const breakdown = useMemo(() => {
    let additionsTotal = 0;
    let deductionsTotal = 0;

    const rows = activeCity.addons.map(addon => {
      const amt = calculateAddonAmount(addon, showroomNum);
      const isDed = !!addon.is_deduction || amt < 0;
      const absAmt = Math.abs(amt);

      if (isDed) {
        deductionsTotal += absAmt;
      } else {
        additionsTotal += absAmt;
      }

      let capHit = false;
      if (addon.calculation_type === "percentage" && addon.max_cap && parseFloat(addon.max_cap) > 0) {
        const raw = (showroomNum * (parseFloat(addon.rate) || 0)) / 100;
        if (raw > parseFloat(addon.max_cap)) capHit = true;
      }

      return {
        ...addon,
        finalAmount: absAmt,
        isDeduction: isDed,
        capHit,
      };
    });

    const netAddons = additionsTotal - deductionsTotal;
    const finalOnRoad = showroomNum + netAddons;

    return {
      rows,
      additionsTotal,
      deductionsTotal,
      netAddons,
      finalOnRoad,
    };
  }, [activeCity, showroomNum]);

  // ── Addon Management Handlers ────────────────────────────────────────────────

  const handleAddPreset = (preset: typeof COMMON_ADDON_PRESETS[0]) => {
    const existing = activeCity.addons.some(a => a.label.toLowerCase() === preset.label.toLowerCase());
    if (existing) {
      alert(`"${preset.label}" is already added to ${activeCity.cityName}.`);
      return;
    }

    const newAddon: AddonCharge = {
      id: Math.random().toString(36).slice(2, 9),
      label: preset.label,
      calculation_type: preset.defaultType,
      rate: preset.defaultRate,
      max_cap: preset.defaultCap || "",
      is_deduction: !!preset.isDeduction,
      amount: preset.defaultRate,
    };

    setCities(prev => prev.map(c => c.id === activeCity.id ? { ...c, addons: [...c.addons, newAddon] } : c));
  };

  const handleAddCustomExtra = () => {
    const newAddon: AddonCharge = {
      id: Math.random().toString(36).slice(2, 9),
      label: "Extra / Special Charge",
      calculation_type: "fixed",
      rate: "1000",
      max_cap: "",
      is_deduction: false,
      amount: "1000",
    };
    setCities(prev => prev.map(c => c.id === activeCity.id ? { ...c, addons: [...c.addons, newAddon] } : c));
  };

  const handleUpdateAddon = (addonId: string, patch: Partial<AddonCharge>) => {
    setCities(prev => prev.map(c => {
      if (c.id !== activeCity.id) return c;
      const updated = c.addons.map(a => a.id === addonId ? { ...a, ...patch } : a);
      return { ...c, addons: updated };
    }));
  };

  const handleRemoveAddon = (addonId: string) => {
    setCities(prev => prev.map(c => {
      if (c.id !== activeCity.id) return c;
      return { ...c, addons: c.addons.filter(a => a.id !== addonId) };
    }));
  };

  // ── City Management Handlers ─────────────────────────────────────────────────

  const handleAddNewCity = () => {
    if (!newCityName.trim()) return;
    const name = newCityName.trim();
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (cities.some(c => c.id === id || c.cityName.toLowerCase() === name.toLowerCase())) {
      alert("City already exists!");
      return;
    }

    const newCity: CityPricingRule = {
      id,
      cityName: name,
      state: name,
      // Default standard EV charges
      addons: [
        { id: "1", label: "Road Tax (RTO)", calculation_type: "percentage", rate: "4", max_cap: "45000", is_deduction: false, amount: "45000" },
        { id: "2", label: "Registration Charges", calculation_type: "fixed", rate: "1500", amount: "1500", is_deduction: false },
        { id: "3", label: "Comprehensive Insurance", calculation_type: "percentage", rate: "3.5", max_cap: "35000", amount: "35000", is_deduction: false },
        { id: "4", label: "FastTag & HSRP Plate", calculation_type: "fixed", rate: "600", amount: "600", is_deduction: false },
      ],
    };

    setCities(prev => [...prev, newCity]);
    setSelectedCityId(id);
    setNewCityName("");
    setShowAddCity(false);
  };

  const handleDeleteCity = (cityId: string) => {
    if (cities.length <= 1) {
      alert("You must have at least one city.");
      return;
    }
    if (!confirm(`Delete ${activeCity.cityName}?`)) return;
    const remaining = cities.filter(c => c.id !== cityId);
    setCities(remaining);
    setSelectedCityId(remaining[0].id);
  };

  const handleResetDefaults = () => {
    if (!confirm("Reset all cities and addons to official default benchmarks?")) return;
    setCities(DEFAULT_CITIES);
    setSelectedCityId(DEFAULT_CITIES[0].id);
  };

  // ── Apply City Rules to All EV Listings in Supabase ───────────────────────────

  const handleApplyToAllListings = async () => {
    if (listings.length === 0) {
      alert("No EV listings found to apply pricing.");
      return;
    }

    const confirmMsg = `Apply pricing rules for ${cities.length} cities to all ${listings.length} EV listings?\nThis will calculate and save city on-road prices for all models and variants.`;
    if (!confirm(confirmMsg)) return;

    setApplyingBulk(true);
    let successCount = 0;

    try {
      for (const listing of listings) {
        // Calculate city pricing entries for this listing
        const defaultVarPrice = listing.variants?.[0]?.price ? Number(listing.variants[0].price) : 1000000;
        const generatedCityPricing: any[] = [];

        cities.forEach(cityObj => {
          // 1. Base model
          let baseNet = 0;
          cityObj.addons.forEach(a => {
            const amt = calculateAddonAmount(a, defaultVarPrice);
            baseNet += a.is_deduction ? -Math.abs(amt) : amt;
          });
          const baseOnRoad = defaultVarPrice + baseNet;

          generatedCityPricing.push({
            id: Math.random().toString(36).substring(2, 9),
            location_name: cityObj.cityName,
            location_type: "City",
            showroom_price: (defaultVarPrice / 100000).toFixed(2),
            on_road_price: (baseOnRoad / 100000).toFixed(2),
            variant_id: null,
          });

          // 2. Each variant
          if (listing.variants && listing.variants.length > 0) {
            listing.variants.forEach(v => {
              if (!v.variant_name) return;
              const vPrice = v.price ? Number(v.price) : defaultVarPrice;
              let vNet = 0;
              cityObj.addons.forEach(a => {
                const amt = calculateAddonAmount(a, vPrice);
                vNet += a.is_deduction ? -Math.abs(amt) : amt;
              });
              const vOnRoad = vPrice + vNet;

              generatedCityPricing.push({
                id: Math.random().toString(36).substring(2, 9),
                location_name: cityObj.cityName,
                location_type: "City",
                showroom_price: (vPrice / 100000).toFixed(2),
                on_road_price: (vOnRoad / 100000).toFixed(2),
                variant_id: v.id || v.variant_name,
              });
            });
          }
        });

        // Save to Supabase
        const { error } = await supabase
          .from("evlistings")
          .update({ city_pricing: generatedCityPricing })
          .eq("id", listing.id);

        if (!error) {
          successCount++;
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      alert(`🎉 Successfully updated on-road city pricing across ${successCount} vehicle listings!`);
    } catch (err: any) {
      alert("Error applying pricing: " + err.message);
    } finally {
      setApplyingBulk(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <IndianRupee size={22} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              City & On-Road Pricing
            </h2>
            <p className="text-xs text-ink-mute mt-0.5">
              Select cities, toggle popular add-ons (% or max cap), or add custom extra charges.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleApplyToAllListings}
            disabled={applyingBulk}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {applyingBulk ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Applying to Listings...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 size={16} /> Applied Successfully!
              </>
            ) : (
              <>
                <Sparkles size={16} /> Apply to All EV Listings
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 1. CITIES SELECTOR BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              1. Select or Add City ({cities.length} configured)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCity(!showAddCity)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer w-fit"
          >
            <Plus size={13} /> Add New City
          </button>
        </div>

        {/* Add City Input Bar */}
        {showAddCity && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
            <input
              type="text"
              value={newCityName}
              onChange={e => setNewCityName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddNewCity()}
              placeholder="Enter city name (e.g. Chandigarh, Lucknow, Indore)"
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddNewCity}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Add City
            </button>
            <button
              type="button"
              onClick={() => setShowAddCity(false)}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        {/* City Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {cities.map(city => {
            const isSelected = city.id === activeCity.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCityId(city.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  isSelected
                    ? "bg-white text-ink shadow-md scale-102"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80"
                }`}
              >
                <span>{city.cityName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {city.addons.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. ADDONS & PRICING BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 cols: Popular Presets + Configured Addons */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick Popular Add-ons Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-600" />
                2. Popular & Common Add-ons
              </span>
              <span className="text-[11px] text-ink-mute">1-Click Add to {activeCity.cityName}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_ADDON_PRESETS.map(preset => {
                const isAlreadyAdded = activeCity.addons.some(a => a.label.toLowerCase() === preset.label.toLowerCase());
                const Icon = preset.icon;

                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    disabled={isAlreadyAdded}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      isAlreadyAdded
                        ? "bg-slate-50 border-slate-200 text-ink-mute opacity-60 cursor-not-allowed"
                        : "bg-emerald-50/50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-950 shadow-xs"
                    }`}
                  >
                    <Icon size={14} className={isAlreadyAdded ? "text-ink-mute" : "text-emerald-600"} />
                    <span className="truncate">{preset.label}</span>
                    {isAlreadyAdded && <Check size={12} className="ml-auto text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configured Addons List */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Charges & Deductions for</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {activeCity.cityName}
                  </span>
                </h3>
                <p className="text-[11px] text-ink-mute mt-0.5">
                  Configure % rates with optional max caps, fixed amounts, or government subsidies.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCustomExtra}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-ink hover:bg-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={13} /> + Add Extra Item
              </button>
            </div>

            {/* List of Addons */}
            {activeCity.addons.length === 0 ? (
              <div className="text-center py-8 text-ink-mute text-xs font-semibold">
                No charges added for {activeCity.cityName}. Click a popular preset above or "+ Add Extra Item".
              </div>
            ) : (
              <div className="space-y-3">
                {activeCity.addons.map((addon, index) => {
                  const isPercent = addon.calculation_type === "percentage";
                  const computedPreview = calculateAddonAmount(addon, showroomNum);

                  return (
                    <div
                      key={addon.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        addon.is_deduction
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-slate-50/80 border-slate-200"
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        
                        {/* Label */}
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                            Charge / Addon Name
                          </label>
                          <input
                            type="text"
                            value={addon.label}
                            onChange={e => handleUpdateAddon(addon.id, { label: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                            placeholder="e.g. Road Tax (RTO)"
                          />
                        </div>

                        {/* Type (% or Fixed) */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                            Type
                          </label>
                          <select
                            value={addon.calculation_type}
                            onChange={e => handleUpdateAddon(addon.id, { calculation_type: e.target.value as CalculationType })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                          >
                            <option value="percentage">% of Price</option>
                            <option value="fixed">₹ Fixed</option>
                          </select>
                        </div>

                        {/* Rate / Amount */}
                        <div className={isPercent ? "sm:col-span-2" : "sm:col-span-4"}>
                          <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                            {isPercent ? "Rate (%)" : "Amount (₹)"}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={addon.rate}
                              onChange={e => handleUpdateAddon(addon.id, { rate: e.target.value, amount: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg pl-2.5 pr-6 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                              placeholder={isPercent ? "4" : "1500"}
                            />
                            <span className="absolute right-2 top-1.5 text-xs font-bold text-ink-mute">
                              {isPercent ? "%" : "₹"}
                            </span>
                          </div>
                        </div>

                        {/* Max Cap (only for %) */}
                        {isPercent && (
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block mb-1" title="Maximum ₹ cap if % exceeds">
                              Max Cap (₹)
                            </label>
                            <input
                              type="number"
                              value={addon.max_cap || ""}
                              onChange={e => handleUpdateAddon(addon.id, { max_cap: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 placeholder:text-ink-mute"
                              placeholder="No Cap"
                            />
                          </div>
                        )}

                        {/* Actions & Deduction Check */}
                        <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                          <label className="flex items-center gap-1 cursor-pointer select-none text-[11px] font-semibold text-slate-600" title="Check if this is a discount or government subsidy">
                            <input
                              type="checkbox"
                              checked={!!addon.is_deduction}
                              onChange={e => handleUpdateAddon(addon.id, { is_deduction: e.target.checked })}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer h-3.5 w-3.5"
                            />
                            <span className="text-amber-700 text-[10px] font-bold">Subsidy</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveAddon(addon.id)}
                            className="p-1.5 text-ink-mute hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove charge"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Small Live Computed Note */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-mute border-t border-slate-200/60 pt-1">
                        <span>
                          {isPercent ? `${addon.rate || 0}% of Ex-Showroom ${addon.max_cap ? `(Max Cap: ₹${Number(addon.max_cap).toLocaleString("en-IN")})` : ""}` : "Fixed standard charge"}
                        </span>
                        <span className={`font-bold ${addon.is_deduction ? "text-emerald-700" : "text-slate-900"}`}>
                          Effective on ₹15L: {addon.is_deduction ? "-" : "+"}{fmtLakh(Math.abs(computedPreview))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Delete City Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-ink-mute">
                Rule ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">{activeCity.id}</code>
              </span>
              <button
                type="button"
                onClick={() => handleDeleteCity(activeCity.id)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Delete {activeCity.cityName}
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Live On-Road Price Preview & Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white text-ink p-5 rounded-2xl shadow-lg border border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-deep font-bold text-xs">
                  ⚡
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-ink">Live On-Road Calculator</h4>
                  <p className="text-[11px] text-ink-mute">{activeCity.cityName} On-Road Breakdown</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-brand-soft text-brand-deep text-xs font-bold border border-emerald-500/30">
                {activeCity.cityName}
              </span>
            </div>

            {/* Test Ex-Showroom Price Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                Test Ex-Showroom Price (₹)
              </label>
              <div className="relative">
                <IndianRupee size={15} className="absolute left-3 top-2.5 text-ink-mute" />
                <input
                  type="number"
                  value={sampleShowroomPrice}
                  onChange={e => setSampleShowroomPrice(e.target.value)}
                  className="w-full bg-white border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-ink outline-none focus:border-emerald-500"
                  placeholder="1500000"
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-ink-mute pt-0.5">
                <span>Quick test:</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setSampleShowroomPrice("800000")} className="hover:text-brand-deep">8L</button>
                  <span>•</span>
                  <button type="button" onClick={() => setSampleShowroomPrice("1500000")} className="hover:text-brand-deep">15L</button>
                  <span>•</span>
                  <button type="button" onClick={() => setSampleShowroomPrice("2500000")} className="hover:text-brand-deep">25L</button>
                  <span>•</span>
                  <button type="button" onClick={() => setSampleShowroomPrice("4500000")} className="hover:text-brand-deep">45L</button>
                </div>
              </div>
            </div>

            {/* Itemized Calculation Summary */}
            <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center text-ink-soft font-semibold">
                <span>Ex-Showroom Price</span>
                <span className="font-bold text-ink">{fmtLakh(showroomNum)}</span>
              </div>

              <div className="border-t border-slate-800 my-1 pt-1 space-y-1.5">
                {breakdown.rows.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-ink-mute flex items-center gap-1">
                      {r.isDeduction ? "🎁" : "+"} {r.label}
                      {r.capHit && <span className="text-[9px] bg-amber-500/20 text-[#0a4a30] px-1 rounded">Capped</span>}
                    </span>
                    <span className={r.isDeduction ? "text-brand-deep font-bold" : "text-ink-soft"}>
                      {r.isDeduction ? "-" : "+"} {fmtLakh(r.finalAmount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs font-bold text-ink-soft">
                <span>Total Net Additions</span>
                <span className={breakdown.netAddons >= 0 ? "text-ink-soft" : "text-brand-deep"}>
                  {breakdown.netAddons >= 0 ? "+" : "-"}{fmtLakh(Math.abs(breakdown.netAddons))}
                </span>
              </div>
            </div>

            {/* Total On-Road Price Box */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-deep">
                  Estimated On-Road Price ({activeCity.cityName})
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-ink mt-0.5">
                  {fmtLakh(breakdown.finalOnRoad)}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-ink-mute block">Difference</span>
                <span className="text-xs font-extrabold text-brand-deep">
                  +{((breakdown.netAddons / (showroomNum || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
