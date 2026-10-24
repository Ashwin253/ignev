"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { PALETTE_PAGES } from "../lib/nav";
import type { CatalogItem } from "../lib/catalog-types";
import { getVehiclePhoto } from "../lib/vehicle-images";
import { itemSlug } from "../lib/format";

type Row =
  | { kind: "vehicle"; key: string; item: CatalogItem; href: string }
  | { kind: "page"; key: string; label: string; desc?: string; href: string; Icon?: any }
  | { kind: "search"; key: string; label: string; href: string };

function score(hay: string, q: string) {
  if (!q) return 0;
  const h = hay.toLowerCase();
  if (h === q) return 100;
  if (h.startsWith(q)) return 60;
  if (h.includes(q)) return 40;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => h.includes(w))) return 30;
  return 0;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setActive(0);
  }, []);

  // Open via ⌘K / Ctrl+K, "/" or custom event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement | null)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  // Lazy-load the catalog the first time the palette opens
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
    document.body.style.overflow = "hidden";
    if (items === null) {
      fetch("/api/catalog-all")
        .then((r) => r.json())
        .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
        .catch(() => setItems([]));
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, items]);

  const rows: Row[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    const out: Row[] = [];
    if (!query) {
      PALETTE_PAGES.slice(0, 8).forEach((p) => out.push({ kind: "page", key: p.href + p.label, label: p.label, desc: p.desc, href: p.href, Icon: p.icon }));
      return out;
    }
    const vehicles = (items || [])
      .map((it) => ({ it, s: Math.max(score(`${it.brand} ${it.name}`, query), score(it.name, query), score(it.brand, query) - 10, score(it.type || "", query) - 25) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6);
    vehicles.forEach(({ it }) => out.push({ kind: "vehicle", key: "v-" + itemSlug(it), item: it, href: `/product/${itemSlug(it)}` }));
    PALETTE_PAGES.map((p) => ({ p, s: Math.max(score(p.label, query), score(p.desc || "", query) - 10) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .forEach(({ p }) => out.push({ kind: "page", key: "p-" + p.href + p.label, label: p.label, desc: p.desc, href: p.href, Icon: p.icon }));
    out.push({ kind: "search", key: "search", label: `Search the catalog for “${q.trim()}”`, href: `/catalog?q=${encodeURIComponent(q.trim())}` });
    return out;
  }, [q, items]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (r: Row | undefined) => {
    if (!r) return;
    close();
    router.push(r.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(rows[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[500] flex items-start justify-center px-3 pt-[10vh] sm:pt-[14vh]" role="dialog" aria-modal="true" aria-label="Search">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-white shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search size={18} className="shrink-0 text-ink-mute" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search EVs, brands, tools, pages…"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-mute"
                aria-label="Search"
                autoComplete="off"
              />
              <button onClick={close} aria-label="Close search" className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink-soft hover:bg-line">
                <X size={15} />
              </button>
            </div>

            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
              {!q.trim() && <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-mute">Quick links</p>}
              {q.trim() && items === null && <p className="px-3 py-6 text-center text-sm text-ink-mute">Loading vehicles…</p>}
              {rows.map((r, i) => (
                <button
                  key={r.key}
                  data-idx={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${i === active ? "bg-brand-soft" : "hover:bg-paper"}`}
                >
                  {r.kind === "vehicle" ? (
                    <>
                      <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-xl bg-paper">
                        <Image src={getVehiclePhoto(r.item.photo, r.item)} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">{r.item.brand} {r.item.name}</span>
                        <span className="block truncate text-xs text-ink-mute">{r.item.type || "Electric vehicle"}</span>
                      </span>
                      <span className="shrink-0 text-sm font-extrabold text-brand-deep">{r.item.pricing || "TBA"}</span>
                    </>
                  ) : r.kind === "page" ? (
                    <>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-brand">
                        {r.Icon ? <r.Icon size={18} /> : <ArrowRight size={18} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">{r.label}</span>
                        {r.desc && <span className="block truncate text-xs text-ink-mute">{r.desc}</span>}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">
                        <Search size={17} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{r.label}</span>
                    </>
                  )}
                  {i === active && <CornerDownLeft size={14} className="hidden shrink-0 text-ink-mute sm:block" />}
                </button>
              ))}
            </div>

            <div className="hidden items-center justify-between border-t border-line bg-paper px-4 py-2.5 text-[11px] font-semibold text-ink-mute sm:flex">
              <span>↑ ↓ to navigate · Enter to open · Esc to close</span>
              <span>Press <kbd className="rounded border border-line-strong bg-white px-1.5 py-0.5 font-mono">/</kbd> anywhere to search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
