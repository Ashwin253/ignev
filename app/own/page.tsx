"use client";

import { useMemo, useState } from "react";
import { Banknote, CalendarDays, ChevronDown, Fuel, MapPinned } from "lucide-react";
import data from "../../own-cost-data.json";

type Bank = {
  name: string;
  icon: string;
  interest: { "1_year": number; "3_year": number };
};

type StateCost = {
  state: string;
  electricityRsPerKwh: number;
  petrolRsPerL: number;
  dieselRsPerL: number;
};

const banks = data.banks as Bank[];
const stateCosts = data.stateCosts as StateCost[];
const defaults = data.defaults as {
  vehiclePrice: number;
  downPaymentPercent: number;
  loanYears: number;
  dailyDistanceKm: number;
  evEfficiencyKwhPer100Km: number;
  petrolMileageKmpl: number;
  dieselMileageKmpl: number;
  maintenancePerMonth: number;
  depreciationPerYearPercent: number;
};

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
}

function calcEmi(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

export default function OwnPage() {
  const [vehiclePrice, setVehiclePrice] = useState(String(defaults.vehiclePrice));
  const [downPaymentPercent, setDownPaymentPercent] = useState(String(defaults.downPaymentPercent));
  const [loanYears, setLoanYears] = useState(String(defaults.loanYears));
  const [rateOfInterest, setRateOfInterest] = useState("");
  const [selectedBank, setSelectedBank] = useState(banks[0].name);
  const [selectedState, setSelectedState] = useState(stateCosts[0].state);
  const [mobileTab, setMobileTab] = useState<"emi" | "ride">("emi");
  const [dailyDistanceKm, setDailyDistanceKm] = useState(String(defaults.dailyDistanceKm));
  const [customFuelPricesEnabled, setCustomFuelPricesEnabled] = useState(false);
  const [customElectricityPrice, setCustomElectricityPrice] = useState(String(stateCosts[0].electricityRsPerKwh));
  const [customPetrolPrice, setCustomPetrolPrice] = useState(String(stateCosts[0].petrolRsPerL));
  const [customDieselPrice, setCustomDieselPrice] = useState(String(stateCosts[0].dieselRsPerL));

  const parsed = {
    vehiclePrice: Number(vehiclePrice) || defaults.vehiclePrice,
    downPaymentPercent: Number(downPaymentPercent) || defaults.downPaymentPercent,
    loanYears: Number(loanYears) || defaults.loanYears,
    dailyDistanceKm: Number(dailyDistanceKm) || defaults.dailyDistanceKm,
  };

  const bank = banks.find((b) => b.name === selectedBank) ?? banks[0];
  const customRate = Number(rateOfInterest);
  const annualRate = Number.isFinite(customRate) && customRate > 0 ? customRate : bank.interest["3_year"];
  const state = stateCosts.find((s) => s.state === selectedState) ?? stateCosts[0];
  const fuelPrices = customFuelPricesEnabled
    ? {
        electricityRsPerKwh: Number(customElectricityPrice) || state.electricityRsPerKwh,
        petrolRsPerL: Number(customPetrolPrice) || state.petrolRsPerL,
        dieselRsPerL: Number(customDieselPrice) || state.dieselRsPerL,
      }
    : state;

  const calculation = useMemo(() => {
    const months = parsed.loanYears * 12;
    const downPayment = (parsed.vehiclePrice * parsed.downPaymentPercent) / 100;
    const principal = parsed.vehiclePrice - downPayment;
    const emiCustom = calcEmi(principal, annualRate, months);

    const evMonthlyRunning = ((parsed.dailyDistanceKm * 30) * defaults.evEfficiencyKwhPer100Km * fuelPrices.electricityRsPerKwh) / 100;
    const petrolMonthlyRunning = ((parsed.dailyDistanceKm * 30) / defaults.petrolMileageKmpl) * fuelPrices.petrolRsPerL;
    const dieselMonthlyRunning = ((parsed.dailyDistanceKm * 30) / defaults.dieselMileageKmpl) * fuelPrices.dieselRsPerL;
    const maintenanceMonthly = defaults.maintenancePerMonth;
    const depreciationMonthly = (parsed.vehiclePrice * (defaults.depreciationPerYearPercent / 100)) / 12;

    return {
      months,
      downPayment,
      principal,
      emiCustom,
      evMonthlyRunning,
      petrolMonthlyRunning,
      dieselMonthlyRunning,
      maintenanceMonthly,
      depreciationMonthly,
      totalEvMonthly: emiCustom + evMonthlyRunning + maintenanceMonthly + depreciationMonthly,
      totalPetrolMonthly: emiCustom + petrolMonthlyRunning + maintenanceMonthly + depreciationMonthly,
      totalDieselMonthly: emiCustom + dieselMonthlyRunning + maintenanceMonthly + depreciationMonthly,
    };
  }, [annualRate, fuelPrices.dieselRsPerL, fuelPrices.electricityRsPerKwh, fuelPrices.petrolRsPerL, parsed.dailyDistanceKm, parsed.downPaymentPercent, parsed.loanYears, parsed.vehiclePrice]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_34%),linear-gradient(180deg,#0b1220_0%,#0f172a_60%,#111827_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">OWN COST PLANNER</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">EMI, state cost, daily ride, maintenance and depreciation in one view</h1>
          {/* <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Compare your monthly ownership cost using bank EMI options, state-wise power and fuel prices, your daily riding distance, maintenance, and depreciation.
          </p> */}
        </div>

        <div className="mb-6 flex gap-2 lg:hidden">
          <button
            onClick={() => setMobileTab("emi")}
            className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${mobileTab === "emi" ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300"}`}
          >
            Loan + EMI
          </button>
          <button
            onClick={() => setMobileTab("ride")}
            className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${mobileTab === "ride" ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"}`}
          >
            Ride estimate
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`space-y-6 ${mobileTab === "ride" ? "hidden lg:block" : "block"}`}>
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-sky-300"><Banknote size={18} /><h2 className="text-lg font-semibold">Loan + EMI</h2></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Vehicle price" value={vehiclePrice} onChange={setVehiclePrice} />
                <Field label="Down payment %" value={downPaymentPercent} onChange={setDownPaymentPercent} />
                <Field label="Loan years" value={loanYears} onChange={setLoanYears} />
                <Field label="Rate of interest (%)" value={rateOfInterest} onChange={setRateOfInterest} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Down payment</p>
                  <p className="mt-1 text-2xl font-semibold">Rs {rupees(calculation.downPayment)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Loan principal</p>
                  <p className="mt-1 text-2xl font-semibold">Rs {rupees(calculation.principal)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {banks.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedBank(item.name)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${selectedBank === item.name ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                  >
                    <img
                      src={item.icon}
                      alt={`${item.name} icon`}
                      className="h-4 w-4 rounded-full object-contain bg-white/90"
                    />
                    {item.name}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ResultCard title={`${bank.name} EMI`} value={`Rs ${rupees(calculation.emiCustom)}/mo`} icon={<CalendarDays size={16} />} />
                <ResultCard title="Applied rate" value={`${annualRate.toFixed(2)}%`} icon={<ChevronDown size={16} className="rotate-[-90deg]" />} />
              </div>
            </section>

          </div>

          <section className={`rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl ${mobileTab === "emi" ? "hidden lg:block" : "block"}`}>
            <div className="mb-4 flex items-center gap-2 text-amber-300"><Fuel size={18} /><h2 className="text-lg font-semibold">Ride estimate</h2></div>
            {/* <p className="text-sm text-slate-300">Using {parsed.dailyDistanceKm} km/day over 30 days.</p> */}

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-300">
                  <MapPinned size={16} />
                  <h3 className="text-sm font-semibold">State-wise cost</h3>
                </div>
                <button
                  onClick={() => setCustomFuelPricesEnabled((prev) => !prev)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                    customFuelPricesEnabled ? "bg-emerald-500 border-emerald-400/40" : "bg-white/10 border-white/10"
                  }`}
                  aria-pressed={customFuelPricesEnabled}
                  aria-label="Toggle custom fuel pricing"
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${customFuelPricesEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <label className="space-y-1.5 block">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">State</span>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const nextState = e.target.value;
                    setSelectedState(nextState);
                    if (!customFuelPricesEnabled) {
                      const matched = stateCosts.find((item) => item.state === nextState);
                      if (matched) {
                        setCustomElectricityPrice(String(matched.electricityRsPerKwh));
                        setCustomPetrolPrice(String(matched.petrolRsPerL));
                        setCustomDieselPrice(String(matched.dieselRsPerL));
                      }
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
                >
                  {stateCosts.map((item) => (
                    <option key={item.state} value={item.state}>
                      {item.state}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="Electricity / kWh" value={`Rs ${customFuelPricesEnabled ? customElectricityPrice : state.electricityRsPerKwh}`} />
                <Metric label="Petrol / litre" value={`Rs ${customFuelPricesEnabled ? customPetrolPrice : state.petrolRsPerL}`} />
                <Metric label="Diesel / litre" value={`Rs ${customFuelPricesEnabled ? customDieselPrice : state.dieselRsPerL}`} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Field label="Daily distance (km)" value={dailyDistanceKm} onChange={setDailyDistanceKm} />
                <Field label="Electricity / kWh" value={customElectricityPrice} onChange={setCustomElectricityPrice} />
                <Field label="Petrol / litre" value={customPetrolPrice} onChange={setCustomPetrolPrice} />
                <Field label="Diesel / litre" value={customDieselPrice} onChange={setCustomDieselPrice} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="EV running / month" value={`Rs ${rupees(calculation.evMonthlyRunning)}`} />
              <Metric label="Petrol running / month" value={`Rs ${rupees(calculation.petrolMonthlyRunning)}`} />
              <Metric label="Diesel running / month" value={`Rs ${rupees(calculation.dieselMonthlyRunning)}`} />
            </div>
          </section>
        </div>
        <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-slate-300">
          Prices and cost may vary. Contact representative for latest updates and offers.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void; }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] uppercase tracking-wider text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/60"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string; }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ResultCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode; }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-sky-300">
        {icon}
        <p className="text-xs uppercase tracking-wider">{title}</p>
      </div>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
