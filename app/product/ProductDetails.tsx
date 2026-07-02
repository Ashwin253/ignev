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
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white/60 backdrop-blur-sm overflow-hidden dark:bg-zinc-900/40 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="text-emerald-600">{icon}</div>
        <p className="text-[13px] font-semibold tracking-wide text-zinc-800 dark:text-zinc-100 flex-1 text-left">{title}</p>
        {open? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
      </button>
      {open && <div className="px-5 py-4 border-t border-zinc-200/60 dark:border-zinc-800">{children}</div>}
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

  return (
    <div className="mt-12 rounded-[28px] border border-zinc-200/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] dark:bg-zinc-900/60 dark:border-zinc-800 p-6 md:p-8">
      <div className="text-center mb-6">
        <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-white">Specifications</h2>
        <p className="text-sm text-zinc-500 mt-1">Detailed tech for {item.brand} {item.title}</p>
      </div>

      {variants.length > 0 && (
        <div className="mb-6 flex justify-center">
          <label className="relative inline-flex items-center gap-2.5 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-4 py-2.5 dark:bg-zinc-800/60 dark:border-zinc-700">
            <Gauge size={15} className="text-emerald-600 shrink-0" />
            {variants.length > 1? (
              <select
                value={selectedVariant}
                onChange={(e) => { setLocalSelectedVariant(e.target.value); selectVariantByName(e.target.value); }}
                className="bg-transparent text-sm font-medium text-zinc-900 outline-none pr-6 dark:text-white"
              >
                {variants.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : (
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{variants[0]}</span>
            )}
            {variants.length > 1 && <ChevronDown size={14} className="text-zinc-400 absolute right-3 pointer-events-none" />}
          </label>
        </div>
      )}

      <div className="space-y-3 max-w-3xl mx-auto">
        {(motorRows.length > 0 || motorChecks.length > 0) && (
          <CollapsibleSection title="Motor & Engine" icon={<Zap size={16}/>}>
            <SpecList rows={motorRows} />
            <SpecCheckboxChips labels={motorChecks} />
          </CollapsibleSection>
        )}

        {(chargingRows.length > 0 || chargingChecks.length > 0) && (
          <CollapsibleSection title="Charging" icon={<BatteryCharging size={16} />}>
            <SpecList rows={chargingRows} />
            <SpecCheckboxChips labels={chargingChecks} />
          </CollapsibleSection>
        )}

        {(dimensionRows.length > 0 || dimensionChecks.length > 0) && (
          <CollapsibleSection title="Capacity & Dimensions" icon={<Gauge size={16} />}>
            <SpecList rows={dimensionRows} />
            <SpecCheckboxChips labels={dimensionChecks} />
          </CollapsibleSection>
        )}

        {extraSections.map((sec, i) => (
          <CollapsibleSection key={i} title={sec.title} icon={<LayoutList size={16} />}>
            <SpecList rows={sectionFieldRows(sec.fields)} />
            <SpecCheckboxChips labels={sectionCheckboxLabels(sec.fields)} />
          </CollapsibleSection>
        ))}

        {(brakesRows.length > 0 || brakesChecks.length > 0) && (
          <CollapsibleSection title="Brakes & Wheels" icon={<Disc size={16} />}>
            <SpecList rows={brakesRows} />
            <SpecCheckboxChips labels={brakesChecks} />
          </CollapsibleSection>
        )}

        {showFeatures && feat && (
          <CollapsibleSection title="Features & Safety" icon={<CheckCircle2 size={16} />}>
            <SpecCheckboxChips labels={[
              feat.has_sunroof && "Sunroof", feat.has_abs && "ABS", feat.has_esp && "ESP",
              feat.has_360_camera && "360° Camera", feat.has_tpms && "TPMS",
            ].filter(Boolean) as string[]} />
          </CollapsibleSection>
        )}

        {relevantCityPricing.length > 0 && (
          <CollapsibleSection title="City-wise On-Road Prices" icon={<MapPin size={16} />} defaultOpen>
            <div className="grid sm:grid-cols-2 gap-2">
              {relevantCityPricing.map((row, i) => (
                <div key={i} className="flex justify-between items-center rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/70">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.location_name}</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">₹{row.on_road_price} L</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {item.pros.length > 0 && (
          <CollapsibleSection title="Things we like" icon={<CheckCircle2 size={16} />}>
            <ul className="space-y-2">
              {item.pros.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {item.cons.length > 0 && (
          <CollapsibleSection title="Could be better" icon={<CircleMinus size={16} />}>
            <ul className="space-y-2">
              {item.cons.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <CircleMinus size={16} className="text-rose-500 mt-0.5 shrink-0" />{c}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {relevantVideos.length > 0 && (
          <CollapsibleSection title="Videos & Walkarounds" icon={<PlayCircle size={16} />} defaultOpen>
            <div className="grid gap-4">
              {relevantVideos.map((v, i) => {
                const url = getEmbedUrl(v.url);
                return url? (
                  <div key={i} className="aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <iframe src={url} className="w-full h-full" allowFullScreen />
                  </div>
                ) : null;
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

function getEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:.*v=|embed\/)|youtu\.be\/)([^"&?\/\s]{11})/);
  return m? `https://www.youtube.com/embed/${m[1]}` : null;
}

function SpecList({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return null;
  return (
    <dl className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
      {rows.map((r, i) => (
        <div key={i} className="flex justify-between gap-4 py-2.5">
          <dt className="text-[13px] text-zinc-500">{r.label}</dt>
          <dd className="text-[13px] font-medium text-zinc-900 dark:text-white text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SpecCheckboxChips({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800">
      {labels.map((f) => (
        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
          <CheckCircle2 size={12} /> {f}
        </span>
      ))}
    </div>
  );
}