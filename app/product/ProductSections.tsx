"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { BatteryCharging, Check, ChevronDown, Gauge, Plus, Ruler, Send, Timer, Zap, Wind } from "lucide-react";
import type { EvListing } from "../lib/wordpress";
import { getVehicleCardSpecs } from "../lib/listing-specs";
import { emiPerMonth, inr } from "../lib/format";
import { triggerEnquiryModal } from "../components/EnquiryModal";
import { btn, Container, cx, Eyebrow } from "../components/ui/kit";
import { useProductSelection } from "./ProductSelectionProvider";
import type { Faq } from "../lib/product-faq";

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
};
/** Variant prices are stored in lakhs, but some rows hold rupees. */
const toLakh = (v: unknown) => {
  const n = num(v);
  return n > 10000 ? n / 100000 : n;
};
const chargeText = (mins: number) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
};

/* ---------------------------------------------------------------- */
/* Sticky section navigation with scroll-spy                          */
/* ---------------------------------------------------------------- */
export function ProductNav({ sections, title }: { sections: Array<{ id: string; label: string }>; title: string }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-130px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    // Scroll only the tab strip horizontally — never the page (scrollIntoView fights the user's own scrolling).
    const bar = barRef.current;
    const btnEl = bar?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (bar && btnEl) bar.scrollTo({ left: btnEl.offsetLeft - bar.clientWidth / 2 + btnEl.clientWidth / 2, behavior: "auto" });
  }, [active]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: "smooth" });
  };

  return (
    <div className="sticky top-[var(--header-h)] z-30 -mx-4 mt-10 border-y border-line bg-white/90 backdrop-blur-xl sm:-mx-6 lg:-mx-8">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <p className="hidden shrink-0 truncate text-sm font-extrabold text-ink xl:block xl:max-w-[220px]">{title}</p>
        <div ref={barRef} className="no-scrollbar flex flex-1 gap-1 overflow-x-auto py-2.5" role="tablist" aria-label="Product sections">
          {sections.map((s) => (
            <button
              key={s.id}
              data-id={s.id}
              onClick={() => go(s.id)}
              role="tab"
              aria-selected={active === s.id}
              className={cx(
                "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
                active === s.id ? "bg-brand text-white shadow-glow" : "text-ink-soft hover:bg-brand-soft hover:text-brand-deep",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={() => triggerEnquiryModal(title)} className={btn("ink", "sm", "hidden shrink-0 md:inline-flex")}>
          Get best offer
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Count-up number                                                    */
/* ---------------------------------------------------------------- */
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(v) });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref}>{(inView ? shown : 0).toFixed(decimals)}</span>;
}

/* ---------------------------------------------------------------- */
/* Highlights ribbon — reacts to the selected variant                 */
/* ---------------------------------------------------------------- */
export function ProductHighlights({ item }: { item: EvListing }) {
  const { activeVariants, selectedIndex, selectedVariantName } = useProductSelection();
  const v = activeVariants[selectedIndex] ?? item.batteryVariants?.[0];

  const stats = useMemo(() => {
    const spec = item.batterySpecs?.find((s) => s.variantName === selectedVariantName) ?? item.batterySpecs?.[0];
    const base = getVehicleCardSpecs({ ...item, batterySpecs: spec ? [spec, ...item.batterySpecs] : item.batterySpecs });
    const out: Array<{ icon: React.ReactNode; label: string; value: number; decimals?: number; unit: string }> = [];
    const range = num(v?.range);
    if (range) out.push({ icon: <Wind size={20} />, label: "Claimed range", value: range, unit: "km" });
    const cap = num(v?.capacity);
    if (cap) out.push({ icon: <BatteryCharging size={20} />, label: "Battery", value: cap, decimals: cap % 1 ? 1 : 0, unit: "kWh" });
    const p = num(base.power);
    if (p) out.push({ icon: <Zap size={20} />, label: "Max power", value: p, decimals: p % 1 ? 1 : 0, unit: /kw/i.test(base.power) ? "kW" : /ps/i.test(base.power) ? "PS" : "bhp" });
    const t = num(base.torque);
    if (t) out.push({ icon: <Gauge size={20} />, label: "Max torque", value: t, decimals: t % 1 ? 1 : 0, unit: "Nm" });
    if (item.topSpeed) out.push({ icon: <Ruler size={20} />, label: "Top speed", value: item.topSpeed, unit: "km/h" });
    const ch = num(v?.charge);
    if (ch) out.push({ icon: <Timer size={20} />, label: "Charging", value: ch / 60, decimals: 1, unit: "hours" });
    return out;
  }, [item, v, selectedVariantName]);

  if (!stats.length && !item.pros?.length) return null;

  return (
    <section id="highlights" className="scroll-mt-32 pt-12">
      <Eyebrow>At a glance</Eyebrow>
      <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
        Key highlights{selectedVariantName && <span className="text-ink-mute"> · {selectedVariantName}</span>}
      </h2>

      {stats.length > 0 && (
        <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-white/15 bg-gradient-to-br from-brand-deep via-[#0b5b3a] to-brand p-px shadow-lift md:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-gradient-to-br from-brand-deep to-[#0c5a3b] p-5 sm:p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-volt">{s.icon}</span>
              <p className="mt-5 font-display text-3xl font-extrabold leading-none text-white sm:text-[2.2rem]">
                <CountUp value={s.value} decimals={s.decimals} />
                <span className="ml-1 text-sm font-bold text-emerald-200">{s.unit}</span>
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100/70">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {item.pros?.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {item.pros.slice(0, 6).map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white">
                <Check size={14} strokeWidth={3} />
              </span>
              <p className="text-[15px] font-semibold leading-snug text-ink">{p}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Variants comparison table                                          */
/* ---------------------------------------------------------------- */
export function ProductVariants({ item, title }: { item: EvListing; title: string }) {
  const { activeVariants, selectedIndex, setSelectedIndex, showBaas } = useProductSelection();
  if (!activeVariants.length) return null;

  return (
    <div id="variants" className="scroll-mt-32">
      <Eyebrow>Choose your variant</Eyebrow>
      <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Variants &amp; prices</h2>
      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr_auto] gap-4 border-b border-line bg-paper px-6 py-3 text-[11px] font-extrabold uppercase tracking-wider text-ink-mute md:grid">
              <span>Variant</span>
              <span>Battery</span>
              <span>Range</span>
              <span>Charging</span>
              <span>{showBaas ? "Starting rate" : "Starting at"}</span>
              <span className="w-28" />
            </div>
            {activeVariants.map((v, i) => {
              const name = v.modelName || (v.capacity ? `${v.capacity} kWh` : `Variant ${i + 1}`);
              const selected = i === selectedIndex;
              const price = showBaas ? (v.baseprice ? `₹${toLakh(v.baseprice).toFixed(2)} L` : v.price_baas ? `₹${v.price_baas}/km` : "—") : v.price ? `₹${toLakh(v.price).toFixed(2)} L` : "TBA";
              return (
                <div
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={cx(
                    "grid cursor-pointer gap-3 border-b border-line px-5 py-4 transition last:border-0 md:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr_auto] md:items-center md:gap-4 md:px-6",
                    selected ? "bg-brand-soft/60" : "hover:bg-paper",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cx("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-brand bg-brand text-white" : "border-line-strong")}>
                      {selected && <Check size={11} strokeWidth={3.5} />}
                    </span>
                    <div>
                      <p className="font-extrabold text-ink">{name}</p>
                      {v.discontinued && <p className="text-[11px] font-bold text-coral">Discontinued</p>}
                    </div>
                  </div>
                  <Cell label="Battery" value={v.capacity ? `${v.capacity} kWh` : "—"} />
                  <Cell label="Range" value={v.range ? `${v.range} km` : "—"} />
                  <Cell label="Charging" value={v.charge ? chargeText(num(v.charge)) : "—"} />
                  <p className="text-lg font-extrabold text-ink md:text-base">
                    <span className="mr-2 text-[11px] font-bold uppercase tracking-wider text-ink-mute md:hidden">Price</span>
                    {price}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerEnquiryModal(`${title} – ${name}`);
                    }}
                    className={btn(selected ? "primary" : "outline", "sm", "w-full md:w-28")}
                  >
                    Get quote <Send size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm font-semibold text-ink-soft">
      <span className="mr-2 text-[11px] font-bold uppercase tracking-wider text-ink-mute md:hidden">{label}</span>
      {value}
    </p>
  );
}

/* ---------------------------------------------------------------- */
/* EMI estimator                                                       */
/* ---------------------------------------------------------------- */
export function ProductEmi({ title }: { title: string }) {
  const { activeVariants, selectedIndex } = useProductSelection();
  const lakh = toLakh(activeVariants[selectedIndex]?.price);
  const price = lakh * 100000;
  const [down, setDown] = useState(20);
  const [months, setMonths] = useState(36);
  const [rate, setRate] = useState(9.5);

  if (!price) return null;
  const principal = price * (1 - down / 100);
  const emi = emiPerMonth(principal, rate, months);
  const total = emi * months;
  const interest = total - principal;
  const pctPrincipal = Math.round((principal / total) * 100);

  return (
    <div id="emi" className="scroll-mt-32">
      <Eyebrow>Finance</Eyebrow>
      <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">EMI calculator</h2>
      <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
        <div className="space-y-6">
          <Slider label="Down payment" display={`${down}% · ₹${inr(price * (down / 100))}`} min={0} max={60} step={5} value={down} onChange={setDown} />
          <Slider label="Tenure" display={`${months} months`} min={12} max={84} step={6} value={months} onChange={setMonths} />
          <Slider label="Interest rate" display={`${rate.toFixed(1)}% p.a.`} min={7} max={15} step={0.5} value={rate} onChange={setRate} />
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-brand-deep to-[#0c5a3b] p-6 text-white">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-100/70">Monthly EMI</p>
          <p className="mt-1 font-display text-4xl font-extrabold sm:text-5xl">₹{inr(emi)}</p>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-volt" style={{ width: `${pctPrincipal}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-xs font-semibold text-emerald-100/80">
            <span>Principal ₹{inr(principal)}</span>
            <span>Interest ₹{inr(interest)}</span>
          </div>
          <button onClick={() => triggerEnquiryModal(`${title} – EMI ₹${inr(emi)}/mo`)} className={btn("volt", "md", "mt-6 w-full")}>
            Get loan offers <Send size={15} />
          </button>
          <p className="mt-3 text-[11px] leading-snug text-emerald-100/60">Indicative on ex-showroom price. Final rate depends on lender and profile.</p>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, display, min, max, step, value, onChange }: { label: string; display: string; min: number; max: number; step: number; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">{label}</span>
        <span className="text-sm font-extrabold text-ink">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} aria-label={label} className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-[#0f8f56]" />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* FAQ                                                                 */
/* ---------------------------------------------------------------- */
export function ProductFaq({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!faqs.length) return null;
  return (
    <section id="faq" className="scroll-mt-32 pt-16">
      <Eyebrow>Good to know</Eyebrow>
      <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        {faqs.map((f, i) => (
          <div key={f.q}>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7">
              <span className="text-[15px] font-bold text-ink sm:text-base">{f.q}</span>
              <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full transition", open === i ? "rotate-180 bg-brand text-white" : "bg-brand-soft text-brand")}>
                <ChevronDown size={17} />
              </span>
            </button>
            {open === i && <p className="px-5 pb-6 pr-14 text-[15px] leading-relaxed text-ink-soft sm:px-7">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
