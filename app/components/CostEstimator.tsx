"use client";

import React, { useMemo, useState } from "react";
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

  const state = stateCosts.find((s) => s.state === selectedState) ?? stateCosts[0];

  const calculation = useMemo(() => {
    const daily = Number(dailyDistanceKm) || defaults.dailyDistanceKm;
    const eff = efficiency || defaults.evEfficiencyKwhPer100Km;

    const evMonthly = ((daily * 30) * eff * state.electricityRsPerKwh) / 100;
    const petrolMonthly = ((daily * 30) / defaults.petrolMileageKmpl) * state.petrolRsPerL;
    const dieselMonthly = ((daily * 30) / defaults.dieselMileageKmpl) * state.dieselRsPerL;

    return { evMonthly, petrolMonthly, dieselMonthly, savings: petrolMonthly - evMonthly };
  }, [dailyDistanceKm, efficiency, state]);

  return (
    <section className="space-y-5">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">State</span>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-400"
          >
            {stateCosts.map((s) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Daily km</span>
          <input
            value={dailyDistanceKm}
            onChange={(e) => setDailyDistanceKm(e.target.value)}
            inputMode="numeric"
            placeholder={String(defaults.dailyDistanceKm)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-400 placeholder:text-slate-300"
          />
        </label>
      </div>

      {/* Fuel prices */}
      <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
        <span>⚡ ₹{state.electricityRsPerKwh}/kWh</span>
        <span>⛽ ₹{state.petrolRsPerL}/L</span>
        <span>🛢️ ₹{state.dieselRsPerL}/L</span>
      </div>

      {/* Outputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl p-3 border border-emerald-300 bg-emerald-50">
          <p className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold mb-0.5">EV Monthly</p>
          <p className="text-base font-black text-emerald-700 leading-tight">₹{rupees(calculation.evMonthly)}</p>
        </div>
        <div className="rounded-xl p-3 border border-slate-200 bg-white">
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Petrol</p>
          <p className="text-base font-black text-slate-900 leading-tight">₹{rupees(calculation.petrolMonthly)}</p>
        </div>
        <div className="rounded-xl p-3 border border-slate-200 bg-white">
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Diesel</p>
          <p className="text-base font-black text-slate-900 leading-tight">₹{rupees(calculation.dieselMonthly)}</p>
        </div>
        <div className="rounded-xl p-3 border border-emerald-300 bg-emerald-50">
          <p className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold mb-0.5">You Save</p>
          <p className="text-base font-black text-emerald-700 leading-tight">₹{rupees(calculation.savings)}</p>
        </div>
      </div>
    </section>
  );
}
