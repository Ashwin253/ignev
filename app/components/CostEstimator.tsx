"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Fuel, MapPinned, Zap, Gauge } from "lucide-react";
import data from "../../own-cost-data.json";

type StateCost = {
  state: string;
  electricityRsPerKwh: number;
  petrolRsPerL: number;
  dieselRsPerL: number;
};

const stateCosts = data.stateCosts as StateCost[];
const defaults = data.defaults;

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
}

export default function CostEstimator({ initialPrice, efficiency }: { initialPrice?: number; efficiency?: number }) {
  const [selectedState, setSelectedState] = useState(stateCosts[0].state);
  const [dailyDistanceKm, setDailyDistanceKm] = useState(String(defaults.dailyDistanceKm));
  const [customFuelPricesEnabled, setCustomFuelPricesEnabled] = useState(false);
  
  const state = stateCosts.find((s) => s.state === selectedState) ?? stateCosts[0];
  
  const [customElectricityPrice, setCustomElectricityPrice] = useState(String(state.electricityRsPerKwh));
  const [customPetrolPrice, setCustomPetrolPrice] = useState(String(state.petrolRsPerL));
  const [customDieselPrice, setCustomDieselPrice] = useState(String(state.dieselRsPerL));

  const fuelPrices = customFuelPricesEnabled
    ? {
        electricityRsPerKwh: Number(customElectricityPrice) || state.electricityRsPerKwh,
        petrolRsPerL: Number(customPetrolPrice) || state.petrolRsPerL,
        dieselRsPerL: Number(customDieselPrice) || state.dieselRsPerL,
      }
    : state;

  const calculation = useMemo(() => {
    const daily = Number(dailyDistanceKm) || defaults.dailyDistanceKm;
    const eff = efficiency || defaults.evEfficiencyKwhPer100Km;
    
    const evMonthlyRunning = ((daily * 30) * eff * fuelPrices.electricityRsPerKwh) / 100;
    const petrolMonthlyRunning = ((daily * 30) / defaults.petrolMileageKmpl) * fuelPrices.petrolRsPerL;
    const dieselMonthlyRunning = ((daily * 30) / defaults.dieselMileageKmpl) * fuelPrices.dieselRsPerL;

    return {
      evMonthlyRunning,
      petrolMonthlyRunning,
      dieselMonthlyRunning,
      savings: petrolMonthlyRunning - evMonthlyRunning
    };
  }, [dailyDistanceKm, efficiency, fuelPrices]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3 text-emerald-400">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20">
          <Fuel size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Ride & Cost Estimator</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">EV vs Fuel Savings</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300">
            <MapPinned size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Select Your State</span>
          </div>
          <button
            onClick={() => setCustomFuelPricesEnabled(!customFuelPricesEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              customFuelPricesEnabled ? "bg-emerald-500" : "bg-white/10"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customFuelPricesEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <select
          value={selectedState}
          onChange={(e) => {
            const nextState = e.target.value;
            setSelectedState(nextState);
            const matched = stateCosts.find((s) => s.state === nextState);
            if (matched && !customFuelPricesEnabled) {
              setCustomElectricityPrice(String(matched.electricityRsPerKwh));
              setCustomPetrolPrice(String(matched.petrolRsPerL));
              setCustomDieselPrice(String(matched.dieselRsPerL));
            }
          }}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
        >
          {stateCosts.map((s) => (
            <option key={s.state} value={s.state} className="bg-slate-900">{s.state}</option>
          ))}
        </select>

        {customFuelPricesEnabled && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <EditField label="Elec (₹/kWh)" value={customElectricityPrice} onChange={setCustomElectricityPrice} />
            <EditField label="Petrol (₹/L)" value={customPetrolPrice} onChange={setCustomPetrolPrice} />
            <EditField label="Diesel (₹/L)" value={customDieselPrice} onChange={setCustomDieselPrice} />
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="space-y-2 block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daily Average Run (km)</span>
          <div className="relative flex items-center">
            <Gauge size={16} className="absolute left-4 text-slate-500" />
            <input
              value={dailyDistanceKm}
              onChange={(e) => setDailyDistanceKm(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm font-black text-white outline-none focus:border-emerald-500/50"
              inputMode="numeric"
            />
          </div>
        </label>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Monthly EV Running</p>
            <p className="text-2xl font-black text-white">₹{rupees(calculation.evMonthlyRunning)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Zap size={20} fill="currentColor" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Petrol Monthly</p>
            <p className="text-xl font-bold text-slate-300">₹{rupees(calculation.petrolMonthlyRunning)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Diesel Monthly</p>
            <p className="text-xl font-bold text-slate-300">₹{rupees(calculation.dieselMonthlyRunning)}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 p-5 shadow-xl shadow-emerald-900/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80 mb-1">Estimated Monthly Savings</p>
          <p className="text-3xl font-black text-white">₹{rupees(calculation.savings)}</p>
          <p className="mt-1 text-[10px] font-medium text-emerald-100">Compared to Petrol vehicle</p>
        </div>
      </div>
    </section>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500/50"
      />
    </div>
  );
}
