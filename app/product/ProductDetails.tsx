"use client";

import { useMemo, useState, useEffect } from "react";
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

function SpecList({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
      {rows.map((r, i) => (
        <div key={i} className="flex justify-between items-center py-2.5 group">
          <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 w-1/2 group-hover:text-zinc-700 transition-colors">{r.label}</span>
          <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 w-1/2 text-right break-words">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function SpecCheckboxChips({ labels }: { labels: string[] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
      {labels.map((lbl, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/30">
          <CheckCircle2 size={12} className="text-emerald-500" />
          {lbl}
        </span>
      ))}
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
    return rawVideos.filter(v => 
      v.url && (
        (activeVariantId && v.variantId === activeVariantId) || 
        (!v.variantId && selectedVariant && (v as any).variantName === selectedVariant) ||
        (!v.variantId && !(v as any).variantName)
      )
    );
  }, [item.video_links, activeVariantId, selectedVariant]);

  if (!listingHasSpecifications(item)) return null;

  const batterySpec = item.batterySpecs.find((s) => s.variantName === selectedVariant);
  const chargingSpec = item.chargingSpecs.find((s) => s.variantName === selectedVariant);
  const motorRows = batterySpec? motorSpecRows(batterySpec) : [];
  const motorChecks = batterySpec? motorSpecCheckboxes(batterySpec) : [];
  const chargingRows = chargingSpec? chargingSpecRows(chargingSpec) : [];
  const chargingChecks = chargingSpec? chargingSpecCheckboxes(chargingSpec) : [];

  const dim = item.variantDimensions?.find((d) => d.variantName === selectedVariant)?? item.variantDimensions?.[0];
  const dimensionRows = dim? dimensionSpecRows(dim) : [];
  const dimensionChecks = dim? dimensionSpecCheckboxes(dim) : [];

  const sectionHasContent = (fields: Array<{ label: string; value: string; kind?: "field" | "checkbox" | undefined }> | undefined) =>
    fields?.some((f) => f.label && (!isCheckboxExtra(f)? f.value.trim() : isExtraChecked(f.value)));

  const allExtraSections = (item.variantExtraSections?.find((v) => v.variantName === selectedVariant)?? item.variantExtraSections?.[0])?.sections?.filter((s) => s.title && sectionHasContent(s.fields))?? [];

  const brakesAndWheelsSection = allExtraSections.find(s => s.title === "Brakes & Wheels");
  const extraSections = allExtraSections.filter(s => s.title!== "Brakes & Wheels");

  const customFields = (item.variantCustomFields?.find((v) => v.variantName === selectedVariant)?? item.variantCustomFields?.[0])?.fields;
  const customFieldRows = sectionFieldRows(customFields);
  const customFieldChecks = sectionCheckboxLabels(customFields);

  const feat = item.variantFeatures?.find((f) => f.variantName === selectedVariant)?? item.variantFeatures?.[0];
  const showFeatures = feat && hasFeatureContent(feat);

  if (feat?.drivetrain) motorRows.push({ label: "Drivetrain", value: String(feat.drivetrain) });
  if (feat?.seating_capacity) dimensionRows.push({ label: "Seating Capacity", value: String(feat.seating_capacity) });

  const brakesRows = [
    feat?.front_brakes && { label: "Front Brakes", value: String(feat.front_brakes) },
    feat?.rear_brakes && { label: "Rear Brakes", value: String(feat.rear_brakes) },
   ...(brakesAndWheelsSection? sectionFieldRows(brakesAndWheelsSection.fields) : []),
  ].filter(Boolean) as { label: string; value: string }[];

  const brakesChecks = brakesAndWheelsSection? sectionCheckboxLabels(brakesAndWheelsSection.fields) : [];

  const relevantCityPricing = useMemo(() => {
    if (!item.city_pricing?.length) return [];
    const activeVar = item.batteryVariants.find(v => v.modelName === selectedVariant) || item.baasVariants.find(v => v.modelName === selectedVariant);
    return item.city_pricing.filter(p => {
      if (!p.variant_id || p.variant_id === "Main Model / Base") return true;
      return String(p.variant_id) === String(activeVar?.id) || String(p.variant_id).toLowerCase() === selectedVariant.toLowerCase();
    });
  }, [item, selectedVariant]);

  const sections = [
    {
      id: "motor",
      title: "Motor & Engine",
      icon: <Zap size={16} />,
      condition: motorRows.length > 0 || motorChecks.length > 0,
      content: (
        <>
          <SpecList rows={motorRows} />
          <SpecCheckboxChips labels={motorChecks} />
        </>
      )
    },
    {
      id: "charging",
      title: "Charging",
      icon: <BatteryCharging size={16} />,
      condition: chargingRows.length > 0 || chargingChecks.length > 0,
      content: (
        <>
          <SpecList rows={chargingRows} />
          <SpecCheckboxChips labels={chargingChecks} />
        </>
      )
    },
    {
      id: "capacity",
      title: "Capacity & Dimensions",
      icon: <Gauge size={16} />,
      condition: dimensionRows.length > 0 || dimensionChecks.length > 0,
      content: (
        <>
          <SpecList rows={dimensionRows} />
          <SpecCheckboxChips labels={dimensionChecks} />
        </>
      )
    },
    ...extraSections.map((sec, i) => ({
      id: `extra_${i}`,
      title: sec.title,
      icon: <LayoutList size={16} />,
      condition: true,
      content: (
        <>
          <SpecList rows={sectionFieldRows(sec.fields)} />
          <SpecCheckboxChips labels={sectionCheckboxLabels(sec.fields)} />
        </>
      )
    })),
    {
      id: "brakes",
      title: "Brakes & Wheels",
      icon: <Disc size={16} />,
      condition: brakesRows.length > 0 || brakesChecks.length > 0,
      content: (
        <>
          <SpecList rows={brakesRows} />
          <SpecCheckboxChips labels={brakesChecks} />
        </>
      )
    },
    {
      id: "features",
      title: "Features & Safety",
      icon: <CheckCircle2 size={16} />,
      condition: showFeatures && feat,
      content: (
        <SpecCheckboxChips labels={[
          feat?.has_sunroof && "Sunroof", feat?.has_abs && "ABS", feat?.has_esp && "ESP",
          feat?.has_360_camera && "360° Camera", feat?.has_tpms && "TPMS",
        ].filter(Boolean) as string[]} />
      )
    },
    {
      id: "pricing",
      title: "City-wise Prices",
      icon: <MapPin size={16} />,
      condition: relevantCityPricing.length > 0,
      content: (
        <div className="grid sm:grid-cols-2 gap-3">
          {relevantCityPricing.map((row, i) => (
            <div key={i} className="flex justify-between items-center rounded-xl bg-zinc-50 px-4 py-3 border-2 border-zinc-200/60 dark:bg-zinc-800/70">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.location_name}</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">₹{row.on_road_price} L</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "pros",
      title: "Things we like",
      icon: <CheckCircle2 size={16} />,
      condition: item.pros && item.pros.length > 0,
      content: (
        <ul className="space-y-3">
          {item.pros.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />{p}
            </li>
          ))}
        </ul>
      )
    },
    {
      id: "cons",
      title: "Could be better",
      icon: <CircleMinus size={16} />,
      condition: item.cons && item.cons.length > 0,
      content: (
        <ul className="space-y-3">
          {item.cons.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <CircleMinus size={18} className="text-rose-500 shrink-0" />{c}
            </li>
          ))}
        </ul>
      )
    },
    {
      id: "videos",
      title: "Videos & Walkarounds",
      icon: <PlayCircle size={16} />,
      condition: relevantVideos.length > 0,
      content: (
        <div className="grid gap-4">
          {relevantVideos.map((v, i) => {
            const url = getEmbedUrl(v.url);
            return url ? (
              <div key={i} className="aspect-video w-full overflow-hidden rounded-2xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <iframe src={url} className="w-full h-full" allowFullScreen />
              </div>
            ) : null;
          })}
        </div>
      )
    }
  ].filter(s => s.condition);

  const [activeTabId, setActiveTabId] = useState(sections[0]?.id);

  useEffect(() => {
    if (sections.length > 0 && !sections.find(s => s.id === activeTabId)) {
      setActiveTabId(sections[0].id);
    }
  }, [sections, activeTabId]);

  return (
    <div className="mt-12 rounded-[28px] border-2 border-black bg-white/70 backdrop-blur-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:bg-zinc-900/60 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-white">Specifications & Details</h2>
          <p className="text-sm text-zinc-500 mt-1">Detailed tech for {item.brand} {item.title}</p>
        </div>
        
        {variants.length > 0 && (
          <label className="relative inline-flex items-center gap-2.5 rounded-2xl border-2 border-black bg-white px-4 py-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:bg-zinc-800 shrink-0">
            <Gauge size={15} className="text-emerald-600 shrink-0" />
            {variants.length > 1 ? (
              <select
                value={selectedVariant}
                onChange={(e) => { setLocalSelectedVariant(e.target.value); selectVariantByName(e.target.value); }}
                className="bg-transparent text-sm font-bold text-zinc-900 outline-none pr-6 dark:text-white cursor-pointer"
              >
                {variants.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : (
              <span className="text-sm font-bold text-zinc-900 dark:text-white pr-4">{variants[0]}</span>
            )}
            {variants.length > 1 && <ChevronDown size={14} className="text-zinc-900 absolute right-3 pointer-events-none" />}
          </label>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Dropdown / Horizontal Tabs */}
        <div className="md:hidden relative">
          <select 
             value={activeTabId} 
             onChange={(e) => setActiveTabId(e.target.value)}
             className="w-full rounded-2xl border-2 border-black bg-white px-4 py-3.5 font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] outline-none appearance-none"
          >
             {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Desktop Vertical Tabs */}
        <div className="hidden md:flex flex-col gap-2 w-64 shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveTabId(s.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all ${
                activeTabId === s.id 
                ? 'border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                : 'border-transparent hover:border-black/20 hover:bg-white/50 text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <div className={activeTabId === s.id ? "text-emerald-600" : "text-zinc-500"}>{s.icon}</div>
              <span className={`font-bold text-[13px] text-left flex-1 ${activeTabId === s.id ? "text-zinc-900" : ""}`}>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border-2 border-black bg-white p-5 md:p-7 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:bg-zinc-900/40">
            <h3 className="text-lg font-bold text-zinc-900 mb-5 flex items-center gap-2 border-b border-zinc-100 pb-4">
               <span className="text-emerald-600">{sections.find(s => s.id === activeTabId)?.icon}</span>
               {sections.find(s => s.id === activeTabId)?.title}
            </h3>
            {sections.find(s => s.id === activeTabId)?.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function getEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:.*v=|embed\/)|youtu\.be\/)([^"&?\/\s]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
