"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, GitCompare, Heart, Share2, Trash2 } from "lucide-react";
import VehicleCard from "../components/VehicleCard";
import { btn, Container, PageHero } from "../components/ui/kit";
import { useShortlist } from "../context/ShortlistContext";
import { useCompare } from "../context/CompareContext";
import { triggerEnquiryModal } from "../components/EnquiryModal";
import { itemSlug } from "../lib/format";
import { toast } from "../lib/toast";
import type { CatalogItem } from "../lib/catalog-types";

export default function ShortlistClient() {
  const { slugs, clear } = useShortlist();
  const { addToCompare, clearCompare } = useCompare();
  const [all, setAll] = useState<CatalogItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/catalog-all")
      .then((r) => r.json())
      .then((d) => live && setAll(d.items || []))
      .catch(() => live && (setFailed(true), setAll([])));
    return () => {
      live = false;
    };
  }, []);

  const items = useMemo(() => {
    if (!all) return [];
    const map = new Map(all.map((i) => [itemSlug(i), i]));
    return slugs.map((s) => map.get(s)).filter(Boolean) as CatalogItem[];
  }, [all, slugs]);

  const compareAll = () => {
    clearCompare();
    items.slice(0, 4).forEach((i) => addToCompare(itemSlug(i)));
    window.location.href = "/compare";
  };

  const share = async () => {
    const url = `${window.location.origin}/catalog?q=${encodeURIComponent(items.map((i) => `${i.brand} ${i.name}`).join(", "))}`;
    try {
      if (navigator.share) await navigator.share({ title: "My EVPLSE shortlist", text: items.map((i) => `${i.brand} ${i.name}`).join(", "), url });
      else {
        await navigator.clipboard.writeText(`My EV shortlist: ${items.map((i) => `${i.brand} ${i.name}`).join(", ")} — ${url}`);
        toast("Shortlist copied to clipboard", "success");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <>
      <PageHero eyebrow="Saved" title="My shortlist" description="The EVs you've saved. Compare them side by side, or let our experts get you the best offer on all of them.">
        {items.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {items.length > 1 && (
              <button onClick={compareAll} className={btn("primary", "md")}>
                <GitCompare size={17} /> Compare {Math.min(items.length, 4)}
              </button>
            )}
            <button onClick={() => triggerEnquiryModal(`Shortlist: ${items.map((i) => `${i.brand} ${i.name}`).join(", ")}`)} className={btn("ink", "md")}>
              Get best offer <ArrowRight size={16} />
            </button>
            <button onClick={share} className={btn("outline", "md")}>
              <Share2 size={16} /> Share
            </button>
            <button onClick={clear} className={btn("ghost", "md", "text-coral hover:bg-coral-soft")}>
              <Trash2 size={16} /> Clear all
            </button>
          </div>
        )}
      </PageHero>

      <Container className="py-10 sm:py-14">
        {all === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: Math.max(slugs.length, 4) }).map((_, i) => (
              <div key={i} className="skeleton h-[420px] rounded-3xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-line-strong bg-white p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-coral-soft text-coral">
              <Heart size={26} />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-ink">{failed ? "Couldn't load vehicles" : "Nothing saved yet"}</h2>
            <p className="mt-2 text-ink-soft">{failed ? "Please refresh in a moment." : "Tap the heart on any vehicle to keep it here for later."}</p>
            <Link href="/catalog" className={btn("primary", "md", "mt-6")}>
              Browse EVs <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <VehicleCard key={itemSlug(it)} item={it} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
