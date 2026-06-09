"use client";

import { useMemo, useState } from "react";
import {
  BatteryCharging, Zap, Gauge, CheckCircle2, CircleMinus, ChevronDown, ChevronUp, LayoutList, Lightbulb, Activity,
} from "lucide-react";
import type { EvListing } from "../lib/wordpress";
import { useProductSelection } from "./ProductSelectionProvider";
import {
  chargingSpecCheckboxes,
  chargingSpecRows,
  collectVariantNames,
  dimensionSpecCheckboxes,
  dimensionSpecRows,
  hasFeatureContent,
  listingHasSpecifications,
  motorSpecCheckboxes,
  motorSpecRows,
  sectionCheckboxLabels,
  sectionFieldRows,
} from "../lib/listing-specs";
import { isCheckboxExtra, isExtraChecked, normalizeExtras } from "../lib/spec-extras";

function CollapsibleSection({ title, icon, defaultOpen = false, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-4 bg-slate-200 hover:bg-slate-300/80 transition-colors border-b border-slate-300"
      >
        {icon}
        <p className="text-xs font-bold uppercase tracking-wider text-slate-800 flex-1 text-left">{title}</p>
        {open ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
      </button>
      {open && <div className="px-5 py-4 bg-slate-50 max-w-2xl mx-auto">{children}</div>}
    </div>
  );
}

export default function ProductDetails({ item }: { item: EvListing }) {
  const { selectedVariantName, selectVariantByName } = useProductSelection();
  const variants = useMemo(() => collectVariantNames(item), [item]);

  const [localSelectedVariant, setLocalSelectedVariant] = useState(variants[0] || "");
  const selectedVariant = selectedVariantName && variants.includes(selectedVariantName)
    ? selectedVariantName
    : localSelectedVariant || variants[0] || "";

  if (!listingHasSpecifications(item)) return null;

  const batterySpec = item.batterySpecs.find((s) => s.variantName === selectedVariant);
  const chargingSpec = item.chargingSpecs.find((s) => s.variantName === selectedVariant);
  const motorRows = batterySpec ? motorSpecRows(batterySpec) : [];
  const motorChecks = batterySpec ? motorSpecCheckboxes(batterySpec) : [];
  const chargingRows = chargingSpec ? chargingSpecRows(chargingSpec) : [];
  const chargingChecks = chargingSpec ? chargingSpecCheckboxes(chargingSpec) : [];

  const dim = item.variantDimensions?.find((d) => d.variantName === selectedVariant)
    ?? item.variantDimensions?.[0];
  const dimensionRows = dim ? dimensionSpecRows(dim) : [];
  const dimensionChecks = dim ? dimensionSpecCheckboxes(dim) : [];

 const sectionHasContent = (fields: Array<{ label: string; value: string; kind?: "field" | "checkbox" | undefined }> | undefined) =>
  fields?.some((f) => f.label && (!isCheckboxExtra(f) ? f.value.trim() : isExtraChecked(f.value)));
  const extraSections = (
    item.variantExtraSections?.find((v) => v.variantName === selectedVariant)
    ?? item.variantExtraSections?.[0]
  )?.sections?.filter((s) => s.title && sectionHasContent(s.fields)) ?? [];

  const customFields = (
    item.variantCustomFields?.find((v) => v.variantName === selectedVariant)
    ?? item.variantCustomFields?.[0]
  )?.fields;
  const customFieldRows = sectionFieldRows(customFields);
  const customFieldChecks = sectionCheckboxLabels(customFields);

  const feat = item.variantFeatures?.find((f) => f.variantName === selectedVariant)
    ?? item.variantFeatures?.[0];
  const showFeatures = feat && hasFeatureContent(feat);

  return (
    <div className="mt-16 rounded-3xl border-2 border-slate-300 bg-slate-100 px-5 py-8 md:px-10 md:py-10 shadow-sm">
      <div className="text-center mb-5">
        <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
          <span className="text-sky-700">Specification</span>
        </h2>
      </div>

      {variants.length > 0 && (
        <div className="mb-5 flex justify-center">
          <label className="relative inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 shadow-sm">
            <Gauge size={14} className="text-sky-600 shrink-0" />
            {variants.length > 1 ? (
              <select
                value={selectedVariant}
                onChange={(e) => {
                  setLocalSelectedVariant(e.target.value);
                  selectVariantByName(e.target.value);
                }}
                className="bg-transparent text-sm font-bold text-slate-900 outline-none appearance-none pr-6 cursor-pointer"
              >
                {variants.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-900">{variants[0]}</span>
            )}
            {variants.length > 1 && (
              <ChevronDown size={14} className="text-slate-500 absolute right-3 pointer-events-none" />
            )}
          </label>
        </div>
      )}

      <div className="space-y-3">
        {(motorRows.length > 0 || motorChecks.length > 0) && (
          <CollapsibleSection
            title="Motor & Engine"
            icon={<Zap size={16} className="text-sky-600" />}
            defaultOpen
          >
            {motorRows.length > 0 && (
              <dl className="space-y-0.5">
                {motorRows.map((row, i) => (
                  <SpecRow key={i} label={row.label} value={row.value} odd={i % 2 === 0} />
                ))}
              </dl>
            )}
            <SpecCheckboxChips labels={motorChecks} />
          </CollapsibleSection>
        )}

        {(chargingRows.length > 0 || chargingChecks.length > 0) && (
          <CollapsibleSection
            title="Charging"
            icon={<BatteryCharging size={16} className="text-emerald-600" />}
          >
            {chargingRows.length > 0 && (
              <dl className="space-y-0.5">
                {chargingRows.map((row, i) => (
                  <SpecRow key={i} label={row.label} value={row.value} odd={i % 2 === 0} />
                ))}
              </dl>
            )}
            <SpecCheckboxChips labels={chargingChecks} />
          </CollapsibleSection>
        )}

        {(dimensionRows.length > 0 || dimensionChecks.length > 0) && (
          <CollapsibleSection title="Capacity & Dimensions" icon={<Gauge size={16} className="text-violet-600" />}>
            {dimensionRows.length > 0 && (
              <dl className="space-y-0.5">
                {dimensionRows.map((row, i) => (
                  <SpecRow key={i} label={row.label} value={row.value} odd={i % 2 === 0} />
                ))}
              </dl>
            )}
            <SpecCheckboxChips labels={dimensionChecks} />
          </CollapsibleSection>
        )}

        {extraSections.map((sec, si) => {
          const rows = sectionFieldRows(sec.fields);
          const checks = sectionCheckboxLabels(sec.fields);
          return (
            <CollapsibleSection
              key={si}
              title={sec.title}
              icon={<LayoutList size={16} className="text-amber-600" />}
            >
              {rows.length > 0 && (
                <dl className="space-y-0.5">
                  {rows.map((f, fi) => (
                    <SpecRow key={fi} label={f.label} value={f.value} odd={fi % 2 === 0} />
                  ))}
                </dl>
              )}
              <SpecCheckboxChips labels={checks} />
            </CollapsibleSection>
          );
        })}

        {(customFieldRows.length > 0 || customFieldChecks.length > 0) && (
          <CollapsibleSection title="Extra Specs" icon={<LayoutList size={16} className="text-violet-600" />}>
            {customFieldRows.length > 0 && (
              <dl className="space-y-0.5">
                {customFieldRows.map((f, i) => (
                  <SpecRow key={i} label={f.label} value={f.value} odd={i % 2 === 0} />
                ))}
              </dl>
            )}
            <SpecCheckboxChips labels={customFieldChecks} />
          </CollapsibleSection>
        )}

        {showFeatures && feat && (() => {
          const rows = [
            feat.drivetrain && { label: "Drivetrain", value: String(feat.drivetrain) },
            feat.front_brakes && { label: "Front Brakes", value: String(feat.front_brakes) },
            feat.rear_brakes && { label: "Rear Brakes", value: String(feat.rear_brakes) },
            feat.front_suspension && { label: "Front Suspension", value: String(feat.front_suspension) },
            feat.rear_suspension && { label: "Rear Suspension", value: String(feat.rear_suspension) },
            feat.seating_capacity && { label: "Seating Capacity", value: String(feat.seating_capacity) },
            feat.screen_size_inches && { label: "Screen Size", value: `${feat.screen_size_inches}"` },
            feat.front_speakers != null && Number(feat.front_speakers) > 0 && { label: "Front Speakers", value: String(feat.front_speakers) },
            feat.rear_speakers != null && Number(feat.rear_speakers) > 0 && { label: "Rear Speakers", value: String(feat.rear_speakers) },
            (feat.airbag_count != null && Number(feat.airbag_count) > 0) && { label: "Airbags", value: String(feat.airbag_count) },
            Number(feat.adas_level) > 0 && { label: "ADAS Level", value: String(feat.adas_level) },
            feat.ncap_safety_rating && { label: "NCAP Rating", value: `${feat.ncap_safety_rating} ★` },
            feat.boot_storage_litres && { label: "Boot Storage Capacity", value: `${feat.boot_storage_litres} L` },
            ...sectionFieldRows(normalizeExtras(feat.extra_features as unknown[])),
          ].filter(Boolean) as { label: string; value: string }[];
          const extraCheckLabels = sectionCheckboxLabels(normalizeExtras(feat.extra_features as unknown[]));
          const boolFeatures = [
            feat.has_sunroof && "Sunroof", feat.has_climate_control && "Climate Control",
            feat.has_cruise_control && "Cruise Control", feat.has_wireless_charger && "Wireless Charger",
            feat.has_keyless_entry && "Keyless Entry", feat.has_wireless_carplay_android_auto && "Wireless CarPlay/AA",
            feat.has_connected_car_app && "Connected Car App", feat.has_ota_updates && "OTA Updates",
            feat.has_abs_ebd && "ABS + EBD", feat.has_esp && "ESP",
            feat.has_tpms && "TPMS", feat.has_360_camera && "360° Camera",
            feat.has_speedometer_digital && "Digital Speedometer", feat.has_odometer_digital && "Digital Odometer",
            feat.has_voice_assist && "Voice Assist", feat.has_stand_alarm && "Stand Alarm",
            feat.has_low_battery_indicator && "Low Battery Indicator", feat.has_clock && "Clock",
            feat.has_call_sms_alert && "Call/SMS Alert", feat.has_tripmeter && "Tripmeter",
            feat.has_boot_storage && "Boot Storage", feat.has_usb_charging_port && "USB Charging",
            feat.has_keyless_lock_unlock && "Keyless Lock/Unlock", feat.has_start_type_self && "Self Start",
            feat.has_reverse_mode && "Reverse Mode",
            feat.has_gps && "GPS Connectivity", feat.has_navigation && "Navigation",
          ].filter(Boolean) as string[];

          const lightsRows = [
            feat.headlight_type && { label: "Headlights", value: String(feat.headlight_type) },
          ].filter(Boolean) as { label: string; value: string }[];
          
          const lightsBoolFeatures = [
            feat.has_boot_light && "Boot Light",
            feat.has_tail_light && "Tail Light", feat.has_break_light && "Break Light",
            feat.has_turn_signal && "Turn Signal", feat.has_drls && "DRLs",
          ].filter(Boolean) as string[];

          const drivingModesBoolFeatures = [
            feat.has_mode_eco && "Eco Mode", feat.has_mode_normal && "Normal Mode",
            feat.has_mode_sports && "Sports Mode", feat.has_mode_hyper && "Hyper Mode",
            feat.has_mode_cruise && "Cruise Mode", feat.has_mode_reverse && "Reverse Mode",
          ].filter(Boolean) as string[];

          return (
            <>
              {(rows.length > 0 || boolFeatures.length > 0 || extraCheckLabels.length > 0) && (
                <CollapsibleSection title="Features & Safety" icon={<CheckCircle2 size={16} className="text-sky-600" />}>
                  {rows.length > 0 && (
                    <dl className="space-y-0.5 mb-3">
                      {rows.map((row, i) => (
                        <SpecRow key={i} label={row.label} value={row.value} odd={i % 2 === 0} />
                      ))}
                    </dl>
                  )}
                  <SpecCheckboxChips labels={[...boolFeatures, ...extraCheckLabels]} />
                </CollapsibleSection>
              )}

              {(lightsRows.length > 0 || lightsBoolFeatures.length > 0) && (
                <CollapsibleSection title="Lights" icon={<Lightbulb size={16} className="text-yellow-500" />}>
                  {lightsRows.length > 0 && (
                    <dl className="space-y-0.5 mb-3">
                      {lightsRows.map((row, i) => (
                        <SpecRow key={i} label={row.label} value={row.value} odd={i % 2 === 0} />
                      ))}
                    </dl>
                  )}
                  <SpecCheckboxChips labels={lightsBoolFeatures} />
                </CollapsibleSection>
              )}

              {drivingModesBoolFeatures.length > 0 && (
                <CollapsibleSection title="Driving Modes" icon={<Activity size={16} className="text-indigo-500" />}>
                  <SpecCheckboxChips labels={drivingModesBoolFeatures} />
                </CollapsibleSection>
              )}
            </>
          );
        })()}

        {item.pros.length > 0 && (
          <CollapsibleSection
            title="Things we like"
            icon={<CheckCircle2 size={16} className="text-emerald-600" />}
          >
            <ul className="space-y-2.5">
              {item.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-800">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  {pro}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {item.cons.length > 0 && (
          <CollapsibleSection
            title="Weakness"
            icon={<CircleMinus size={16} className="text-amber-600" />}
          >
            <ul className="space-y-2.5">
              {item.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-800">
                  <CircleMinus size={15} className="mt-0.5 shrink-0 text-amber-600" />
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

function SpecCheckboxChips({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-2 border-t-2 border-slate-200">
      {labels.map((f) => (
        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-sky-100 border-2 border-sky-200 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
          <CheckCircle2 size={10} className="text-sky-600" /> {f}
        </span>
      ))}
    </div>
  );
}

function SpecRow({ label, value, odd }: { label: string; value: string; odd?: boolean }) {
  return (
    <div className={`flex items-start sm:items-center justify-between gap-4 rounded-lg px-3 py-2 border border-transparent ${odd ? "bg-white border-slate-200" : "bg-slate-100/80"}`}>
      <dt className="text-xs font-medium text-slate-600 shrink-0">{label}</dt>
      <dd className="text-xs font-bold text-slate-900 text-right break-words max-w-[65%]">{value}</dd>
    </div>
  );
}
