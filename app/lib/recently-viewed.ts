const KEY = "evplse_recent";
const MAX = 12;

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  try {
    const next = [slug, ...getRecentlyViewed().filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
