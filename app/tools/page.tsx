"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BatteryCharging, TrendingDown, IndianRupee, Gauge } from "lucide-react";

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<"charging" | "savings" | "emi" | "range">("charging");

  // Charging Calculator
  const [chargeBatteryKwh, setChargeBatteryKwh] = useState(30);
  const [chargerPowerKw, setChargerPowerKw] = useState(7.2);
  const [chargeStartPct, setChargeStartPct] = useState(10);
  const [chargeTargetPct, setChargeTargetPct] = useState(80);
  const [chargeElecRate, setChargeElecRate] = useState(8);

  // Savings Calculator
  const [savingsDailyKm, setSavingsDailyKm] = useState(40);
  const [savingsPetrolPrice, setSavingsPetrolPrice] = useState(102);
  const [savingsPetrolMileage, setSavingsPetrolMileage] = useState(14);
  const [savingsElecRate, setSavingsElecRate] = useState(8);
  const [savingsYears, setSavingsYears] = useState(5);

  // EMI Calculator
  const [emiVehiclePrice, setEmiVehiclePrice] = useState(1200000);
  const [emiDownPct, setEmiDownPct] = useState(20);
  const [emiTenureYears, setEmiTenureYears] = useState(5);
  const [emiRate, setEmiRate] = useState(8.5);

  // Range Calculator
  const [rangeBatteryKwh, setRangeBatteryKwh] = useState(40);
  const [rangeRatedKm, setRangeRatedKm] = useState(315);
  const [rangeDriveMode, setRangeDriveMode] = useState<"eco" | "city" | "sport">("city");
  const [rangeTerrain, setRangeTerrain] = useState<"flat" | "hilly">("flat");
  const [rangeAcOn, setRangeAcOn] = useState(true);
  const [rangePassengers, setRangePassengers] = useState(2);

  // Calculations
  const chargingResults = useMemo(() => {
    const energyToAdd = (chargeBatteryKwh * Math.max(0, chargeTargetPct - chargeStartPct)) / 100;
    const hoursNeeded = (energyToAdd / chargerPowerKw) * 1.12;
    const hours = Math.floor(hoursNeeded);
    const mins = Math.round((hoursNeeded - hours) * 60);
    const cost = Math.round(energyToAdd * chargeElecRate);
    return { energyToAdd, hours, mins, cost };
  }, [chargeBatteryKwh, chargerPowerKw, chargeStartPct, chargeTargetPct, chargeElecRate]);

  const savingsResults = useMemo(() => {
    const totalKm = savingsDailyKm * 365 * savingsYears;
    const evKwhTotal = (totalKm * 12) / 100;
    const evCost = evKwhTotal * savingsElecRate;
    const petrolLitersTotal = totalKm / savingsPetrolMileage;
    const petrolCost = petrolLitersTotal * savingsPetrolPrice;
    const totalSavings = Math.max(0, petrolCost - evCost);
    const monthlyKm = savingsDailyKm * 30;
    const evMonthly = ((monthlyKm * 12) / 100) * savingsElecRate;
    const petrolMonthly = (monthlyKm / savingsPetrolMileage) * savingsPetrolPrice;
    const monthlySavings = Math.max(0, petrolMonthly - evMonthly);
    return { totalSavings, monthlySavings, evMonthly, petrolMonthly };
  }, [savingsDailyKm, savingsPetrolPrice, savingsPetrolMileage, savingsElecRate, savingsYears]);

  const emiResults = useMemo(() => {
    const downPayment = (emiVehiclePrice * emiDownPct) / 100;
    const loanAmount = Math.max(0, emiVehiclePrice - downPayment);
    const monthlyRate = emiRate / 12 / 100;
    const months = emiTenureYears * 12;
    let monthlyEmi = 0;
    if (monthlyRate > 0 && months > 0) {
      monthlyEmi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    } else if (months > 0) {
      monthlyEmi = loanAmount / months;
    }
    const totalInterest = Math.max(0, monthlyEmi * months - loanAmount);
    const totalPayable = downPayment + monthlyEmi * months;
    return { downPayment, loanAmount, monthlyEmi, totalInterest, totalPayable };
  }, [emiVehiclePrice, emiDownPct, emiTenureYears, emiRate]);

  const rangeResults = useMemo(() => {
    let factor = 1.0;
    if (rangeDriveMode === "eco") factor *= 1.1;
    if (rangeDriveMode === "sport") factor *= 0.84;
    if (rangeTerrain === "hilly") factor *= 0.78;
    if (rangeAcOn) factor *= 0.88;
    factor *= 1 - (rangePassengers - 1) * 0.025;
    const estimatedRange = Math.max(10, Math.round(rangeRatedKm * factor));
    const efficiencyWhPerKm = Math.round((rangeBatteryKwh * 1000) / estimatedRange);
    return { estimatedRange, efficiencyWhPerKm };
  }, [rangeBatteryKwh, rangeRatedKm, rangeDriveMode, rangeTerrain, rangeAcOn, rangePassengers]);

  // Expose active tool state via data attribute for AI chat to read
  return (
    <main className="min-h-screen pt-28 pb-20 bg-[#f8f5f0]" data-active-tool={activeTool}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Decide With Numbers</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              Tools that do the maths for you.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-500">
              Calculators built specifically for Indian EV buyers & operators.
            </p>
          </div>
        </div>

        {/* Tool Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { id: "charging", name: "Charging", desc: "Time & cost", icon: BatteryCharging },
            { id: "savings", name: "Savings", desc: "Fuel vs EV", icon: TrendingDown },
            { id: "emi", name: "EMI", desc: "Monthly payment", icon: IndianRupee },
            { id: "range", name: "Range", desc: "Real-world km", icon: Gauge },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id as any)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  isActive
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-lg"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-[#34ebb1]"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isActive ? "bg-[#34ebb1] text-zinc-900" : "bg-zinc-100 text-zinc-600"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold">{t.name}</div>
                <div className={`text-[11px] mt-0.5 ${isActive ? "text-zinc-400" : "text-zinc-500"}`}>{t.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Calculator Content */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200 shadow-xl">
          {/* CHARGING */}
          {activeTool === "charging" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <BatteryCharging className="text-[#34ebb1] w-5 h-5" /> Charging Time & Cost
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium"><span>Battery Capacity</span><span className="font-mono text-emerald-600 font-bold">{chargeBatteryKwh} kWh</span></div>
                    <input type="range" min={3} max={120} value={chargeBatteryKwh} onChange={(e) => setChargeBatteryKwh(Number(e.target.value))} className="w-full accent-[#34ebb1]" />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono"><span>3 kWh</span><span>30 kWh</span><span>120 kWh</span></div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Charger Power</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[{ label: "3.3 kW", val: 3.3 }, { label: "7.2 kW", val: 7.2 }, { label: "30 kW", val: 30 }, { label: "60 kW", val: 60 }].map((c) => (
                        <button key={c.val} onClick={() => setChargerPowerKw(c.val)} className={`p-2 rounded-xl text-xs font-bold border ${chargerPowerKw === c.val ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 border-zinc-200 hover:border-[#34ebb1]"}`}>{c.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>Start %</span><span className="font-mono text-emerald-600">{chargeStartPct}%</span></div>
                      <input type="range" min={0} max={90} value={chargeStartPct} onChange={(e) => setChargeStartPct(Number(e.target.value))} className="w-full accent-[#34ebb1]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>Target %</span><span className="font-mono text-emerald-600">{chargeTargetPct}%</span></div>
                      <input type="range" min={10} max={100} value={chargeTargetPct} onChange={(e) => setChargeTargetPct(Number(e.target.value))} className="w-full accent-[#34ebb1]" />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-900 text-white">
                  <div className="text-xs font-mono text-[#34ebb1] uppercase tracking-wider mb-4">Result</div>
                  <div className="text-3xl font-bold font-mono">{chargingResults.hours > 0 ? `${chargingResults.hours}h ` : ""}{chargingResults.mins} min</div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-zinc-700">
                    <div><div className="text-[11px] text-zinc-400">Energy</div><div className="text-lg font-bold text-[#34ebb1] font-mono">{chargingResults.energyToAdd.toFixed(1)} kWh</div></div>
                    <div><div className="text-[11px] text-zinc-400">Cost</div><div className="text-lg font-bold text-[#34ebb1] font-mono">₹{chargingResults.cost}</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAVINGS */}
          {activeTool === "savings" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <TrendingDown className="text-[#34ebb1] w-5 h-5" /> Fuel vs EV Savings
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium"><span>Daily Distance</span><span className="font-mono text-emerald-600 font-bold">{savingsDailyKm} km/day</span></div>
                    <input type="range" min={10} max={200} step={5} value={savingsDailyKm} onChange={(e) => setSavingsDailyKm(Number(e.target.value))} className="w-full accent-[#34ebb1]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="block text-xs mb-1">Petrol ₹/L</label><input type="number" value={savingsPetrolPrice} onChange={(e) => setSavingsPetrolPrice(Number(e.target.value))} className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#34ebb1]" /></div>
                    <div><label className="block text-xs mb-1">Mileage km/L</label><input type="number" value={savingsPetrolMileage} onChange={(e) => setSavingsPetrolMileage(Number(e.target.value))} className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#34ebb1]" /></div>
                    <div><label className="block text-xs mb-1">Elec ₹/kWh</label><input type="number" value={savingsElecRate} onChange={(e) => setSavingsElecRate(Number(e.target.value))} className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#34ebb1]" /></div>
                  </div>
                  <div className="flex gap-2">
                    {[1, 3, 5].map((y) => (
                      <button key={y} onClick={() => setSavingsYears(y)} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${savingsYears === y ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 border-zinc-200 hover:border-[#34ebb1]"}`}>{y} {y === 1 ? "Year" : "Years"}</button>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-900 text-white">
                  <div className="text-xs font-mono text-[#34ebb1] uppercase tracking-wider mb-4">{savingsYears}-Year Savings</div>
                  <div className="text-3xl font-bold text-[#34ebb1] font-mono">₹{savingsResults.totalSavings.toLocaleString("en-IN")}</div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-zinc-700">
                    <div><div className="text-[11px] text-zinc-400">Monthly EV</div><div className="text-base font-bold font-mono">₹{Math.round(savingsResults.evMonthly).toLocaleString("en-IN")}</div></div>
                    <div><div className="text-[11px] text-zinc-400">Monthly Petrol</div><div className="text-base font-bold font-mono text-zinc-400">₹{Math.round(savingsResults.petrolMonthly).toLocaleString("en-IN")}</div></div>
                  </div>
                  <div className="mt-4 p-2 rounded-lg bg-black/20 text-[10px] text-zinc-400">Save ~₹{Math.round(savingsResults.monthlySavings).toLocaleString("en-IN")}/month</div>
                </div>
              </div>
            </div>
          )}

          {/* EMI */}
          {activeTool === "emi" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <IndianRupee className="text-[#34ebb1] w-5 h-5" /> EMI Calculator
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium"><span>Vehicle Price</span><span className="font-mono text-emerald-600 font-bold">₹{emiVehiclePrice.toLocaleString("en-IN")}</span></div>
                    <input type="range" min={100000} max={6000000} step={50000} value={emiVehiclePrice} onChange={(e) => setEmiVehiclePrice(Number(e.target.value))} className="w-full accent-[#34ebb1]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="block text-xs mb-1">Down %</label><input type="number" min={0} max={80} value={emiDownPct} onChange={(e) => setEmiDownPct(Number(e.target.value))} className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#34ebb1]" /></div>
                    <div><label className="block text-xs mb-1">Years</label><input type="number" min={1} max={7} value={emiTenureYears} onChange={(e) => setEmiTenureYears(Number(e.target.value))} className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#34ebb1]" /></div>
                    <div><label className="block text-xs mb-1">Rate %</label><input type="number" step={0.1} value={emiRate} onChange={(e) => setEmiRate(Number(e.target.value))} className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#34ebb1]" /></div>
                  </div>
                </div>
                <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-900 text-white">
                  <div className="text-xs font-mono text-[#34ebb1] uppercase tracking-wider mb-4">Monthly EMI</div>
                  <div className="text-3xl font-bold text-[#34ebb1] font-mono">₹{Math.round(emiResults.monthlyEmi).toLocaleString("en-IN")}</div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-zinc-700">
                    <div><div className="text-[11px] text-zinc-400">Loan Amount</div><div className="text-base font-bold font-mono">₹{Math.round(emiResults.loanAmount).toLocaleString("en-IN")}</div></div>
                    <div><div className="text-[11px] text-zinc-400">Total Interest</div><div className="text-base font-bold font-mono text-zinc-400">₹{Math.round(emiResults.totalInterest).toLocaleString("en-IN")}</div></div>
                  </div>
                  <div className="mt-4 p-2 rounded-lg bg-black/20 text-[10px] text-zinc-400">Total Payable: ₹{Math.round(emiResults.totalPayable).toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          )}

          {/* RANGE */}
          {activeTool === "range" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Gauge className="text-[#34ebb1] w-5 h-5" /> Real-World Range
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium"><span>Battery</span><span className="font-mono text-emerald-600 font-bold">{rangeBatteryKwh} kWh</span></div>
                    <input type="range" min={3} max={120} value={rangeBatteryKwh} onChange={(e) => setRangeBatteryKwh(Number(e.target.value))} className="w-full accent-[#34ebb1]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium"><span>Rated Range</span><span className="font-mono text-emerald-600 font-bold">{rangeRatedKm} km</span></div>
                    <input type="range" min={50} max={700} step={5} value={rangeRatedKm} onChange={(e) => setRangeRatedKm(Number(e.target.value))} className="w-full accent-[#34ebb1]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Drive Mode</label>
                    <div className="flex gap-2">
                      {(["eco", "city", "sport"] as const).map((m) => (
                        <button key={m} onClick={() => setRangeDriveMode(m)} className={`flex-1 py-2 rounded-xl text-xs font-bold border capitalize ${rangeDriveMode === m ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 border-zinc-200 hover:border-[#34ebb1]"}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={rangeTerrain === "hilly"} onChange={(e) => setRangeTerrain(e.target.checked ? "hilly" : "flat")} className="accent-[#34ebb1]" /> Hilly terrain</label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={rangeAcOn} onChange={(e) => setRangeAcOn(e.target.checked)} className="accent-[#34ebb1]" /> AC On</label>
                    <div className="flex items-center gap-2 text-xs"><span>Passengers:</span><input type="number" min={1} max={7} value={rangePassengers} onChange={(e) => setRangePassengers(Number(e.target.value))} className="w-12 rounded-lg bg-zinc-50 border border-zinc-200 px-2 py-1 text-xs font-mono font-bold" /></div>
                  </div>
                </div>
                <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-900 text-white">
                  <div className="text-xs font-mono text-[#34ebb1] uppercase tracking-wider mb-4">Estimated Range</div>
                  <div className="text-3xl font-bold text-[#34ebb1] font-mono">{rangeResults.estimatedRange} km</div>
                  <div className="mt-4 pt-3 border-t border-zinc-700">
                    <div className="text-[11px] text-zinc-400">Efficiency</div>
                    <div className="text-lg font-bold font-mono">{rangeResults.efficiencyWhPerKm} Wh/km</div>
                  </div>
                  <div className="mt-4 p-2 rounded-lg bg-black/20 text-[10px] text-zinc-400">Factors: {rangeDriveMode} mode, {rangeTerrain}, AC {rangeAcOn ? "on" : "off"}, {rangePassengers} passengers</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
