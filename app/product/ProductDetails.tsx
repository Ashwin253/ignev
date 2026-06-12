"use client";

import { useMemo, useState } from "react";
import {
  BatteryCharging, Zap, Gauge, CheckCircle2, CircleMinus, ChevronDown, ChevronUp, LayoutList, Lightbulb, Activity, Disc, PlayCircle, MapPin,
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

  const activeVariantId = useMemo(() => {
    const v = item.batteryVariants.find(v => v.modelName === selectedVariant)
      || item.baasVariants.find(v => v.modelName === selectedVariant);
    return v?.id;
  }, [item, selectedVariant]);

  const relevantVideos = useMemo(() => {
    const rawVideos = item.video_links || [];
    return rawVideos.filter(v => v.url && (v.variantId === activeVariantId || !v.variantId));
  }, [item.video_links, activeVariantId]);

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
  const allExtraSections = (
    item.variantExtraSections?.find((v) => v.variantName === selectedVariant)
    ?? item.variantExtraSections?.[0]
  )?.sections?.filter((s) => s.title && sectionHasContent(s.fields)) ?? [];

  const brakesAndWheelsSection = allExtraSections.find(s => s.title === "Brakes & Wheels");
  const extraSections = allExtraSections.filter(s => s.title !== "Brakes & Wheels");

  const customFields = (
    item.variantCustomFields?.find((v) => v.variantName === selectedVariant)
    ?? item.variantCustomFields?.[0]
  )?.fields;
  const customFieldRows = sectionFieldRows(customFields);
  const customFieldChecks = sectionCheckboxLabels(customFields);

  const feat = item.variantFeatures?.find((f) => f.variantName === selectedVariant)
    ?? item.variantFeatures?.[0];
  const showFeatures = feat && hasFeatureContent(feat);

  if (feat?.drivetrain) {
    motorRows.push({ label: "Drivetrain", value: String(feat.drivetrain) });
  }
  if (feat?.seating_capacity) {
    dimensionRows.push({ label: "Seating Capacity", value: String(feat.seating_capacity) });
  }

  const brakesRows = [
    feat?.front_brakes && { label: "Front Brakes", value: String(feat.front_brakes) },
    feat?.rear_brakes && { label: "Rear Brakes", value: String(feat.rear_brakes) },
    ...(brakesAndWheelsSection ? sectionFieldRows(brakesAndWheelsSection.fields) : []),
  ].filter(Boolean) as { label: string; value: string }[];
  
  const brakesChecks = brakesAndWheelsSection ? sectionCheckboxLabels(brakesAndWheelsSection.fields) : [];

  const relevantCityPricing = useMemo(() => {
    if (!item.city_pricing || item.city_pricing.length === 0) return [];
    
    // Find active variant matching details
    const activeVar = item.batteryVariants.find(v => v.modelName === selectedVariant)
      || item.baasVariants.find(v => v.modelName === selectedVariant);
    const activeVarId = activeVar?.id || "";

    return item.city_pricing.filter(p => {
      const pVariant = p.variant_id;
      if (!pVariant || pVariant === "Main Model / Base") {
        return !selectedVariant || selectedVariant === "Main Model / Base" || selectedVariant === item.title || selectedVariant === (variants[0] || "");
      }
      const isMatchById = activeVarId && String(pVariant) === String(activeVarId);
      const isMatchByName = String(pVariant).toLowerCase().trim() === selectedVariant.toLowerCase().trim();
      return isMatchById || isMatchByName;
    });
  }, [item.city_pricing, item.batteryVariants, item.baasVariants, selectedVariant, item.title, variants]);

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

        {(brakesRows.length > 0 || brakesChecks.length > 0) && (
          <CollapsibleSection title="Brakes & Wheels" icon={<Disc size={16} className="text-slate-600" />}>
            {brakesRows.length > 0 && (
              <dl className="space-y-0.5">
                {brakesRows.map((row, i) => (
                  <SpecRow key={i} label={row.label} value={row.value} odd={i % 2 === 0} />
                ))}
              </dl>
            )}
            <SpecCheckboxChips labels={brakesChecks} />
          </CollapsibleSection>
        )}

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
            feat.front_suspension && { label: "Front Suspension", value: String(feat.front_suspension) },
            feat.rear_suspension && { label: "Rear Suspension", value: String(feat.rear_suspension) },
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
            feat.has_abs && "ABS", feat.has_ebd && "EBD", feat.has_esp && "ESP",
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
{relevantCityPricing.length > 0 && (
          <CollapsibleSection
            title="City-wise On-Road Prices"
            icon={<MapPin size={16} className="text-rose-600" />}
            defaultOpen
          >
            <dl className="space-y-0.5">
              {relevantCityPricing.map((row, i) => (
                <SpecRow
                  key={row.id || i}
                  label={`${row.location_name} (${row.location_type})`}
                  value={row.on_road_price ? `₹${row.on_road_price} Lakh` : "—"}
                  odd={i % 2 === 0}
                />
              ))}
            </dl>
          </CollapsibleSection>
        )}
        {/* City-wise On Road Price */}
        {(item as any).cityPrices && (item as any).cityPrices.length > 0 && (
          <CollapsibleSection title="City-wise On Road Price" icon={<Gauge size={16} className="text-amber-500" />} defaultOpen={true}>
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-3 min-w-max">
                {(() => {
                  const prices = (item as any).cityPrices as Array<{ variantId: string; variantName: string; city: string; on_road_price: number; subsidy?: number }>;
                  // Group by variant
                  const byVariant = new Map<string, typeof prices>();
                  for (const cp of prices) {
                    const arr = byVariant.get(cp.variantName) ?? [];
                    arr.push(cp);
                    byVariant.set(cp.variantName, arr);
                  }
                  return Array.from(byVariant.entries()).map(([variantName, cities]) => (
                    <div key={variantName} className="shrink-0">
                      {byVariant.size > 1 && <p className="text-[10px] font-bold text-slate-500 mb-2">{variantName}</p>}
                      <div className="flex gap-2">
                        {cities.map((cp, ci) => (
                          <div key={ci} className="shrink-0 w-40 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{cp.city}</p>
                            <p className="text-lg font-black text-slate-900 mt-1">₹{(cp.on_road_price > 1000 ? (cp.on_road_price / 100000).toFixed(2).replace(/\.?0+$/, "") : cp.on_road_price)} L</p>
                            {cp.subsidy && cp.subsidy > 0 && (
                              <p className="text-[9px] text-emerald-600 font-bold mt-0.5">-₹{(cp.subsidy / 1000).toFixed(0)}K subsidy</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </CollapsibleSection>
        )}

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

        {relevantVideos.length > 0 && (
          <CollapsibleSection
            title="Videos & Walkarounds"
            icon={<PlayCircle size={16} className="text-sky-600" />}
            defaultOpen
          >
            <div className="space-y-6">
              {relevantVideos.map((video, idx) => {
                const embedUrl = getEmbedUrl(video.url);
                return (
                  <div key={idx} className="space-y-2.5">
                    {video.title && (
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{video.title}</p>
                    )}
                    {embedUrl ? (
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow bg-black">
                        <iframe
                          src={embedUrl}
                          title={video.title || "Video Player"}
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-300 transition-all group"
                      >
                        <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-100 shrink-0">
                          <PlayCircle size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{video.title || "Watch Video Guide"}</p>
                          <p className="text-[10px] text-slate-500 truncate">{video.url}</p>
                        </div>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(ytRegex);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
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
