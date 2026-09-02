import { isTwoWheeler } from "./vehicle-images";

export const VEHICLE_CATEGORIES = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "cars", label: "Cars" },
  { value: "commercial", label: "Commercial" },
] as const;

export type VehicleCategoryValue = (typeof VEHICLE_CATEGORIES)[number]["value"];
export type CatalogCategoryValue = VehicleCategoryValue;
export const CATALOG_CATEGORIES = VEHICLE_CATEGORIES;

export type VehicleLike = {
  title?: string;
  name?: string;
  brand?: string;
  type?: string;
  types?: string[];
  body_type?: string;
  bodyType?: string;
  commercial?: boolean;
  usage_type?: string | null;
  usageType?: string | null;
};

export function isCommercialListing(l: VehicleLike): boolean {
  if (l.commercial === true) return true;
  const usage = (l.usage_type || l.usageType || "").toLowerCase();
  if (usage.includes("commercial") || usage.includes("goods")) return true;

  const titleLower = (l.title || l.name || "").toLowerCase();
  const brandLower = (l.brand || "").toLowerCase();
  const typeLower = (Array.isArray(l.types) ? l.types.join(" ") : String(l.type || "")).toLowerCase();
  const bodyType = (l.body_type || l.bodyType || "").toLowerCase();

  const commercialKeywords = [
    "cargo", "loader", "tempo", "truck", "commercial", "delivery",
    "tipper", "carrier", "rickshaw", "auto", "3-wheeler", "3 wheeler", "3w", "fleet"
  ];
  if (commercialKeywords.some((k) => typeLower.includes(k) || bodyType.includes(k) || titleLower.includes(k))) {
    return true;
  }

  const commercialBrands = [
    "euler", "grevol", "altigreen", "piaggio", "zen mobility", "zen",
    "loadking", "rage", "omega seiki", "osm", "montra",
    "switch mobility", "ve commercial", "eicher", "olectra", "jbm"
  ];
  if (commercialBrands.some((b) => brandLower.includes(b) || titleLower.includes(b))) {
    return true;
  }

  return false;
}

export function isElectricBikeListing(l: VehicleLike): boolean {
  // Commercial vehicles are excluded
  if (isCommercialListing(l)) return false;

  const titleLower = (l.title || l.name || "").toLowerCase();
  const brandLower = (l.brand || "").toLowerCase();
  const typeLower = (Array.isArray(l.types) ? l.types.join(" ") : String(l.type || "")).toLowerCase();
  const bodyType = (l.body_type || l.bodyType || "").toLowerCase();

  // Core detail: body_type === "bike"
  if (bodyType === "bike" || bodyType === "motorcycle") {
    return true;
  }

  // Explicit motorcycle / bike keywords in type / bodyType
  const bikeTypeKeywords = [
    "motorcycle", "motor cycle", "sports bike", "cruiser", "dirt bike",
    "commuter bike", "cafe racer", "electric motorcycle", "superbike"
  ];
  if (bikeTypeKeywords.some((k) => typeLower.includes(k) || bodyType.includes(k))) {
    return true;
  }

  // Known electric motorcycle brands
  const bikeBrands = [
    "revolt", "ultraviolette", "matter", "tork", "oben",
    "hop electric", "kabira", "orxa", "raptee", "emflux", "svitch", "cyborg"
  ];
  if (bikeBrands.some((b) => brandLower === b || brandLower.includes(b))) {
    return true;
  }

  // Known electric bike models
  const bikeModels = [
    "rv400", "rv300", "rv1", "f77", "f99", "kratos", "rorr", "aera",
    "mantis", "t30", "km3000", "km4000", "km5000", "etryst", "ecodryft",
    "ranger", "csr762", "yoda", "bob-e", "oxo", "ox-o", "beast",
    "thunderbolt", "hurricane", "monster"
  ];
  if (bikeModels.some((k) => titleLower.includes(k))) {
    return true;
  }

  // Check standalone "bike" in title if not an obvious scooter brand
  const titleWords = titleLower.split(/[\s-]+/);
  if (
    titleWords.includes("bike") &&
    !["scooter", "scooty", "ather", "ola", "chetak", "rizta", "iqube", "vida", "river"].some((s) => titleLower.includes(s))
  ) {
    return true;
  }

  return false;
}

export function isElectricScooterListing(l: VehicleLike): boolean {
  // Commercial vehicles are excluded
  if (isCommercialListing(l)) return false;
  // If it's a bike, it cannot be a scooter
  if (isElectricBikeListing(l)) return false;

  const typeLower = (Array.isArray(l.types) ? l.types.join(" ") : String(l.type || "")).toLowerCase();
  const bodyType = (l.body_type || l.bodyType || "").toLowerCase();

  // Core detail: body_type === "scooter" or "scooty"
  if (bodyType.includes("scooter") || bodyType.includes("scooty")) {
    return true;
  }

  const is2W =
    (typeof isTwoWheeler === "function" && isTwoWheeler(l)) ||
    typeLower.includes("2") ||
    typeLower.includes("scooter") ||
    typeLower.includes("moped");

  return is2W;
}

export function isElectricCarListing(l: VehicleLike): boolean {
  // Commercial, Bike, Scooter are excluded
  if (isCommercialListing(l)) return false;
  if (isElectricBikeListing(l)) return false;
  if (isElectricScooterListing(l)) return false;
  if (typeof isTwoWheeler === "function" && isTwoWheeler(l)) return false;

  const typeLower = (Array.isArray(l.types) ? l.types.join(" ") : String(l.type || "")).toLowerCase();
  const bodyType = (l.body_type || l.bodyType || "").toLowerCase();

  if (
    typeLower.includes("2 wheel") ||
    typeLower.includes("motorcycle") ||
    typeLower.includes("scooter") ||
    bodyType.includes("motorcycle") ||
    bodyType.includes("scooter")
  ) {
    return false;
  }

  const isCar =
    typeLower.includes("car") ||
    typeLower.includes("4 wheel") ||
    typeLower.includes("four") ||
    ["suv", "sedan", "hatchback", "compact suv", "muv", "mpv", "crossover", "coupe", "car"].some((k) =>
      bodyType.includes(k)
    );

  return isCar || (!typeLower.includes("truck") && !typeLower.includes("tempo") && !bodyType.includes("tempo"));
}

/** Map any type query param to a canonical vehicle category value: bike | scooter | cars | commercial */
export function normalizeCatalogCategory(raw: string | null | undefined): VehicleCategoryValue {
  if (!raw) return "cars";

  const normalized = raw.toLowerCase().replace(/\+/g, " ").trim();

  if (
    normalized === "bike" ||
    normalized === "bikes" ||
    normalized === "2w-bikes" ||
    normalized === "electric motorcycle" ||
    normalized === "motorcycle"
  ) {
    return "bike";
  }

  if (
    normalized === "scooter" ||
    normalized === "scooters" ||
    normalized === "scooty" ||
    normalized === "2w-scooty" ||
    normalized === "electric scooter"
  ) {
    return "scooter";
  }

  if (
    normalized === "commercial" ||
    normalized === "commercials" ||
    normalized === "comm" ||
    normalized === "3-wheeler" ||
    normalized === "3 wheeler" ||
    normalized === "electric auto" ||
    normalized === "electric cargo auto"
  ) {
    return "commercial";
  }

  if (
    normalized === "cars" ||
    normalized === "car" ||
    normalized === "4w" ||
    normalized === "4-wheeler" ||
    normalized === "4 wheeler" ||
    normalized === "4 wheelers" ||
    normalized === "4-wheelers" ||
    normalized === "electric car"
  ) {
    return "cars";
  }

  if (normalized === "2-wheeler" || normalized === "2 wheeler") {
    return "scooter";
  }

  return "cars";
}

export function matchesVehicleCategory(item: VehicleLike, category: VehicleCategoryValue | string): boolean {
  const norm = normalizeCatalogCategory(category);
  if (norm === "bike") return isElectricBikeListing(item);
  if (norm === "scooter") return isElectricScooterListing(item);
  if (norm === "cars") return isElectricCarListing(item);
  if (norm === "commercial") return isCommercialListing(item);
  return true;
}

export function matchesCatalogCategory(item: VehicleLike | string, category: VehicleCategoryValue | string): boolean {
  if (typeof item === "string") {
    return matchesVehicleCategory({ type: item }, category);
  }
  return matchesVehicleCategory(item, category);
}

export function catalogFilterUrl(filters: {
  type?: string | null;
  brand?: string | null;
  comm?: boolean;
  q?: string | null;
}): string {
  const params = new URLSearchParams();

  if (filters.type) {
    params.set("type", normalizeCatalogCategory(filters.type));
  } else if (filters.comm) {
    params.set("type", "commercial");
  }

  if (filters.brand && filters.brand !== "all") {
    params.set("brand", filters.brand);
  }
  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  const query = params.toString();
  return query ? `/buy-ev?${query}` : "/buy-ev";
}