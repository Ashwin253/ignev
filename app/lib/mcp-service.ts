import { fetchEvListingsFromSupabase, fetchEvListingBySlugFromSupabase, supabase, supabaseEnabled } from "./supabase";
import { formatPricing, isLaunched, formatLaunchDate, EvListing } from "./wordpress";

// Helper to extract numeric price in Lakhs from strings like "14.49", "₹ 14.49 Lakh", etc.
export function parsePriceToLakhs(priceStr: string): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^\d.]/g, "");
  const val = parseFloat(cleaned);
  if (isNaN(val)) return null;
  // If price is written in full rupees (e.g. 1500000), convert to Lakhs
  if (val > 10000) return val / 100000;
  return val;
}

// Helper to extract vehicle price range in Lakhs
export function getVehiclePriceRange(l: EvListing): { min: number | null; max: number | null } {
  const priceVals = (l.prices || [])
    .map(parsePriceToLakhs)
    .filter((n): n is number => n !== null);
  
  if (priceVals.length === 0) return { min: null, max: null };
  return {
    min: Math.min(...priceVals),
    max: Math.max(...priceVals),
  };
}

// Helper to get maximum claimed range in km
export function getVehicleMaxRange(l: EvListing): number | null {
  const ranges = (l.batteryVariants || [])
    .map((v) => parseFloat(v.range || ""))
    .filter((n) => !isNaN(n) && n > 0);
  return ranges.length > 0 ? Math.max(...ranges) : null;
}

// Helper to get maximum battery capacity in kWh
export function getVehicleMaxCapacity(l: EvListing): number | null {
  const caps = (l.batteryVariants || [])
    .map((v) => parseFloat(v.capacity || ""))
    .filter((n) => !isNaN(n) && n > 0);
  return caps.length > 0 ? Math.max(...caps) : null;
}

export interface SearchEvsParams {
  query?: string;
  brand?: string;
  type?: string; // e.g. "car", "scooter", "bike", "auto"
  maxPrice?: number; // In Lakhs (e.g. 20 for ₹20 Lakhs)
  minPrice?: number; // In Lakhs
  minRange?: number; // In km
  baasOnly?: boolean;
  limit?: number;
}

export async function searchEvs(params: SearchEvsParams = {}) {
  const {
    query = "",
    brand = "",
    type = "",
    maxPrice,
    minPrice,
    minRange,
    baasOnly,
    limit = 20,
  } = params;

  const listings = await fetchEvListingsFromSupabase(150);
  if (!listings || listings.length === 0) {
    return { count: 0, results: [] };
  }

  const qLower = query.toLowerCase().trim();
  const brandLower = brand.toLowerCase().trim();
  const typeLower = type.toLowerCase().trim();

  const filtered = listings.filter((l) => {
    // 1. Text search query
    if (qLower) {
      const matchText = `${l.brand} ${l.title} ${l.types.join(" ")} ${l.body_type || ""}`.toLowerCase();
      if (!matchText.includes(qLower)) return false;
    }

    // 2. Brand filter
    if (brandLower && !l.brand.toLowerCase().includes(brandLower)) {
      return false;
    }

    // 3. Vehicle Type filter (car, scooter, etc.)
    if (typeLower) {
      const typesJoined = (l.types || []).join(" ").toLowerCase();
      const bodyType = (l.body_type || "").toLowerCase();
      if (!typesJoined.includes(typeLower) && !bodyType.includes(typeLower)) {
        return false;
      }
    }

    // 4. BaaS filter
    if (baasOnly && !l.baas) {
      return false;
    }

    const { min: lMinPrice, max: lMaxPrice } = getVehiclePriceRange(l);
    const lMaxRange = getVehicleMaxRange(l);

    // 5. Price filter (in Lakhs)
    if (maxPrice !== undefined && lMinPrice !== null && lMinPrice > maxPrice) {
      return false;
    }
    if (minPrice !== undefined && lMaxPrice !== null && lMaxPrice < minPrice) {
      return false;
    }

    // 6. Range filter (in km)
    if (minRange !== undefined && (lMaxRange === null || lMaxRange < minRange)) {
      return false;
    }

    return true;
  });

  const results = filtered.slice(0, limit).map((l) => {
    const priceRange = getVehiclePriceRange(l);
    const maxRange = getVehicleMaxRange(l);
    const maxCap = getVehicleMaxCapacity(l);
    const launched = isLaunched(l.launchdate);

    return {
      id: l.id || l.slug,
      title: l.title,
      brand: l.brand,
      slug: l.slug,
      url: `https://www.evplse.com/product/${l.slug}`,
      type: l.types?.[0] || l.body_type || "EV",
      pricingText: formatPricing(l.prices) || "TBD",
      priceRangeLakhs: priceRange,
      maxRangeKm: maxRange,
      maxBatteryKwh: maxCap,
      topSpeedKmh: l.topSpeed,
      baasAvailable: Boolean(l.baas),
      status: launched ? "Available" : "Upcoming",
      launchDate: formatLaunchDate(l.launchdate),
      photoUrl: l.photo,
    };
  });

  return {
    count: results.length,
    totalMatches: filtered.length,
    results,
  };
}

export async function getEvDetails(slugOrName: string) {
  if (!slugOrName) {
    throw new Error("Vehicle slug or name is required.");
  }

  // 1. Try direct slug fetch
  let listing = await fetchEvListingBySlugFromSupabase(slugOrName);

  // 2. If not found, search in all listings by title/brand
  if (!listing) {
    const all = await fetchEvListingsFromSupabase(150);
    const target = slugOrName.toLowerCase().replace(/[-_]/g, " ").trim();
    listing = all.find((l) => {
      const title = `${l.brand} ${l.title}`.toLowerCase();
      const slug = l.slug.toLowerCase().replace(/[-_]/g, " ");
      return title.includes(target) || slug.includes(target) || target.includes(l.slug.toLowerCase());
    }) || null;
  }

  if (!listing) {
    return { found: false, message: `Vehicle '${slugOrName}' not found.` };
  }

  const priceRange = getVehiclePriceRange(listing);
  const maxRange = getVehicleMaxRange(listing);
  const maxCap = getVehicleMaxCapacity(listing);
  const launched = isLaunched(listing.launchdate);

  return {
    found: true,
    data: {
      id: listing.id,
      title: listing.title,
      brand: listing.brand,
      slug: listing.slug,
      url: `https://www.evplse.com/product/${listing.slug}`,
      type: listing.types?.[0] || listing.body_type || "EV",
      bodyType: listing.body_type || "",
      pricing: {
        display: formatPricing(listing.prices) || "TBD",
        minLakhs: priceRange.min,
        maxLakhs: priceRange.max,
        rawPrices: listing.prices || [],
      },
      specifications: {
        maxRangeKm: maxRange,
        maxBatteryCapacityKwh: maxCap,
        topSpeedKmh: listing.topSpeed,
        batterySpecs: listing.batterySpecs || [],
        chargingSpecs: listing.chargingSpecs || [],
      },
      variants: (listing.batteryVariants || []).map((v) => ({
        name: v.modelName || (v as any).name || "Standard Variant",
        rangeKm: v.range ? parseFloat(v.range) : null,
        capacityKwh: v.capacity ? parseFloat(v.capacity) : null,
        price: v.price || null,
        priceBaas: v.price_baas || null,
        basePriceBaas: v.baseprice || null,
      })),
      baas: {
        available: Boolean(listing.baas),
        variants: listing.baasVariants || [],
      },
      pros: listing.pros || [],
      cons: listing.cons || [],
      status: launched ? "Launched" : "Upcoming",
      launchDate: formatLaunchDate(listing.launchdate),
      photoUrl: listing.photo,
    },
  };
}

export async function compareEvs(slugs: string[]) {
  if (!slugs || slugs.length < 2) {
    throw new Error("Please provide at least 2 vehicle slugs to compare.");
  }

  const cleanSlugs = slugs.slice(0, 4); // compare up to 4
  const vehicles = await Promise.all(cleanSlugs.map((s) => getEvDetails(s.trim())));

  const foundVehicles = vehicles
    .filter((v) => v.found && v.data)
    .map((v) => v.data!);

  if (foundVehicles.length === 0) {
    return { error: "None of the specified vehicles were found." };
  }

  const comparison = {
    totalVehicles: foundVehicles.length,
    vehicles: foundVehicles.map((v) => ({
      title: `${v.brand} ${v.title}`,
      slug: v.slug,
      url: v.url,
      type: v.type,
      pricing: v.pricing.display,
      maxRangeKm: v.specifications.maxRangeKm,
      batteryKwh: v.specifications.maxBatteryCapacityKwh,
      topSpeedKmh: v.specifications.topSpeedKmh,
      baasAvailable: v.baas.available,
      status: v.status,
      pros: v.pros.slice(0, 3),
      cons: v.cons.slice(0, 3),
    })),
  };

  return comparison;
}

export interface StationSearchParams {
  city?: string;
  network?: string;
  query?: string;
  limit?: number;
}

export async function findChargingStations(params: StationSearchParams = {}) {
  const { city = "", network = "", query = "", limit = 20 } = params;

  if (!supabaseEnabled()) {
    return { count: 0, stations: [] };
  }

  let queryBuilder = supabase
    .from("ev_stations")
    .select("*")
    .eq("is_active", true);

  if (city) {
    queryBuilder = queryBuilder.ilike("city", `%${city.trim()}%`);
  }
  if (network) {
    queryBuilder = queryBuilder.ilike("network", `%${network.trim()}%`);
  }

  const { data, error } = await queryBuilder.limit(limit * 2);

  if (error || !data) {
    return { count: 0, stations: [], error: error?.message };
  }

  let results = data;
  if (query) {
    const q = query.toLowerCase();
    results = results.filter((s: any) =>
      `${s.name} ${s.address} ${s.city} ${s.network}`.toLowerCase().includes(q)
    );
  }

  const finalStations = results.slice(0, limit).map((s: any) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    address: s.address,
    network: s.network,
    powerKw: s.power_kw,
    connectorTypes: s.connector_types || [],
    location: {
      lat: s.lat,
      lng: s.lng,
    },
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`,
  }));

  return {
    count: finalStations.length,
    stations: finalStations,
  };
}

export interface CalculateSavingsParams {
  dailyKm: number;
  vehicleType?: "car" | "scooter";
  fuelPrice?: number; // Petrol price per litre (default ~ ₹100)
  electricityRate?: number; // Cost per kWh (default ~ ₹7.5)
}

export function calculateSavings(params: CalculateSavingsParams) {
  const dailyKm = Math.max(1, params.dailyKm || 35);
  const vehicleType = params.vehicleType === "scooter" ? "scooter" : "car";
  const fuelPrice = params.fuelPrice || 102; // Rs/L
  const electricityRate = params.electricityRate || 7.5; // Rs/unit

  // Benchmarks
  // Car: Petrol mileage ~ 15 km/l, EV efficiency ~ 7.5 km/kWh (0.133 kWh/km)
  // Scooter: Petrol mileage ~ 45 km/l, EV efficiency ~ 30 km/kWh (0.033 kWh/km)
  const isCar = vehicleType === "car";
  const petrolMileage = isCar ? 15 : 45; // km/litre
  const evEfficiencyKmPerKwh = isCar ? 7.5 : 30; // km/kWh

  const monthlyKm = dailyKm * 30;
  const yearlyKm = dailyKm * 365;

  // Monthly fuel cost
  const petrolMonthlyCost = Math.round((monthlyKm / petrolMileage) * fuelPrice);
  const evMonthlyCost = Math.round((monthlyKm / evEfficiencyKmPerKwh) * electricityRate);
  const monthlySavings = petrolMonthlyCost - evMonthlyCost;

  // Yearly fuel cost
  const petrolYearlyCost = Math.round((yearlyKm / petrolMileage) * fuelPrice);
  const evYearlyCost = Math.round((yearlyKm / evEfficiencyKmPerKwh) * electricityRate);
  const yearlySavings = petrolYearlyCost - evYearlyCost;

  // 3 & 5 Year projections
  const threeYearSavings = yearlySavings * 3;
  const fiveYearSavings = yearlySavings * 5;

  return {
    inputs: {
      dailyKm,
      vehicleType,
      fuelPricePerLitre: fuelPrice,
      electricityRatePerKwh: electricityRate,
    },
    monthly: {
      petrolCost: petrolMonthlyCost,
      evCost: evMonthlyCost,
      savings: monthlySavings,
    },
    yearly: {
      petrolCost: petrolYearlyCost,
      evCost: evYearlyCost,
      savings: yearlySavings,
    },
    projections: {
      threeYearSavings,
      fiveYearSavings,
    },
    summaryText: `By driving ${dailyKm} km/day with an electric ${vehicleType}, you spend ~₹${evMonthlyCost}/month compared to ~₹${petrolMonthlyCost}/month on petrol, saving ₹${monthlySavings.toLocaleString("en-IN")} every month and ₹${yearlySavings.toLocaleString("en-IN")} per year.`,
  };
}

export async function getCatalogResource(): Promise<string> {
  const listings = await fetchEvListingsFromSupabase(100);
  if (!listings || listings.length === 0) return "# EVPULSE EV Catalog\n\nNo vehicles found.";

  let md = `# EVPULSE EV Catalog Database\n\nTotal vehicles: ${listings.length}\n\n`;
  listings.forEach((l) => {
    const pricing = formatPricing(l.prices) || "TBD";
    const range = getVehicleMaxRange(l);
    md += `### ${l.brand} ${l.title}\n`;
    md += `- Type: ${l.types?.[0] || l.body_type || "Vehicle"}\n`;
    md += `- Price: ${pricing}\n`;
    if (range) md += `- Max Range: ${range} km\n`;
    if (l.topSpeed) md += `- Top Speed: ${l.topSpeed} km/h\n`;
    md += `- URL: https://www.evplse.com/product/${l.slug}\n\n`;
  });
  return md;
}

export async function getStationsResource(): Promise<string> {
  const { stations } = await findChargingStations({ limit: 50 });
  if (!stations || stations.length === 0) return "# EVPULSE Charging Stations\n\nNo stations available.";

  let md = `# EVPULSE Charging Network\n\nAvailable stations (sample 50):\n\n`;
  (stations || []).forEach((s: any) => {
    md += `- **${s.name}** (${s.network || "Public"}) - ${s.city}: ${s.address} [${s.powerKw ? `${s.powerKw}kW` : "Fast Charger"}]\n`;
  });
  return md;
}
