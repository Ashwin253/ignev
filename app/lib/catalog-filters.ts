export const CATALOG_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "2 Wheeler", label: "2-Wheeler" },
  { value: "3 Wheeler", label: "3-Wheeler" },
  { value: "Electric Car", label: "4-Wheelers" },
] as const;

export type CatalogCategoryValue = (typeof CATALOG_CATEGORIES)[number]["value"];

const TWO_WHEELER_TYPES = new Set(["Electric Scooter", "Electric Motorcycle"]);
const THREE_WHEELER_TYPES = new Set(["Electric Auto", "Electric Cargo Auto"]);

/** Map any type query param to a canonical catalog category value. */
export function normalizeCatalogCategory(raw: string | null | undefined): CatalogCategoryValue {
  if (!raw || raw === "all") return "all";

  const normalized = raw.toLowerCase().replace(/\+/g, " ").trim();

  if (
    normalized === "2-wheeler" ||
    normalized === "2 wheeler" ||
    normalized === "electric scooter" ||
    normalized === "electric motorcycle"
  ) {
    return "2 Wheeler";
  }

  if (
    normalized === "3-wheeler" ||
    normalized === "3 wheeler" ||
    normalized === "electric auto" ||
    normalized === "electric cargo auto"
  ) {
    return "3 Wheeler";
  }

  if (
    normalized === "electric car" ||
    normalized === "cars" ||
    normalized === "car" ||
    normalized === "4 wheeler" ||
    normalized === "4-wheeler" ||
    normalized === "4 wheelers" ||
    normalized === "4-wheelers" ||
    normalized === "4w"
  ) {
    return "Electric Car";
  }

  const exact = CATALOG_CATEGORIES.find((c) => c.value.toLowerCase() === normalized);
  return exact?.value ?? "all";
}

export function matchesCatalogCategory(itemType: string, category: CatalogCategoryValue): boolean {
  if (category === "all") return true;
  if (category === "2 Wheeler") {
    return itemType === "2 Wheeler" || TWO_WHEELER_TYPES.has(itemType);
  }
  if (category === "3 Wheeler") {
    return itemType === "3 Wheeler" || THREE_WHEELER_TYPES.has(itemType);
  }
  if (category === "Electric Car") {
    return (
      itemType === "Electric Car" ||
      itemType === "4 Wheeler" ||
      itemType === "4-Wheeler" ||
      itemType === "4 Wheelers" ||
      itemType === "4-Wheelers"
    );
  }
  return itemType === category;
}

export function catalogFilterUrl(filters: {
  type?: string | null;
  brand?: string | null;
  comm?: boolean;
  q?: string | null;
}): string {
  const params = new URLSearchParams();

  if (filters.type && filters.type !== "all") {
    params.set("type", normalizeCatalogCategory(filters.type));
  }
  if (filters.brand && filters.brand !== "all") {
    params.set("brand", filters.brand);
  }
  if (filters.comm) {
    params.set("comm", "true");
  }
  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}