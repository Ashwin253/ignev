"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, GitCompare, Heart, LayoutGrid, List, Search, Send, Share2, SlidersHorizontal, X, Zap } from "lucide-react";
import VehicleCard from "./VehicleCard";
import { triggerEnquiryModal } from "./EnquiryModal";
import { useCompare } from "../context/CompareContext";
import { useShortlist } from "../context/ShortlistContext";
import { CATALOG_CATEGORIES, normalizeCatalogCategory, matchesCatalogCategory, type CatalogCategoryValue } from "../lib/catalog-filters";
import { sortVehiclesByBrandRank, sortBrandsByRank, type BrandRankItem } from "../lib/brand-rankings";
import { matchesSearchQuery } from "../lib/catalog-search";
import { getVehiclePhoto } from "../lib/vehicle-images";
import { itemSlug, priceLowLakh } from "../lib/format";
import { getVehicleCardSpecs } from "../lib/listing-specs";
import type { CatalogItem } from "../lib/catalog-types";
import { btn, cx } from "./ui/kit";

export type { CatalogItem } from "../lib/catalog-types";

/* ------------------------------------------------------------------ */
/* Price filter — supports legacy buckets ("0-5") and "max-<lakh>"      */
/* ------------------------------------------------------------------ */
const PRICE_PRESETS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Any price" },
  { value: "max-1", label: "Under ₹1 lakh" },
  { value: "max-2", label: "Under ₹2 lakh" },
  { value: "0-5", label: "Under ₹5 lakh" },
  { value: "5-15", label: "₹5 – 15 lakh" },
  { value: "15-30", label: "₹15 – 30 lakh" },
  { value: "30+", label: "₹30 lakh +" },
];

function matchesPrice(item: CatalogItem, bucket: string): boolean {
  if (bucket === "all") return true;
  const low = priceLowLakh(item);
  if (bucket.startsWith("max-")) {
    const cap = parseFloat(bucket.slice(4));
    return !isNaN(cap) ? low > 0 && low <= cap : true;
  }
  if (bucket === "0-5") return low < 5;
  if (bucket === "5-15") return low >= 5 && low < 15;
  if (bucket === "15-30") return low >= 15 && low < 30;
  if (bucket === "30+") return low >= 30;
  return true;
}

const SORTS = [
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

const selectCls =
  "h-11 w-full cursor-pointer appearance-none rounded-2xl border border-line-strong bg-white bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pl-4 pr-10 text-sm font-semibold text-ink outline-none transition hover:border-ink focus:border-brand bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2346574d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]";

/* ------------------------------------------------------------------ */
/* List-view row                                                        */
/* ------------------------------------------------------------------ */
function VehicleRow({ item }: { item: CatalogItem }) {
  const slug = itemSlug(item);
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const shortlist = useShortlist();
  const { power, torque, battery } = getVehicleCardSpecs(item);
  const inCompare = isInCompare(slug);
  const saved = shortlist.has(slug);
  const label = `${item.brand} ${item.name}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition hover:border-brand/40 hover:shadow-lift sm:flex-row">
      <Link href={`/product/${slug}`} className="relative block aspect-[16/10] shrink-0 overflow-hidden bg-gradient-to-br from-brand-soft to-white sm:aspect-auto sm:w-64">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getVehiclePhoto(item.photo, item)} alt={label} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {item.upcoming && <span className="absolute left-3 top-3 rounded-full bg-sun px-2.5 py-1 text-[11px] font-extrabold text-ink">Coming soon</span>}
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand">{item.brand}</p>
          <Link href={`/product/${slug}`} className="mt-0.5 block truncate text-lg font-extrabold text-ink hover:text-brand">
            {item.name}
          </Link>
          <p className="mt-1 text-xl font-extrabold text-ink">
            {item.pricing || "TBA"}
            {item.baas && <span className="ml-2 rounded bg-sky-soft px-1.5 py-0.5 align-middle font-mono text-[10px] font-bold text-[#0a4a30]">BAAS</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-ink-soft">
            <span>⚡ {power || (item.topSpeed ? `${item.topSpeed} km/h` : "—")}</span>
            <span>⟲ {torque || "—"}</span>
            <span>🔋 {battery || (item.drivingRange ? `${item.drivingRange} km` : "—")}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => shortlist.toggle(slug, label)}
            aria-label={saved ? `Remove ${label} from shortlist` : `Save ${label}`}
            aria-pressed={saved}
            className={cx("grid h-11 w-11 place-items-center rounded-full border transition", saved ? "border-coral bg-coral-soft text-coral" : "border-line-strong bg-white text-ink-soft hover:border-ink")}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => (inCompare ? removeFromCompare(slug) : addToCompare(slug))}
            aria-label={inCompare ? "Remove from comparison" : "Add to comparison"}
            aria-pressed={inCompare}
            className={cx("grid h-11 w-11 place-items-center rounded-full border transition", inCompare ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-ink-soft hover:border-ink")}
          >
            <GitCompare size={18} />
          </button>
          <button onClick={() => triggerEnquiryModal(label)} className={btn("primary", "md")}>
            Enquire <Send size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */
export default function CatalogBrowser({
  items,
  forceUpcoming = false,
  forceNewLaunches = false,
  forceLaunched = false,
  brandRankings = [],
}: {
  items: CatalogItem[];
  /** kept for backwards compatibility — the new UI has no separate coming-soon toggle to hide */
  hideComingSoonToggle?: boolean;
  forceUpcoming?: boolean;
  forceNewLaunches?: boolean;
  forceLaunched?: boolean;
  brandRankings?: BrandRankItem[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [ranks, setRanks] = useState<BrandRankItem[]>(brandRankings || []);
  const [allItems, setAllItems] = useState<CatalogItem[]>(items);
  const [loadingAll, setLoadingAll] = useState(false);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<CatalogCategoryValue>(normalizeCatalogCategory(searchParams.get("type")));
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "all");
  const [price, setPrice] = useState(searchParams.get("price") ?? "all");
  const [usage, setUsage] = useState(searchParams.get("usage") ?? "all");
  const [availability, setAvailability] = useState<"all" | "launched" | "upcoming">(
    searchParams.get("upcoming") === "true" ? "upcoming" : searchParams.get("avail") === "true" ? "launched" : "all",
  );
  const [baasOnly, setBaasOnly] = useState(searchParams.get("baas") === "true");
  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "popular");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [visible, setVisible] = useState(8);
  const sentinel = useRef<HTMLDivElement>(null);

  /* Remember view mode */
  useEffect(() => {
    try {
      const v = localStorage.getItem("evplse_catalog_view");
      if (v === "list" || v === "grid") setView(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const changeView = (v: "grid" | "list") => {
    setView(v);
    try {
      localStorage.setItem("evplse_catalog_view", v);
    } catch {
      /* storage unavailable */
    }
  };

  /* Keep state in sync with URL changes (palette, header links, back/forward) */
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setCategory(normalizeCatalogCategory(searchParams.get("type")));
    setBrand(searchParams.get("brand") ?? "all");
    setPrice(searchParams.get("price") ?? "all");
    setUsage(searchParams.get("usage") ?? "all");
    setAvailability(searchParams.get("upcoming") === "true" ? "upcoming" : searchParams.get("avail") === "true" ? "launched" : "all");
    setBaasOnly(searchParams.get("baas") === "true");
    setSort((searchParams.get("sort") as SortKey) || "popular");
  }, [searchParams]);

  /* Data: pages pass the full set; fall back to the API if they passed nothing */
  useEffect(() => {
    if (items.length) setAllItems(items);
  }, [items]);
  useEffect(() => {
    if (allItems.length || loadingAll) return;
    setLoadingAll(true);
    fetch("/api/catalog-all")
      .then((r) => r.json())
      .then((d) => d.items?.length && setAllItems(d.items))
      .catch(() => {})
      .finally(() => setLoadingAll(false));
  }, [allItems.length, loadingAll]);

  useEffect(() => {
    if (brandRankings?.length) return setRanks(brandRankings);
    fetch("/api/brand-rankings")
      .then((r) => r.json())
      .then((d) => Array.isArray(d.rankings) && d.rankings.length && setRanks(d.rankings))
      .catch(() => {});
  }, [brandRankings]);

  /* URL writer */
  const update = useCallback(
    (u: Record<string, string | boolean | null>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(u)) {
        if (v === null || v === "all" || v === "" || v === false || (k === "sort" && v === "popular")) params.delete(k);
        else params.set(k, String(v));
      }
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname],
  );

  const setCat = (v: string) => {
    setCategory(normalizeCatalogCategory(v));
    update({ type: v });
  };
  const setAvail = (v: "all" | "launched" | "upcoming") => {
    setAvailability(v);
    update({ avail: v === "launched", upcoming: v === "upcoming" });
  };

  const brandOptions = useMemo(() => {
    const raw = [...new Set(allItems.map((i) => i.brand).filter(Boolean))];
    return sortBrandsByRank(raw, category, ranks);
  }, [allItems, category, ranks]);

  const priceOptions = useMemo(() => {
    if (price !== "all" && !PRICE_PRESETS.some((p) => p.value === price) && price.startsWith("max-")) {
      return [...PRICE_PRESETS, { value: price, label: `Under ₹${price.slice(4)} lakh` }];
    }
    return PRICE_PRESETS;
  }, [price]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const twoMonthsAgo = now - 1000 * 60 * 60 * 24 * 62;
    const matched = allItems.filter((it) => {
      if (!matchesSearchQuery(it, query)) return false;
      if (!matchesCatalogCategory(it as any, category)) return false;
      if (brand !== "all" && it.brand.toLowerCase() !== brand.toLowerCase()) return false;
      if (!matchesPrice(it, price)) return false;
      if (usage !== "all" && it.usageType !== usage) return false;
      if (baasOnly && !it.baas) return false;

      if (forceUpcoming) return !!it.upcoming;
      if (forceLaunched) return !it.upcoming;
      if (forceNewLaunches) return !it.upcoming && (it.launchTs ?? 0) >= twoMonthsAgo && (it.launchTs ?? 0) <= now;
      if (availability === "launched" && it.upcoming) return false;
      if (availability === "upcoming" && !it.upcoming) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":
        return [...matched].sort((a, b) => (priceLowLakh(a) || Infinity) - (priceLowLakh(b) || Infinity));
      case "price-desc":
        return [...matched].sort((a, b) => priceLowLakh(b) - priceLowLakh(a));
      case "newest":
        return [...matched].sort((a, b) => (b.launchTs ?? 0) - (a.launchTs ?? 0));
      case "name":
        return [...matched].sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
      default:
        return sortVehiclesByBrandRank(matched, category, ranks);
    }
  }, [allItems, query, category, brand, price, usage, baasOnly, availability, sort, forceUpcoming, forceLaunched, forceNewLaunches, ranks]);

  /* Reset paging when filters change */
  const filterKey = [query, category, brand, price, usage, baasOnly, availability, sort].join("|");
  useEffect(() => setVisible(8), [filterKey]);

  /* Infinite scroll — lazyload 8 items at a time */
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setVisible((v) => v + 8), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, visible]);

  const chips: Array<{ label: string; clear: () => void }> = [];
  if (query.trim()) chips.push({ label: `“${query.trim()}”`, clear: () => (setQuery(""), update({ q: null })) });
  if (category !== "all") chips.push({ label: CATALOG_CATEGORIES.find((c) => c.value === category)?.label ?? category, clear: () => setCat("all") });
  if (brand !== "all") chips.push({ label: brand, clear: () => (setBrand("all"), update({ brand: null })) });
  if (price !== "all") chips.push({ label: priceOptions.find((p) => p.value === price)?.label ?? price, clear: () => (setPrice("all"), update({ price: null })) });
  if (usage !== "all") chips.push({ label: usage, clear: () => (setUsage("all"), update({ usage: null })) });
  if (availability !== "all" && !forceUpcoming && !forceLaunched && !forceNewLaunches) chips.push({ label: availability === "upcoming" ? "Coming soon" : "Available now", clear: () => setAvail("all") });
  if (baasOnly) chips.push({ label: "BaaS", clear: () => (setBaasOnly(false), update({ baas: null })) });

  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setBrand("all");
    setPrice("all");
    setUsage("all");
    setAvailability("all");
    setBaasOnly(false);
    window.history.replaceState(null, "", pathname);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "EVPLSE catalog", text: "Check out these electric vehicles on EVPLSE", url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  const filterFields = (
    <>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">Brand</span>
        <select className={selectCls} value={brand} onChange={(e) => (setBrand(e.target.value), update({ brand: e.target.value }))}>
          <option value="all">All brands</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">Budget</span>
        <select className={selectCls} value={price} onChange={(e) => (setPrice(e.target.value), update({ price: e.target.value }))}>
          {priceOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">Usage</span>
        <select className={selectCls} value={usage} onChange={(e) => (setUsage(e.target.value), update({ usage: e.target.value }))}>
          <option value="all">All usage</option>
          <option value="Passenger">Passenger</option>
          <option value="Goods">Goods</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">Sort by</span>
        <select className={selectCls} value={sort} onChange={(e) => (setSort(e.target.value as SortKey), update({ sort: e.target.value }))}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );

  const lockedAvail = forceUpcoming || forceLaunched || forceNewLaunches;

  return (
    <div>
      {/* Sticky control bar */}
      <div className="sticky top-[calc(var(--header-h)+6px)] z-30 -mx-1 rounded-3xl border border-line bg-white/90 p-3 shadow-card backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {CATALOG_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCat(c.value)}
                className={cx(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition",
                  category === c.value ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-soft hover:border-ink hover:text-ink",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line-strong bg-white px-4 focus-within:border-brand">
              <Search size={17} className="shrink-0 text-ink-mute" />
              <input
                value={query}
                onChange={(e) => (setQuery(e.target.value), update({ q: e.target.value }))}
                placeholder="Search model, brand or type…"
                aria-label="Search catalog"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-mute"
              />
              {query && (
                <button onClick={() => (setQuery(""), update({ q: null }))} aria-label="Clear search" className="text-ink-mute hover:text-ink">
                  <X size={16} />
                </button>
              )}
            </div>

            <button onClick={() => setSheetOpen(true)} className={btn("outline", "md", "relative lg:hidden")} aria-label="Open filters">
              <SlidersHorizontal size={16} /> Filters
              {chips.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] text-white">{chips.length}</span>}
            </button>

            <div className="hidden rounded-2xl border border-line-strong bg-white p-1 sm:flex" role="group" aria-label="View mode">
              {([
                ["grid", LayoutGrid],
                ["list", List],
              ] as const).map(([k, Icon]) => (
                <button
                  key={k}
                  onClick={() => changeView(k)}
                  aria-label={`${k} view`}
                  aria-pressed={view === k}
                  className={cx("grid h-9 w-9 place-items-center rounded-xl transition", view === k ? "bg-ink text-white" : "text-ink-soft hover:bg-ink/5")}
                >
                  <Icon size={17} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop inline filters */}
        <div className="mt-3 hidden grid-cols-4 gap-3 border-t border-line pt-3 lg:grid">{filterFields}</div>
      </div>

      {/* Toolbar: count, availability, chips, share */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="text-sm font-bold text-ink">
          <span className="text-brand">{filtered.length}</span> of {allItems.length} vehicles
        </p>

        {!lockedAvail && (
          <div className="flex gap-1.5">
            {([
              ["all", "All"],
              ["launched", "Available now"],
              ["upcoming", "Coming soon"],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setAvail(k)}
                className={cx("rounded-full px-3.5 py-1.5 text-xs font-bold transition", availability === k ? "bg-brand text-white" : "bg-ink/5 text-ink-soft hover:bg-ink/10")}
              >
                {l}
              </button>
            ))}
            <button
              onClick={() => (setBaasOnly(!baasOnly), update({ baas: !baasOnly }))}
              aria-pressed={baasOnly}
              className={cx("rounded-full px-3.5 py-1.5 text-xs font-bold transition", baasOnly ? "bg-sky text-white" : "bg-ink/5 text-ink-soft hover:bg-ink/10")}
            >
              BaaS
            </button>
          </div>
        )}

        <button onClick={share} className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-brand">
          {shared ? <Check size={15} className="text-brand" /> : <Share2 size={15} />} {shared ? "Link copied" : "Share"}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1.5 pl-3.5 pr-2.5 text-xs font-bold text-brand-deep hover:bg-emerald-100">
              {c.label} <X size={13} />
            </button>
          ))}
          <button onClick={clearAll} className="px-2 text-xs font-bold text-coral hover:underline">
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {loadingAll || (allItems.length === 0 && !items.length && loadingAll) ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-[420px] rounded-3xl" />
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <EmptyState title="Couldn’t load listings" text="Please refresh the page in a moment." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matches found" text="Try loosening a filter or searching for a different model." action={<button onClick={clearAll} className={btn("primary", "md", "mt-6")}>Clear filters</button>} />
        ) : view === "list" ? (
          <div className="flex flex-col gap-4">
            {filtered.slice(0, visible).map((it) => (
              <VehicleRow key={itemSlug(it)} item={it} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.slice(0, visible).map((it, i) => (
              <VehicleCard key={itemSlug(it)} item={it} priority={i < 4} />
            ))}
          </div>
        )}
        {visible < filtered.length && <div ref={sentinel} className="h-10" />}
        {filtered.length > 0 && visible >= filtered.length && (
          <p className="mt-10 text-center text-sm font-semibold text-ink-mute">
            You&apos;ve seen all {filtered.length} vehicles ·{" "}
            <button onClick={() => triggerEnquiryModal("Catalog – can't find my EV")} className="text-brand hover:underline">
              Can&apos;t find yours? Ask our experts <ArrowRight size={13} className="inline" />
            </button>
          </p>
        )}
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetOpen(false)} className="fixed inset-0 z-[120] bg-ink/40 backdrop-blur-sm" />
            <motion.div
              role="dialog"
              aria-label="Filters"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[121] max-h-[88vh] overflow-y-auto rounded-t-[2rem] bg-white p-5 pb-8 shadow-lift"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-ink">Filters</h3>
                <button onClick={() => setSheetOpen(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-full bg-ink/5">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-4">{filterFields}</div>
              <div className="mt-6 flex gap-3">
                <button onClick={clearAll} className={btn("outline", "lg", "flex-1")}>
                  Reset
                </button>
                <button onClick={() => setSheetOpen(false)} className={btn("primary", "lg", "flex-[2]")}>
                  Show {filtered.length} results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-dashed border-line-strong bg-white p-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Zap size={26} />
      </span>
      <h3 className="mt-5 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-ink-soft">{text}</p>
      {action}
    </div>
  );
}
