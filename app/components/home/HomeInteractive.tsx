"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bike, Car, Fuel, Leaf, SlidersHorizontal, Truck, Zap } from "lucide-react";
import VehicleCard from "../VehicleCard";
import { btn, Chip, Container, Eyebrow, SectionHeading, cx } from "../ui/kit";
import Reveal from "../ui/Reveal";
import { getRecentlyViewed } from "../../lib/recently-viewed";
import { inr, itemSlug, priceLowLakh } from "../../lib/format";
import { matchesVehicleCategory } from "../../lib/catalog-filters";
import { getVehiclePhoto } from "../../lib/vehicle-images";
import type { CatalogItem } from "../../lib/catalog-types";

/* ------------------------------------------------------------------ */
/* Showcase — category tabs                                            */
/* ------------------------------------------------------------------ */
const TABS = [
  { key: "cars", label: "Cars", icon: Car },
  { key: "scooter", label: "Scooters", icon: Zap },
  { key: "bike", label: "Bikes", icon: Bike },
  { key: "commercial", label: "Commercial", icon: Truck },
] as const;

export function Showcase({ byCategory }: { byCategory: Record<string, CatalogItem[]> }) {
  const firstWithItems = TABS.find((t) => byCategory[t.key]?.length)?.key ?? "cars";
  const [tab, setTab] = useState<string>(firstWithItems);
  const items = byCategory[tab] ?? [];

  return (
    <section className="py-10 sm:py-16">
      <Container>
        {/* Category switcher bar (Heading hidden per request) */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Vehicle categories">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={cx(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-extrabold transition-all",
                    active
                      ? "border-brand bg-brand text-white shadow-lift"
                      : "border-line-strong bg-white text-ink shadow-xs hover:border-ink hover:bg-paper",
                  )}
                >
                  <Icon size={16} /> {t.label}
                  <span className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-black shadow-xs", active ? "bg-white text-brand" : "bg-ink/10 text-ink")}>
                    {byCategory[t.key]?.length ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
          <Link
            href={`/catalog?type=${tab}`}
            className="hidden items-center gap-1.5 text-sm font-extrabold text-brand hover:text-brand-deep sm:inline-flex"
          >
            All {TABS.find((t) => t.key === tab)?.label.toLowerCase()} <ArrowRight size={15} />
          </Link>
        </div>

        {items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((it, i) => (
              <VehicleCard key={itemSlug(it)} item={it} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line-strong bg-white p-12 text-center font-medium text-ink-soft">No vehicles in this category yet.</div>
        )}

        <div className="mt-9 flex justify-center">
          <Link href={`/catalog?type=${tab}`} className={btn("outline", "lg")}>
            Browse all {TABS.find((t) => t.key === tab)?.label.toLowerCase()} <ArrowRight size={18} />
          </Link>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal rail (new launches / upcoming)                           */
/* ------------------------------------------------------------------ */
/** Left/right padding that lines the rail up with the 1240px page container. */
const RAIL_PAD = "max(1rem, calc((100% - 1240px) / 2 + 2rem))";

export function Rail({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
  items,
  tone = "white",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href: string;
  hrefLabel?: string;
  items: CatalogItem[];
  tone?: "white" | "tint";
}) {
  if (!items.length) return null;
  return (
    <section className={cx("py-14 sm:py-20", tone === "tint" ? "border-y border-line bg-gradient-to-b from-brand-soft/60 to-paper" : "")}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} href={href} hrefLabel={hrefLabel} />
      </Container>
      <div className="no-scrollbar snap-x snap-mandatory overflow-x-auto" style={{ scrollPaddingLeft: RAIL_PAD }}>
        <div className="flex w-max gap-5 pb-6" style={{ paddingInline: RAIL_PAD }}>
          {items.map((it) => (
            <div key={itemSlug(it)} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
              <VehicleCard item={it} className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quick Match — budget + type → instant shortlist                     */
/* ------------------------------------------------------------------ */
const MATCH_TYPES = [
  { key: "all", label: "Anything" },
  { key: "scooter", label: "Scooter" },
  { key: "bike", label: "Bike" },
  { key: "cars", label: "Car" },
  { key: "commercial", label: "Commercial" },
];

export function QuickMatch({ items }: { items: CatalogItem[] }) {
  const [budget, setBudget] = useState(2);
  const [type, setType] = useState("all");

  const matches = useMemo(() => {
    return items
      .filter((i) => !i.upcoming)
      .filter((i) => {
        const p = priceLowLakh(i);
        return p > 0 && p <= budget;
      })
      .filter((i) => type === "all" || matchesVehicleCategory({ type: i.type, types: i.types, body_type: i.body_type, commercial: i.commercial } as any, type))
      .sort((a, b) => priceLowLakh(b) - priceLowLakh(a));
  }, [items, budget, type]);

  const max = type === "cars" || type === "commercial" ? 60 : type === "all" ? 40 : 10;
  const step = max > 20 ? 1 : 0.25;
  const safeBudget = Math.min(budget, max);
  const label = safeBudget >= 100 ? `₹${(safeBudget / 100).toFixed(1)} Cr` : `₹${safeBudget} lakh`;

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-6 shadow-card sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-volt/40 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Eyebrow>Quick match</Eyebrow>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">What can I get for my budget?</h2>
              <p className="mt-3 text-ink-soft">Slide to your budget and pick a vehicle type — we&apos;ll show what fits, instantly.</p>

              <div className="mt-8">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-ink-mute">Budget (ex-showroom)</span>
                  <span className="font-display text-3xl font-extrabold text-brand">{label}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={max}
                  step={step}
                  value={safeBudget}
                  onChange={(e) => setBudget(parseFloat(e.target.value))}
                  aria-label="Budget in lakh rupees"
                  style={{ backgroundColor: "#0e1b14" }}
                  className="mt-4 h-2.5 w-full cursor-pointer appearance-none rounded-full bg-ink accent-[#0f8f56]"
                />
                <div className="mt-1 flex justify-between text-xs font-bold text-ink">
                  <span>₹0.5L</span>
                  <span>₹{max}L</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {MATCH_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={cx(
                      "rounded-full border px-4 py-2 text-sm font-extrabold transition",
                      type === t.key
                        ? "border-brand bg-brand text-white shadow-sm"
                        : "border-line-strong bg-white text-ink shadow-xs hover:border-ink hover:bg-paper",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-ink">
                  <span className="text-brand">{matches.length}</span> {matches.length === 1 ? "vehicle fits" : "vehicles fit"} under {label}
                </p>
                <Link href={`/catalog?price=max-${safeBudget}${type !== "all" ? `&type=${type}` : ""}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-deep">
                  See all <ArrowRight size={15} />
                </Link>
              </div>
              {matches.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  {matches.slice(0, 6).map((m) => (
                    <Link
                      key={itemSlug(m)}
                      href={`/product/${itemSlug(m)}`}
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-paper/60 p-3 transition hover:border-brand hover:bg-white hover:shadow-card"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getVehiclePhoto(m.photo, m as any)} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-xl bg-white object-contain" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">{m.brand}</p>
                        <p className="truncate font-bold text-ink group-hover:text-brand">{m.name}</p>
                        <p className="text-sm font-semibold text-ink-soft">{m.pricing}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong p-10 text-center text-sm text-ink-soft">
                  Nothing at this budget yet — nudge the slider up a little.
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Savings teaser — petrol vs EV running cost                          */
/* ------------------------------------------------------------------ */
export function SavingsTeaser() {
  const [km, setKm] = useState(40);
  const petrolPerKm = 3.2; // ₹/km (≈ ₹105/L, 33 km/L two-wheeler/small car blend)
  const evPerKm = 0.55;
  const petrolMonthly = Math.round(petrolPerKm * km * 30);
  const evMonthly = Math.round(evPerKm * km * 30);
  const monthly = Math.max(0, petrolMonthly - evMonthly);
  const yearly = monthly * 12;
  const fiveYear = yearly * 5;

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div
          style={{ backgroundColor: "#0a4a30" }}
          className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-[#0a4a30] p-7 text-white shadow-lift border border-[#135d3f] sm:p-12 lg:grid-cols-2"
        >
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-volt">
              <Leaf size={14} /> Savings calculator
            </span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[2.6rem]">See how much going electric saves you.</h2>
            <p className="mt-3 max-w-md text-emerald-100 font-medium">Move the slider to your daily ride. Indicative numbers — use the full calculator for your exact vehicle and tariff.</p>
            <Link href="/tools?tool=savings" className={btn("volt", "lg", "mt-7")}>
              Open full calculator <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-3xl bg-[#042417]/80 border border-white/20 p-6 sm:p-8 backdrop-blur shadow-inner">
            <div className="flex items-end justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-200">Daily distance</span>
              <span className="font-display text-3xl font-extrabold text-volt">{km} km</span>
            </div>
            <input
              type="range"
              min={5}
              max={150}
              step={5}
              value={km}
              onChange={(e) => setKm(parseInt(e.target.value))}
              aria-label="Daily distance in kilometres"
              style={{ accentColor: "#8df0b0" }}
              className="mt-4 h-3 w-full cursor-pointer appearance-none rounded-full bg-white/25 border border-white/30 accent-[#8df0b0]"
            />
            <div className="mt-1 flex justify-between text-xs font-bold text-emerald-200">
              <span>5 km/day</span>
              <span>150 km/day</span>
            </div>

            {/* Visual comparison bar graph */}
            <div className="mt-6 space-y-2 rounded-2xl bg-black/35 p-4 border border-white/15">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-white font-bold">Petrol running cost:</span>
                <span className="text-coral font-black">₹{inr(petrolMonthly)}/mo</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full bg-coral rounded-full transition-all duration-300" style={{ width: "100%" }} />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-extrabold">
                <span className="text-white font-bold">EV electricity cost:</span>
                <span className="text-volt font-black">₹{inr(evMonthly)}/mo</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-volt rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(12, Math.round((evMonthly / petrolMonthly) * 100))}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { l: "Saved / month", v: monthly },
                { l: "Saved / year", v: yearly },
                { l: "Saved in 5 yrs", v: fiveYear },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-white/15 border border-white/20 px-2 py-3.5">
                  <p className="font-display text-lg font-extrabold text-white sm:text-2xl">₹{inr(s.v)}</p>
                  <p className="mt-1 text-[11px] font-extrabold text-volt">{s.l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-200">
              <Fuel size={13} className="text-volt shrink-0" /> Assumes ~₹3.2/km petrol vs ~₹0.55/km EV running cost.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Recently viewed (client-only, from localStorage)                    */
/* ------------------------------------------------------------------ */
export function RecentlyViewed({ items }: { items: CatalogItem[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => setSlugs(getRecentlyViewed()), []);
  const shown = useMemo(() => {
    const map = new Map(items.map((i) => [itemSlug(i), i]));
    return slugs.map((s) => map.get(s)).filter(Boolean).slice(0, 8) as CatalogItem[];
  }, [slugs, items]);
  if (!shown.length) return null;
  return (
    <Rail eyebrow="Pick up where you left" title="Recently viewed" href="/catalog" hrefLabel="Browse more" items={shown} />
  );
}

/* Re-export tiny helper so the page can show a hint chip */
export function HintChip() {
  return (
    <Chip tone="brand">
      <SlidersHorizontal size={11} /> Live
    </Chip>
  );
}
