import type { CatalogItem } from "./catalog-types";

/** Forgiving catalog search: substring, token and alias ("scooty", "4w", "cargo" …) matching. */
export function matchesSearchQuery(item: CatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const brand = (item.brand || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const type = (item.type || "").toLowerCase();
  const slug = (item.slug || "").toLowerCase();
  const usage = (item.usageType || "").toLowerCase();
  const pricing = (item.pricing || "").toLowerCase();

  const fullText = `${brand} ${name} ${type} ${usage} ${slug} ${pricing} ${
    item.commercial
      ? "commercial fleet cargo truck 3w loader tempo auto"
      : "personal passenger 4w 4-wheeler car suv sedan hatchback scooter bike motorcycle"
  }`;

  // Direct substring match
  if (fullText.includes(q)) return true;

  // Split query into tokens
  const words = q.split(/[\s,+/_-]+/).filter(Boolean);
  if (words.length === 0) return true;

  return words.every((word) => {
    if (fullText.includes(word)) return true;

    // Aliases & Vehicle category terms
    if (
      word === "car" ||
      word === "cars" ||
      word === "4w" ||
      word === "4-wheeler" ||
      word === "4-wheelers" ||
      word === "suv" ||
      word === "sedan" ||
      word === "hatchback"
    ) {
      return (
        type.includes("car") ||
        type.includes("4") ||
        fullText.includes("car") ||
        fullText.includes("suv") ||
        fullText.includes("sedan")
      );
    }
    if (
      word === "bike" ||
      word === "bikes" ||
      word === "motorcycle" ||
      word === "motorcycles" ||
      word === "2w"
    ) {
      return (
        type.includes("motorcycle") ||
        type.includes("bike") ||
        fullText.includes("bike") ||
        fullText.includes("motorcycle") ||
        ["revolt", "ultraviolette", "matter", "tork", "oben", "hop", "kabira", "orxa", "raptee"].some(
          (b) => brand.includes(b) || name.includes(b)
        )
      );
    }
    if (word === "scooter" || word === "scooters" || word === "scooty" || word === "moped") {
      return (
        type.includes("scooter") ||
        fullText.includes("scooter") ||
        fullText.includes("scooty") ||
        ["ather", "ola", "tvs", "chetak", "rizta", "iqube", "vida", "river", "bgauss", "bounce", "simple", "okinawa", "ampere", "quantum", "pure"].some(
          (b) => brand.includes(b) || name.includes(b)
        )
      );
    }
    if (word === "ev" || word === "electric" || word === "vehicle" || word === "vehicles") {
      return true; // All items in the catalog are EVs
    }
    if (
      word === "commercial" ||
      word === "cargo" ||
      word === "truck" ||
      word === "tempo" ||
      word === "auto" ||
      word === "3w" ||
      word === "3-wheeler" ||
      word === "3-wheelers" ||
      word === "loader" ||
      word === "rickshaw" ||
      word === "fleet"
    ) {
      return (
        item.commercial === true ||
        type.includes("auto") ||
        type.includes("cargo") ||
        type.includes("3") ||
        type.includes("truck") ||
        usage.includes("commercial")
      );
    }

    return false;
  });
}
