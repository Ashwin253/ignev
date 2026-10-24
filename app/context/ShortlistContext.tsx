"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "../lib/toast";

const KEY = "evplse_shortlist";

interface ShortlistContextType {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string, label?: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setSlugs(arr.filter((s) => typeof s === "string"));
    } catch {
      /* ignore */
    }
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
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch { /* ignore */ }
  }, [slugs, loaded]);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug: string, label?: string) => {
    setSlugs((prev) => {
      if (prev.includes(slug)) {
        toast(`${label ?? "Vehicle"} removed from shortlist`, "info");
        return prev.filter((s) => s !== slug);
      }
      toast(`${label ?? "Vehicle"} saved to your shortlist`, "success");
      return [slug, ...prev];
    });
  }, []);

  const remove = useCallback((slug: string) => setSlugs((p) => p.filter((s) => s !== slug)), []);
  const clear = useCallback(() => setSlugs([]), []);

  const value = useMemo(() => ({ slugs, has, toggle, remove, clear }), [slugs, has, toggle, remove, clear]);
  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlist(): ShortlistContextType {
  const ctx = useContext(ShortlistContext);
  if (!ctx) {
    return { slugs: [], has: () => false, toggle: () => {}, remove: () => {}, clear: () => {} };
  }
  return ctx;
}
