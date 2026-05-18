"use client";

import { useState } from "react";
import {
  BatteryCharging, Zap, Gauge, CheckCircle2, CircleMinus, ChevronDown,
} from "lucide-react";
import type { EvListing } from "../lib/wordpress";

export default function ProductDetails({ item }: { item: EvListing }) {
  const hasSpecs = item.batterySpecs.length > 0 || item.chargingSpecs.length > 0;
  const hasPros = item.pros.length > 0 || item.cons.length > 0;

  if (!hasSpecs && !hasPros) return null;

  const variants = [...new Set([
    ...item.batterySpecs.map((s) => s.variantName),
    ...item.chargingSpecs.map((s) => s.variantName),
  ])].filter(Boolean);

  const [selectedVariant, setSelectedVariant] = useState(variants[0] || "");

  const batterySpec = item.batterySpecs.find((s) => s.variantName === selectedVariant);
  const chargingSpec = item.chargingSpecs.find((s) => s.variantName === selectedVariant);

  return (
    <div className="mt-16 rounded-3xl border border-slate-200 bg-white px-5 py-10 md:px-10 md:py-14">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 shadow-sm mb-4">
          Specifications
        </span>
        <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
          Detailed <span className="text-sky-600">Specs</span>
        </h2>
      </div>

      {/* Variant selector — always show for context */}
      {variants.length > 0 && (
        <div className="mb-8 flex justify-center">
          <label className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <Gauge size={14} className="text-sky-500 shrink-0" />
            {variants.length > 1 ? (
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 outline-none appearance-none pr-6 cursor-pointer"
              >
                {variants.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-800">{variants[0]}</span>
            )}
            {variants.length > 1 && (
              <ChevronDown size={14} className="text-slate-400 absolute right-3 pointer-events-none" />
            )}
          </label>
        </div>
      )}

      {/* Specs grid */}
      {(batterySpec || chargingSpec) && (
        <div className="grid gap-6 md:grid-cols-2 mb-10">
          {/* Battery / Motor specs */}
          {batterySpec && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-sky-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Motor & Engine</p>
              </div>
              <dl className="space-y-3">
                {batterySpec.electricMotor && <SpecRow label="Electric Motor" value={batterySpec.electricMotor} />}
                {batterySpec.maxPower && <SpecRow label="Max Power" value={`${batterySpec.maxPower} bhp`} />}
                {batterySpec.maxTorque && <SpecRow label="Max Torque" value={`${batterySpec.maxTorque} Nm`} />}
                {batterySpec.engine && <SpecRow label="Engine" value={batterySpec.engine} />}
                {batterySpec.emissionStandard && <SpecRow label="Emission" value={batterySpec.emissionStandard} />}
                {batterySpec.turboSupercharger && batterySpec.turboSupercharger !== "0" && (
                  <SpecRow label="Turbo/Supercharger" value="Yes" />
                )}
                {batterySpec.idleStartStop && batterySpec.idleStartStop !== "0" && (
                  <SpecRow label="Idle Start/Stop" value="Yes" />
                )}
              </dl>
            </div>
          )}

          {/* Charging specs */}
          {chargingSpec && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BatteryCharging size={16} className="text-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Charging</p>
              </div>
              <dl className="space-y-3">
                {chargingSpec.drivingRange && <SpecRow label="Driving Range" value={chargingSpec.drivingRange} />}
                {chargingSpec.acRegularCharging && <SpecRow label="AC Regular" value={chargingSpec.acRegularCharging} />}
                {chargingSpec.dcFastCharging && <SpecRow label="DC Fast" value={chargingSpec.dcFastCharging} />}
                {chargingSpec.acFastCharging && <SpecRow label="AC Fast" value={chargingSpec.acFastCharging} />}
                {chargingSpec.chargingOptions && <SpecRow label="Options" value={chargingSpec.chargingOptions} />}
                {chargingSpec.chargerIncluded && <SpecRow label="Charger Included" value={chargingSpec.chargerIncluded} />}
                {chargingSpec.chargerConnectionType && <SpecRow label="Connection Type" value={chargingSpec.chargerConnectionType} />}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Pros & Cons */}
      {hasPros && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {item.pros.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-600">Things we like</p>
              <ul className="space-y-2.5">
                {item.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.cons.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-600">Weakness</p>
              <ul className="space-y-2.5">
                {item.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CircleMinus size={15} className="mt-0.5 shrink-0 text-amber-500" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-xs font-bold text-slate-900 text-right">{value}</dd>
    </div>
  );
}
