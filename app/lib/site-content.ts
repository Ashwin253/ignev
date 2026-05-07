import { cache } from "react";
import localProducts from "../../products.json";
import localComingSoon from "../../comingsoon.json";
import { fetchEvListings } from "./wordpress";

export type Product = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  photo: string;
  slug?: string;
  topSpeed?: number | null;
  commercial?: boolean;
};

export type ComingSoonItem = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  launch: string;
  photo: string;
};

export type SiteContent = {
  products: {
    electric_cars: Product[];
    electric_two_wheelers: Product[];
    electric_autos: Product[];
  };
  comingSoon: {
    electric_cars: ComingSoonItem[];
    electric_two_wheelers: ComingSoonItem[];
    electric_autos: ComingSoonItem[];
  };
};

// ── Source selector ──────────────────────────────────────────────────────────

function contentSource() {
  // Default to "graphql" in production — override with CONTENT_SOURCE=local for dev
  return (process.env.CONTENT_SOURCE || "graphql").toLowerCase();
}

// ── WordPress / GraphQL loader ───────────────────────────────────────────────

/**
 * EV type keywords used to bucket listings into the three categories.
 * Matches against the ACF `type` field on each evlisting.
 */
const CAR_KEYWORDS    = ["car", "suv", "sedan", "hatchback", "crossover", "mpv"];
const SCOOTER_KEYWORDS = ["scooter", "bike", "motorcycle", "two", "2 wheel", "moped"];
const AUTO_KEYWORDS   = ["auto", "rickshaw", "three", "3 wheel", "cargo", "loader"];

function bucketType(type: string): "car" | "two_wheeler" | "auto" | null {
  const t = type.toLowerCase();
  if (CAR_KEYWORDS.some((k) => t.includes(k)))     return "car";
  if (SCOOTER_KEYWORDS.some((k) => t.includes(k))) return "two_wheeler";
  if (AUTO_KEYWORDS.some((k) => t.includes(k)))    return "auto";
  return null;
}

async function loadFromWordPress(): Promise<SiteContent> {
  const listings = await fetchEvListings(200);

  const cars:        Product[] = [];
  const twoWheelers: Product[] = [];
  const autos:       Product[] = [];

  for (const l of listings) {
    const product: Product = {
      name:       l.title,
      brand:      l.brand,
      type:       l.types[0] ?? "",
      pricing:    l.prices.length ? `₹${l.prices.join(" - ")} lakh` : "",
      photo:      l.photo,
      slug:       l.slug,
      topSpeed:   l.topSpeed,
      commercial: l.commercial,
    };

    const bucket = bucketType(l.types[0] ?? "");
    if (bucket === "car")         cars.push(product);
    else if (bucket === "two_wheeler") twoWheelers.push(product);
    else if (bucket === "auto")   autos.push(product);
    else                          cars.push(product); // default bucket
  }

  return {
    products: {
      electric_cars:          cars,
      electric_two_wheelers:  twoWheelers,
      electric_autos:         autos,
    },
    // Coming-soon data still comes from local JSON until a WP CPT is set up
    comingSoon: localComingSoon.coming_soon,
  };
}

// ── Local JSON loader ────────────────────────────────────────────────────────

function loadLocalContent(): SiteContent {
  return {
    products:  localProducts,
    comingSoon: localComingSoon.coming_soon,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (contentSource() === "graphql") {
    try {
      return await loadFromWordPress();
    } catch (err) {
      console.warn("[site-content] WordPress unavailable, falling back to local JSON:", err);
      return loadLocalContent();
    }
  }
  return loadLocalContent();
});
