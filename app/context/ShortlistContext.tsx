"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "../lib/toast";
import type { CatalogItem } from "../lib/catalog-types";

const KEY = "evplse_shortlist";
const SNAPSHOT_KEY = "evplse_shortlist_snapshots";

interface ShortlistContextType {
  slugs: string[];
  snapshots: Record<string, CatalogItem>;
  has: (slug: string) => boolean;
  toggle: (slug: string, label?: string, snapshot?: CatalogItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, CatalogItem>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setSlugs(arr.filter((s) => typeof s === "string"));
    } catch {
      /* ignore */
    }
    try {
      const rawSnapshots = localStorage.getItem(SNAPSHOT_KEY);
      const parsedSnapshots = rawSnapshots ? JSON.parse(rawSnapshots) : {};
      if (parsedSnapshots && typeof parsedSnapshots === "object" && !Array.isArray(parsedSnapshots)) setSnapshots(parsedSnapshots);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        const arr = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(arr)) setSlugs(arr);
      } catch { /* ignore */ }
    };
    const onSnapshotStorage = (e: StorageEvent) => {
      if (e.key !== SNAPSHOT_KEY) return;
      try { setSnapshots(e.newValue ? JSON.parse(e.newValue) : {}); } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("storage", onSnapshotStorage);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("storage", onSnapshotStorage); };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch { /* ignore */ }
  }, [slugs, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots)); } catch { /* ignore */ }
  }, [snapshots, loaded]);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug: string, label?: string, snapshot?: CatalogItem) => {
    setSlugs((prev) => {
      if (prev.includes(slug)) {
        setSnapshots((current) => { const next = { ...current }; delete next[slug]; return next; });
        toast(`${label ?? "Vehicle"} removed from shortlist`, "info");
        return prev.filter((s) => s !== slug);
      }
      if (snapshot) setSnapshots((current) => ({ ...current, [slug]: snapshot }));
      toast(`${label ?? "Vehicle"} saved to your shortlist`, "success");
      return [slug, ...prev];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setSlugs((p) => p.filter((s) => s !== slug));
    setSnapshots((current) => { const next = { ...current }; delete next[slug]; return next; });
  }, []);
  const clear = useCallback(() => { setSlugs([]); setSnapshots({}); }, []);

  const value = useMemo(() => ({ slugs, snapshots, has, toggle, remove, clear }), [slugs, snapshots, has, toggle, remove, clear]);
  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlist(): ShortlistContextType {
  const ctx = useContext(ShortlistContext);
  if (!ctx) {
    return { slugs: [], snapshots: {}, has: () => false, toggle: () => {}, remove: () => {}, clear: () => {} };
  }
  return ctx;
}
