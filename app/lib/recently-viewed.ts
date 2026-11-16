import type { CatalogItem } from "./catalog-types";

const KEY = "evplse_recent";
const MAX = 12;

type RecentEntry = { slug: string; snapshot?: CatalogItem };

function readEntries(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry: string | RecentEntry) => typeof entry === "string" ? { slug: entry } : entry)
      .filter((entry: RecentEntry) => entry && typeof entry.slug === "string");
  } catch {
    return [];
  }
}

export function getRecentlyViewed(): string[] {
  return readEntries().map((entry) => entry.slug);
}

export function getRecentlyViewedSnapshots(): CatalogItem[] {
  return readEntries().flatMap((entry) => entry.snapshot ? [entry.snapshot] : []);
}

export function pushRecentlyViewed(slug: string, snapshot?: CatalogItem) {
  if (typeof window === "undefined" || !slug) return;
  try {
    const entries = readEntries();
    const previous = entries.find((entry) => entry.slug === slug);
    const next = [{ slug, snapshot: snapshot || previous?.snapshot }, ...entries.filter((entry) => entry.slug !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
