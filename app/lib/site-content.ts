import { cache } from "react";
import { fetchEvListingsFromSupabase } from "./supabase";
import { isLaunched, formatLaunchDate, formatPricing } from "./wordpress";

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

// ── Supabase loader ─────────────────────────────────────────────────────────

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

async function loadFromSupabase(): Promise<SiteContent> {
  const listings = await fetchEvListingsFromSupabase(200);

  const cars:        Product[] = [];
  const twoWheelers: Product[] = [];
  const autos:       Product[] = [];

  const soonCars:        ComingSoonItem[] = [];
  const soonTwoWheelers: ComingSoonItem[] = [];
  const soonAutos:       ComingSoonItem[] = [];

  for (const l of listings) {
    const isReady = isLaunched(l.launchdate);

    const bucket = bucketType(l.types[0] ?? "");
    
    if (isReady) {
      const product: Product = {
        name:       l.title,
        brand:      l.brand,
        type:       l.types[0] ?? "",
        pricing:    formatPricing(l.prices),
        photo:      l.photo,
        slug:       l.slug,
        topSpeed:   l.topSpeed,
        commercial: l.commercial,
      };

      if (bucket === "car")         cars.push(product);
      else if (bucket === "two_wheeler") twoWheelers.push(product);
      else if (bucket === "auto")   autos.push(product);
      else                          cars.push(product);
    } else {
      const item: ComingSoonItem = {
        name:       l.title,
        brand:      l.brand,
        type:       l.types[0] ?? "",
        pricing:    formatPricing(l.prices),
        launch:     formatLaunchDate(l.launchdate),
        photo:      l.photo,
      };

      if (bucket === "car")         soonCars.push(item);
      else if (bucket === "two_wheeler") soonTwoWheelers.push(item);
      else if (bucket === "auto")   soonAutos.push(item);
      else                          soonCars.push(item);
    }
  }

  return {
    products: {
      electric_cars:          cars,
      electric_two_wheelers:  twoWheelers,
      electric_autos:         autos,
    },
    comingSoon: {
      electric_cars:          soonCars,
      electric_two_wheelers:  soonTwoWheelers,
      electric_autos:         soonAutos,
    },
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  return await loadFromSupabase();
});
