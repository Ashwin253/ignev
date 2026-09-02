export type BrandRankItem = {
  id?: string;
  brand: string;
  category: string; // "scooter" | "bike" | "cars" | "commercial" | "all"
  rank: number;
  is_active?: boolean;
};

// Canonical normalization for brand matching
export function normalizeBrand(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.trim().toUpperCase();
  if (cleaned === "OLA ELECTRIC") return "OLA";
  if (cleaned === "ATHER ENERGY") return "ATHER";
  if (cleaned === "TVS MOTOR" || cleaned === "TVS MOTORS") return "TVS";
  if (cleaned === "BAJAJ AUTO") return "BAJAJ";
  if (cleaned === "HERO VIDA") return "VIDA";
  if (cleaned === "SIMPLE ENERGY") return "SIMPLE";
  if (cleaned === "TATA") return "TATA MOTORS";
  if (cleaned === "EULER") return "EULER MOTORS";
  if (cleaned === "ULTRAVIOLET") return "ULTRAVIOLETTE";
  if (cleaned === "MARUTI") return "MARUTI SUZUKI";
  if (cleaned === "ASHOK") return "ASHOK LEYLAND";
  return cleaned;
}

// Built-in default rankings (matches user requested order for scooter, bike, cars, and commercial)
export const DEFAULT_BRAND_RANKS: BrandRankItem[] = [
  // ── Scooter Rankings ──
  { brand: "OLA", category: "scooter", rank: 1 },
  { brand: "ATHER", category: "scooter", rank: 2 },
  { brand: "TVS", category: "scooter", rank: 3 },
  { brand: "BAJAJ", category: "scooter", rank: 4 },
  { brand: "HONDA", category: "scooter", rank: 5 },
  { brand: "RIVER", category: "scooter", rank: 6 },
  { brand: "VIDA", category: "scooter", rank: 7 },
  { brand: "SIMPLE", category: "scooter", rank: 8 },
  { brand: "MATTER", category: "scooter", rank: 9 },

  // ── Bike Rankings ──
  { brand: "ULTRAVIOLETTE", category: "bike", rank: 1 },
  { brand: "ROYAL ENFIELD", category: "bike", rank: 2 },
  { brand: "REVOLT", category: "bike", rank: 3 },
  { brand: "OLA", category: "bike", rank: 4 },
  { brand: "MATTER", category: "bike", rank: 5 },
  { brand: "TORK", category: "bike", rank: 6 },
  { brand: "OBEN", category: "bike", rank: 7 },

  // ── Cars Rankings ──
  { brand: "TATA MOTORS", category: "cars", rank: 1 },
  { brand: "MAHINDRA", category: "cars", rank: 2 },
  { brand: "MG", category: "cars", rank: 3 },
  { brand: "MARUTI SUZUKI", category: "cars", rank: 4 },
  { brand: "KIA", category: "cars", rank: 5 },
  { brand: "BYD", category: "cars", rank: 6 },
  { brand: "HYUNDAI", category: "cars", rank: 7 },
  { brand: "VINFAST", category: "cars", rank: 8 },

  // ── Commercial Rankings ──
  { brand: "EULER MOTORS", category: "commercial", rank: 1 },
  { brand: "TATA MOTORS", category: "commercial", rank: 2 },
  { brand: "MAHINDRA", category: "commercial", rank: 3 },
  { brand: "ASHOK LEYLAND", category: "commercial", rank: 4 },
  { brand: "MONTRA", category: "commercial", rank: 5 },
  { brand: "PIAGGIO", category: "commercial", rank: 6 },
  { brand: "ALTIGREEN", category: "commercial", rank: 7 },
];

/**
 * Returns the rank integer for a given brand and category.
 * Lower number = higher priority. Unranked brands receive 999.
 */
export function getBrandRank(
  brand: string | null | undefined,
  category?: string,
  customRanks?: BrandRankItem[]
): number {
  if (!brand) return 999;
  const target = normalizeBrand(brand);
  const ranksList = customRanks && customRanks.length > 0 ? customRanks : DEFAULT_BRAND_RANKS;

  // 1. Try category-specific rank
  if (category && category !== "all") {
    const catMatch = ranksList.find(
      (r) => r.category.toLowerCase() === category.toLowerCase() && normalizeBrand(r.brand) === target
    );
    if (catMatch && catMatch.is_active !== false) {
      return catMatch.rank;
    }
  }

  // 2. Try global/all category rank
  const globalMatch = ranksList.find(
    (r) => r.category.toLowerCase() === "all" && normalizeBrand(r.brand) === target
  );
  if (globalMatch && globalMatch.is_active !== false) {
    return globalMatch.rank;
  }

  // 3. Fallback: find lowest rank matching brand in any category
  const anyMatch = ranksList
    .filter((r) => normalizeBrand(r.brand) === target && r.is_active !== false)
    .sort((a, b) => a.rank - b.rank)[0];

  return anyMatch ? anyMatch.rank : 999;
}

/**
 * Sorts an array of items by their brand ranking for a given category.
 * Ranked brands come first (ordered by rank ASC).
 * Unranked brands come after (ordered alphabetically by brand).
 */
export function sortVehiclesByBrandRank<T extends { brand?: string; title?: string; name?: string }>(
  items: T[],
  category?: string,
  customRanks?: BrandRankItem[]
): T[] {
  return [...items].sort((a, b) => {
    const rankA = getBrandRank(a.brand, category, customRanks);
    const rankB = getBrandRank(b.brand, category, customRanks);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Secondary sort: Brand alphabetical
    const brandA = (a.brand || "").toLowerCase();
    const brandB = (b.brand || "").toLowerCase();
    if (brandA !== brandB) {
      return brandA.localeCompare(brandB);
    }

    // Tertiary sort: Vehicle name
    const nameA = (a.title || a.name || "").toLowerCase();
    const nameB = (b.title || b.name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sorts brand name strings so ranked brands appear first in dropdowns.
 */
export function sortBrandsByRank(
  brands: string[],
  category?: string,
  customRanks?: BrandRankItem[]
): string[] {
  const allOption = brands.includes("all");
  const filtered = brands.filter((b) => b !== "all");

  filtered.sort((a, b) => {
    const rankA = getBrandRank(a, category, customRanks);
    const rankB = getBrandRank(b, category, customRanks);

    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.localeCompare(b);
  });

  return allOption ? ["all", ...filtered] : filtered;
}
