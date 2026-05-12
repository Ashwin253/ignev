"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Banknote, CalendarDays, ChevronDown } from "lucide-react";
import data from "../../own-cost-data.json";

type Bank = {
  name: string;
  icon: string;
  interest: { "1_year": number; "3_year": number };
};

const banks = data.banks as Bank[];
const defaults = data.defaults;

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
}

function calcEmi(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

export default function LoanCalculator({ initialPrice }: { initialPrice?: number }) {
  const [vehiclePrice, setVehiclePrice] = useState(String(initialPrice ?? defaults.vehiclePrice));
  const [downPaymentPercent, setDownPaymentPercent] = useState(String(defaults.downPaymentPercent));
  const [loanYears, setLoanYears] = useState(String(defaults.loanYears));
  const [rateOfInterest, setRateOfInterest] = useState("");
  const [selectedBank, setSelectedBank] = useState(banks[0].name);

  // Sync with initialPrice if it changes
  useEffect(() => {
    if (initialPrice) setVehiclePrice(String(initialPrice));
  }, [initialPrice]);

  const parsed = {
    vehiclePrice: Number(vehiclePrice) || defaults.vehiclePrice,
    downPaymentPercent: Number(downPaymentPercent) || defaults.downPaymentPercent,
    loanYears: Number(loanYears) || defaults.loanYears,
  };

  const bank = banks.find((b) => b.name === selectedBank) ?? banks[0];
  const customRate = Number(rateOfInterest);
  const annualRate = Number.isFinite(customRate) && customRate > 0 ? customRate : bank.interest["3_year"];

  const calculation = useMemo(() => {
    const months = parsed.loanYears * 12;
    const downPayment = (parsed.vehiclePrice * parsed.downPaymentPercent) / 100;
    const principal = parsed.vehiclePrice - downPayment;
    const emiCustom = calcEmi(principal, annualRate, months);

    return {
      downPayment,
      principal,
      emiCustom,
    };
  }, [annualRate, parsed.downPaymentPercent, parsed.loanYears, parsed.vehiclePrice]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3 text-sky-400">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20">
          <Banknote size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Loan & EMI Calculator</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Finance your drive</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field 
          label="Vehicle Price (₹)" 
          value={vehiclePrice} 
          onChange={setVehiclePrice} 
          placeholder={String(defaults.vehiclePrice)} 
          highlight={!!initialPrice}
        />
        <Field 
          label="Down Payment %" 
          value={downPaymentPercent} 
          onChange={setDownPaymentPercent} 
          placeholder={String(defaults.downPaymentPercent)} 
        />
        <Field 
          label="Loan Tenure (Years)" 
          value={loanYears} 
          onChange={setLoanYears} 
          placeholder={String(defaults.loanYears)} 
        />
        <Field 
          label="Interest Rate (%)" 
          value={rateOfInterest} 
          onChange={setRateOfInterest} 
          placeholder={String(bank.interest["3_year"])}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Down Payment</p>
          <p className="mt-1 text-2xl font-black text-white">₹{rupees(calculation.downPayment)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Loan Principal</p>
          <p className="mt-1 text-2xl font-black text-white">₹{rupees(calculation.principal)}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Select Preferred Bank</p>
        <div className="flex flex-wrap gap-2">
          {banks.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedBank(item.name)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                selectedBank === item.name 
                  ? "border-sky-400 bg-sky-500/20 text-sky-100 shadow-lg shadow-sky-500/10" 
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <img src={item.icon} alt={item.name} className="h-4 w-4 rounded-full bg-white/90 object-contain" />
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
          <div className="flex items-center gap-2 text-sky-400 mb-2">
            <CalendarDays size={16} />
            <p className="text-[10px] uppercase tracking-wider font-bold">Monthly EMI</p>
          </div>
          <p className="text-3xl font-black text-white">₹{rupees(calculation.emiCustom)}<span className="text-sm font-medium text-slate-400">/mo</span></p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <ChevronDown size={16} className="-rotate-90" />
            <p className="text-[10px] uppercase tracking-wider font-bold">Applied Rate</p>
          </div>
          <p className="text-2xl font-black text-white">{annualRate.toFixed(2)}%</p>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, highlight }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; highlight?: boolean }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className={`w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm font-bold outline-none transition-all focus:border-sky-400/60 placeholder:text-slate-600 ${
          highlight ? "text-sky-400 border-sky-500/30 bg-sky-500/5" : "text-white"
        }`}
      />
    </label>
  );
}
