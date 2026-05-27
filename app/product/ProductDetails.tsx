"use client";

import { useState } from "react";
import {
  BatteryCharging, Zap, Gauge, CheckCircle2, CircleMinus, ChevronDown, ChevronUp,
} from "lucide-react";
import type { EvListing } from "../lib/wordpress";

function CollapsibleSection({ title, icon, defaultOpen = false, children, accentColor = "sky" }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        {icon}
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 flex-1 text-left">{title}</p>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 py-4 bg-white max-w-2xl mx-auto">{children}</div>}
    </div>
  );
}

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
    <div className="mt-16 rounded-3xl border border-slate-200 bg-white px-5 py-8 md:px-10 md:py-10">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
          <span className="text-sky-600">Specification</span>
        </h2>
      </div>

      {/* Variant selector */}
      {variants.length > 0 && (
        <div className="mb-5 flex justify-center">
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

      {/* Collapsible sections */}
      <div className="space-y-3">
        {/* Motor & Engine */}
        {batterySpec && (
          <CollapsibleSection
            title="Motor & Engine"
            icon={<Zap size={16} className="text-sky-500" />}
            defaultOpen={true}
          >
            <dl className="space-y-0.5">
              {[
                batterySpec.electricMotor && { label: "Electric Motor", value: batterySpec.electricMotor },
                batterySpec.maxPower && { label: "Max Power (bhp@rpm)", value: `${batterySpec.maxPower} bhp` },
                batterySpec.maxTorque && { label: "Max Torque (Nm@rpm)", value: `${batterySpec.maxTorque} Nm` },
                batterySpec.engine && { label: "Engine", value: batterySpec.engine },
                batterySpec.emissionStandard && { label: "Emission", value: batterySpec.emissionStandard },
                batterySpec.turboSupercharger && batterySpec.turboSupercharger !== "0" && { label: "Turbo/Supercharger", value: "Yes" },
                batterySpec.idleStartStop && batterySpec.idleStartStop !== "0" && { label: "Idle Start/Stop", value: "Yes" },
                ...(batterySpec.extraSpecs || []).map((es) => es.label && es.value ? { label: es.label, value: es.value } : null),
              ].filter(Boolean).map((row, i) => (
                <SpecRow key={i} label={(row as {label:string;value:string}).label} value={(row as {label:string;value:string}).value} odd={i % 2 === 0} />
              ))}
            </dl>
          </CollapsibleSection>
        )}

        {/* Charging */}
        {chargingSpec && (
          <CollapsibleSection
            title="Charging"
            icon={<BatteryCharging size={16} className="text-emerald-500" />}
          >
            <dl className="space-y-0.5">
              {[
                chargingSpec.drivingRange && { label: "Driving Range", value: chargingSpec.drivingRange },
                chargingSpec.acRegularCharging && { label: "AC Regular", value: chargingSpec.acRegularCharging },
                chargingSpec.dcFastCharging && { label: "DC Fast", value: chargingSpec.dcFastCharging },
                chargingSpec.acFastCharging && { label: "AC Fast", value: chargingSpec.acFastCharging },
                chargingSpec.chargingOptions && { label: "Options", value: chargingSpec.chargingOptions },
                chargingSpec.chargerIncluded && { label: "Charger Included", value: chargingSpec.chargerIncluded },
                chargingSpec.chargerConnectionType && { label: "Connection Type", value: chargingSpec.chargerConnectionType },
                ...(chargingSpec.extraSpecs || []).map((es) => es.label && es.value ? { label: es.label, value: es.value } : null),
              ].filter(Boolean).map((row, i) => (
                <SpecRow key={i} label={(row as {label:string;value:string}).label} value={(row as {label:string;value:string}).value} odd={i % 2 === 0} />
              ))}
            </dl>
          </CollapsibleSection>
        )}

        {/* Capacity & Dimensions */}
        {item.variantDimensions && item.variantDimensions.some((d) => d.length_mm || d.ground_clearance_mm || d.wheelbase_mm) && (() => {
          const dim = item.variantDimensions?.find((d) => d.variantName === selectedVariant) || item.variantDimensions?.[0];
          if (!dim) return null;
          return (
            <CollapsibleSection title="Capacity & Dimensions" icon={<Gauge size={16} className="text-violet-500" />}>
              <dl className="space-y-0.5">
                {[
                  dim.length_mm && dim.width_mm && dim.height_mm && { label: "L × W × H", value: `${dim.length_mm} × ${dim.width_mm} × ${dim.height_mm} mm` },
                  dim.wheelbase_mm && { label: "Wheelbase", value: `${dim.wheelbase_mm} mm` },
                  dim.ground_clearance_mm && { label: "Ground Clearance", value: `${dim.ground_clearance_mm} mm` },
                  dim.boot_space_litres && { label: "Boot Space", value: `${dim.boot_space_litres} L` },
                  dim.turning_radius_m && { label: "Min Turning Radius", value: `${dim.turning_radius_m} m` },
                ].filter(Boolean).map((row, i) => (
                  <SpecRow key={i} label={(row as {label:string;value:string}).label} value={(row as {label:string;value:string}).value} odd={i % 2 === 0} />
                ))}
              </dl>
            </CollapsibleSection>
          );
        })()}

        {/* Features & Safety */}
        {item.variantFeatures && item.variantFeatures.some((f) => f.airbag_count || f.drivetrain || f.has_sunroof) && (() => {
          const feat = item.variantFeatures?.find((f) => f.variantName === selectedVariant) || item.variantFeatures?.[0];
          if (!feat) return null;
          const rows = [
            feat.drivetrain && { label: "Drivetrain", value: feat.drivetrain },
            feat.front_brakes && { label: "Front Brakes", value: feat.front_brakes },
            feat.rear_brakes && { label: "Rear Brakes", value: feat.rear_brakes },
            feat.front_suspension && { label: "Front Suspension", value: feat.front_suspension },
            feat.rear_suspension && { label: "Rear Suspension", value: feat.rear_suspension },
            feat.seating_capacity && { label: "Seating Capacity", value: String(feat.seating_capacity) },
            feat.headlight_type && { label: "Headlights", value: feat.headlight_type },
            feat.screen_size_inches && { label: "Screen Size", value: `${feat.screen_size_inches}"` },
            feat.speaker_count && { label: "Speakers", value: String(feat.speaker_count) },
            feat.airbag_count && { label: "Airbags", value: String(feat.airbag_count) },
            feat.adas_level > 0 && { label: "ADAS Level", value: String(feat.adas_level) },
            feat.ncap_safety_rating && { label: "NCAP Rating", value: `${feat.ncap_safety_rating} ★` },
          ].filter(Boolean);
          const boolFeatures = [
            feat.has_sunroof && "Sunroof", feat.has_climate_control && "Climate Control",
            feat.has_cruise_control && "Cruise Control", feat.has_wireless_charger && "Wireless Charger",
            feat.has_keyless_entry && "Keyless Entry", feat.has_wireless_carplay_android_auto && "Wireless CarPlay/AA",
            feat.has_connected_car_app && "Connected Car App", feat.has_ota_updates && "OTA Updates",
            feat.has_abs_ebd && "ABS + EBD", feat.has_esp && "ESP",
            feat.has_tpms && "TPMS", feat.has_360_camera && "360° Camera",
          ].filter(Boolean) as string[];
          return (
            <CollapsibleSection title="Features & Safety" icon={<CheckCircle2 size={16} className="text-sky-500" />}>
              <dl className="space-y-0.5 mb-3">
                {rows.map((row, i) => (
                  <SpecRow key={i} label={(row as {label:string;value:string}).label} value={(row as {label:string;value:string}).value} odd={i % 2 === 0} />
                ))}
              </dl>
              {boolFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {boolFeatures.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                      <CheckCircle2 size={10} className="text-sky-500" /> {f}
                    </span>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          );
        })()}

        {/* Pros */}
        {item.pros.length > 0 && (
          <CollapsibleSection
            title="Things we like"
            icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          >
            <ul className="space-y-2.5">
              {item.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  {pro}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Cons */}
        {item.cons.length > 0 && (
          <CollapsibleSection
            title="Weakness"
            icon={<CircleMinus size={16} className="text-amber-500" />}
          >
            <ul className="space-y-2.5">
              {item.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CircleMinus size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  {con}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

function SpecRow({ label, value, odd }: { label: string; value: string; odd?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2 ${odd ? "bg-slate-50" : ""}`}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-xs font-bold text-slate-900 text-right">{value}</dd>
    </div>
  );
}
