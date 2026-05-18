"use client";

import React, { useMemo, useState, useEffect } from "react";
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
    return { downPayment, principal, emiCustom };
  }, [annualRate, parsed.downPaymentPercent, parsed.loanYears, parsed.vehiclePrice]);

  return (
    <section className="space-y-5">
      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniField label="Price (₹)" value={vehiclePrice} onChange={setVehiclePrice} placeholder={String(defaults.vehiclePrice)} highlight={!!initialPrice} />
        <MiniField label="Down %" value={downPaymentPercent} onChange={setDownPaymentPercent} placeholder={String(defaults.downPaymentPercent)} />
        <MiniField label="Years" value={loanYears} onChange={setLoanYears} placeholder={String(defaults.loanYears)} />
        <MiniField label="Rate %" value={rateOfInterest} onChange={setRateOfInterest} placeholder={String(bank.interest["3_year"])} />
      </div>

      {/* Bank selector */}
      <div className="flex flex-wrap gap-1.5">
        {banks.map((item) => (
          <button
            key={item.name}
            onClick={() => setSelectedBank(item.name)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all ${
              selectedBank === item.name
                ? "border-sky-400 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <img src={item.icon} alt={item.name} className="h-3.5 w-3.5 rounded-full object-contain" />
            {item.name}
          </button>
        ))}
      </div>

      {/* Outputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <OutputCard label="Down Payment" value={`₹${rupees(calculation.downPayment)}`} />
        <OutputCard label="Principal" value={`₹${rupees(calculation.principal)}`} />
        <OutputCard label="Monthly EMI" value={`₹${rupees(calculation.emiCustom)}`} highlight />
        <OutputCard label="Rate Applied" value={`${annualRate.toFixed(1)}%`} />
      </div>
    </section>
  );
}

function MiniField({ label, value, onChange, placeholder, highlight }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; highlight?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-xs font-bold outline-none transition-all placeholder:text-slate-300 ${
          highlight
            ? "text-sky-700 border-sky-300 bg-sky-50"
            : "text-slate-800 border-slate-200 focus:border-sky-400"
        }`}
      />
    </label>
  );
}

function OutputCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}>
      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">{label}</p>
      <p className={`text-base font-black leading-tight ${highlight ? "text-sky-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
