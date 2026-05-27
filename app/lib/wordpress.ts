// app/lib/wordpress.ts
/**
 * WordPress GraphQL client — https://evplse.online/graphql
 *
 * Confirmed schema (introspected live):
 *
 * evlistings → Evlisting
 *   evlist (ACF): brand, type[], price[], topSpeed(Float), commercial(Boolean),
 *                 launchdate(String|null)
 *   featuredImage.node.sourceUrl
 *
 * updates → Update
 *   id, title, slug, date, content, featuredImage.node.sourceUrl
 *   (no excerpt / categories on Update type — content only)
 *
 * Required env vars:
 *   WP_GRAPHQL_ENDPOINT   (defaults to https://evplse.online/graphql)
 *   WP_APP_USERNAME       WordPress application-password username
 *   WP_APP_PASSWORD       WordPress application password
 */

// ── Config ───────────────────────────────────────────────────────────────────

export function gqlEndpoint(): string {
  return (process.env.WP_GRAPHQL_ENDPOINT ?? "https://evplse.online/graphql").trim();
}

function authHeader(): string {
  const user = process.env.WP_APP_USERNAME ?? "";
  const pass = (process.env.WP_APP_PASSWORD ?? "").replace(/\s/g, "");
  if (!user || !pass) return "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export function wpEnabled(): boolean {
  return !!gqlEndpoint();
}

// ── Core fetch ───────────────────────────────────────────────────────────────

type GQLResponse<T> = { data?: T; errors?: { message: string }[] };

/** Delay helper for retry backoff */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Core GraphQL fetch with retry logic.
 * Retries up to 3 times with exponential backoff (500ms, 1s, 2s)
 * to handle intermittent WP hosting timeouts.
 */
async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: { auth?: boolean; revalidate?: number; retries?: number } = {}
): Promise<T> {
  const maxRetries = options.retries ?? 2;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth) {
    const auth = authHeader();
    if (auth) headers["Authorization"] = auth;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(gqlEndpoint(), {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
        next: options.revalidate !== undefined
          ? { revalidate: options.revalidate }
          : { revalidate: 60 },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
      }

      const json = (await res.json()) as GQLResponse<T>;
      if (json.errors?.length && !json.data) {
        throw new Error(`GraphQL: ${json.errors.map((e) => e.message).join(", ")}`);
      }
      if (!json.data) throw new Error("GraphQL returned no data.");
      return json.data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry on GraphQL schema errors (400s with field errors)
      if (lastError.message.includes("Cannot query field")) throw lastError;
      // Retry with backoff
      if (attempt < maxRetries - 1) {
        await delay(500 * Math.pow(2, attempt)); // 500ms, 1s, 2s
      }
    }
  }

  throw lastError ?? new Error("GraphQL request failed after retries.");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format launchdate:
 *   null / empty  → "Available Now"
 *   ISO string    → "May 2026"
 */
export function formatLaunchDate(launchdate: string | null | undefined): string {
  if (!launchdate) return " ";
  const d = new Date(launchdate);
  if (isNaN(d.getTime())) return " ";
  return d <= new Date() ? " " : "Coming Soon";
}

/** True when the vehicle is already launched (no future date). */
export function isLaunched(launchdate: string | null | undefined): boolean {
  if (!launchdate) return true;
  return new Date(launchdate) <= new Date();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type EvListing = {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  photo: string;
  // evlist ACF fields
  brand: string;
  types: string[];
  prices: string[];
  topSpeed: number | null;
  commercial: boolean;
  launchdate: string | null;
  // OpenFields top-level fields (JSON strings parsed client-side)
  batteryVariants: BatteryVariant[];
  // batteryVariants: BatteryVariant[]; // Standard
  baasVariants: BatteryVariant[];
  // baasVariants: BatteryVariant[]; // Add this: BAAS specific variants

  pros: string[];
  cons: string[];
  colors: string[];           // hex codes e.g. ["673ab7", "b7673a"]
  galleryImages: string[];    // full image URLs
  energyComparison: EnergyCompareEntry[];
  batterySpecs: BatterySpec[];
  chargingSpecs: ChargingSpec[];
  offers: EVOffer[];
  baas: boolean;              // Added for BAAS
  // Variant details from Supabase
  variantDimensions?: Array<{ variantName: string; length_mm?: number; width_mm?: number; height_mm?: number; wheelbase_mm?: number; ground_clearance_mm?: number; boot_space_litres?: number; turning_radius_m?: number }>;
  variantFeatures?: Array<{ variantName: string; [key: string]: any }>;
  // Legacy / optional
  batteryCapacity?: number | null;
  chargingSpeed?: number | null;
  realWorldRange?: number | null;
  batteryTypes: string[];
};

export type BatteryVariant = {
  modelName?: string;
  capacity: string;      // kWh
  range: string;         // km
  charge: string;        // minutes (raw from WP)
  price?: string;        // Lakhs (Standard ex-showroom)
  price_baas?: string;   // ₹/km rate (BAAS subscription)
  baseprice?: string;    // Lakhs (BAAS upfront base price)
  battery_subs?: string; // Battery subscription price fallback
};

export type EnergyCompareEntry = {
  name: string;
  fuelType: string;
  mileage: string;
  fuelPrice: string;
  priceRange?: string;
  modelused?: string;
  category?: string;  // 'fuel' or 'model'
};

function mapEnergyEntry(raw: Record<string, unknown>): EnergyCompareEntry {
  return {
    name: String(raw.name ?? ""),
    fuelType: String(raw.fuelType ?? raw.fueltype ?? raw.fuel_type ?? ""),
    mileage: String(raw.mileage ?? ""),
    fuelPrice: String(raw.fuelPrice ?? raw.fuelprice ?? raw.fuel_price ?? ""),
    priceRange: raw.priceRange ? String(raw.priceRange) : undefined,
    modelused: String(raw.modelused ?? raw.model_used ?? raw.modelUsed ?? ""),
  };
}

export type BatterySpec = {
  variantName: string;
  turboSupercharger: string;
  maxPower: string;
  maxTorque: string;
  idleStartStop: string;
  emissionStandard: string;
  engine: string;
  electricMotor: string;
  extraSpecs?: Array<{ label: string; value: string }>;
};

export type ChargingSpec = {
  variantName: string;
  acRegularCharging: string;
  dcFastCharging: string;
  acFastCharging: string;
  drivingRange: string;
  chargingOptions: string;
  chargerIncluded: string;
  chargerConnectionType: string;
  extraSpecs?: Array<{ label: string; value: string }>;
};

export type EVOffer = {
  image: string;
  bank?: string;
  city?: string;
  brand?: string;
  title?: string;
};

export type WPUpdate = {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  content: string;
  photo: string;
};

export type WPLead = {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  interest: string;
  message: string;
  createdAt: string;
};

export type WPOfferPage = {
  id: string;
  databaseId: number;
  title: string;
  detail: string;
  location: string;
  options: string[];
  image: string;
};

// ── Raw ACF node type ─────────────────────────────────────────────────────────

type RawEvlistNode = {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  featuredImage: { node: { sourceUrl: string } } | null;
  // OpenFields top-level JSON string fields
  batteryVariants: string | null;
  batterySubs: string | null;
  propoint: string | null;
  conpoint: string | null;
  colorTestText: string | null;
  galleryImages: string | null;
  energyComparison: string | null;
  batterySpecs: string | null;
  chargingSpecs: string | null;
  evlist: {
    brand: string | null;
    type: string[] | null;
    price: string[] | string | null;
    topSpeed: number | null;
    commercial: boolean | null;
    launchdate: string | null;
    hasBaas: boolean | null;
  } | null;
};

// Safe JSON parse helper
function parseJsonArray<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw !== "string") return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

function parseTextList(raw: unknown): string[] {
  if (!raw) return [];

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return typeof parsed === "string" || Array.isArray(parsed) || (parsed !== null && typeof parsed === "object")
        ? parseTextList(parsed)
        : [trimmed];
    } catch {
      return [trimmed];
    }
  }

  if (Array.isArray(raw)) {
    return raw.flatMap(parseTextList);
  }

  if (typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).flatMap(parseTextList);
  }

  return [];
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = parseTextList(value).find(Boolean);
    if (text) return text;
  }
  return "";
}

function pickNested(raw: unknown, key: string): unknown {
  if (!raw) return undefined;

  if (typeof raw === "string") {
    try {
      return pickNested(JSON.parse(raw) as unknown, key);
    } catch {
      return undefined;
    }
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const value = pickNested(item, key);
      if (value !== undefined) return value;
    }
    return undefined;
  }

  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (record[key] !== undefined) return record[key];

    for (const value of Object.values(record)) {
      const nested = pickNested(value, key);
      if (nested !== undefined) return nested;
    }
  }

  return undefined;
}

function boolValue(raw: unknown): boolean {
  return raw === true || raw === 1 || raw === "1" || raw === "true" || raw === "yes";
}

function priceNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = parseFloat(raw.replace(/[₹,a-zA-Z\s]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function hasVariantBaasPricing(variants: BatteryVariant[]): boolean {
  return variants.some((variant) => {
    if (variant.price_baas) return true;
    if (variant.baseprice) return true;
    return false;
  });
}

function mapBatteryVariant(raw: BatteryVariant | Record<string, unknown>): BatteryVariant {
  const record = raw as Record<string, unknown>;
  return {
    modelName: firstText(record.modelName, record.ModelNames, record.modelNames, record.model_name, record.model),
    capacity: firstText(record.capacity, record.battery_capacity, record.batteryCapacity),
    range: firstText(record.range, record.real_world_range, record.realWorldRange),
    charge: firstText(record.charge, record.chargingtime, record.charging_time, record.chargingTime),
    price: firstText(record.price, record.price_standard, record.standard_price, record.priceStandard),
    price_baas: firstText(record.price_baas, record.priceBaas, record.baas_price, record.baasPrice),
    baseprice: firstText(record.baseprice, record.basePrice, record.base_price),
    battery_subs: firstText(record.battery_subs, record.batterySubs, record.battery_subscription, record.batterySubscription),
  };
}

function parseBatteryVariants(raw: unknown): BatteryVariant[] {
  return parseJsonArray<Record<string, unknown>>(raw)
    .map(mapBatteryVariant)
    .filter((variant) => variant.capacity || variant.range || variant.charge || variant.price || variant.price_baas || variant.baseprice);
}

function applyBatterySubs(variants: BatteryVariant[], rawSubs: unknown): BatteryVariant[] {
  const subs = parseJsonArray<Record<string, unknown>>(rawSubs).map(mapBatteryVariant);
  if (subs.length === 0) return variants;
  if (variants.length === 0) return subs;

  return variants.map((variant, index) => ({
    ...variant,
    modelName: variant.modelName || subs[index]?.modelName || subs[0]?.modelName,
    battery_subs: variant.battery_subs || subs[index]?.battery_subs || subs[index]?.price || subs[0]?.battery_subs || subs[0]?.price,
    range: variant.range || subs[index]?.range || subs[0]?.range || "",
  }));
}

const EVLIST_FRAGMENT = /* GraphQL */ `
  id
  databaseId
  title
  slug
  date
  featuredImage { node { sourceUrl } }
  batteryVariants
  batterySubs
  propoint
  conpoint
  colorTestText
  galleryImages
  energyComparison
  batterySpecs
  chargingSpecs
  evlist {
    brand
    type
    price
    topSpeed
    commercial
    launchdate
    hasBaas
  }
`;

function mapEvlistNode(n: RawEvlistNode): EvListing {
  const e = n.evlist;
  const standardVariants = parseBatteryVariants(n.batteryVariants);
  const baasVariants = parseBatteryVariants(n.batterySubs);
  // const variants = applyBatterySubs(parseBatteryVariants(n.batteryVariants), n.batterySubs);
  const hasBaas = boolValue(e?.hasBaas) || baasVariants.length > 0 || hasVariantBaasPricing(standardVariants);


  return {
    id: n.id,
    databaseId: n.databaseId,
    title: n.title.trim(),
    slug: n.slug,
    date: n.date,
    photo: n.featuredImage?.node?.sourceUrl || parseJsonArray<string>(n.galleryImages)[0] || "",
    brand: e?.brand ?? "",
    types: e?.type ?? [],
    prices: Array.isArray(e?.price) ? e.price : (e?.price ? [e.price] : []),
    topSpeed: e?.topSpeed ?? null,
    commercial: e?.commercial ?? false,
    launchdate: e?.launchdate ?? null,
    batteryVariants: standardVariants, // Only standard now
    baasVariants: baasVariants, // New: separate BAAS list
    pros: parseTextList(n.propoint),
    cons: parseTextList(n.conpoint),
    colors: parseJsonArray<string>(n.colorTestText),
    galleryImages: parseJsonArray<string>(n.galleryImages),
    energyComparison: parseJsonArray<Record<string, unknown>>(n.energyComparison).map(mapEnergyEntry),
    batterySpecs: parseJsonArray<BatterySpec>(n.batterySpecs),
    chargingSpecs: parseJsonArray<ChargingSpec>(n.chargingSpecs),
    offers: [],
    batteryTypes: [],
    baas: hasBaas,
  };
}

// ── EV Listings ───────────────────────────────────────────────────────────────

export async function fetchEvListings(first = 100): Promise<EvListing[]> {
  const query = /* GraphQL */ `
    query FetchEvListings($first: Int!) {
      evlistings(first: $first, where: { status: PUBLISH }) {
        nodes { ${EVLIST_FRAGMENT} }
      }
    }
  `;
  try {
    const data = await gql<{ evlistings: { nodes: RawEvlistNode[] } }>(
      query, { first }, { revalidate: 60 }
    );
    return data.evlistings.nodes.map(mapEvlistNode);
  } catch (err) {
    console.warn("[WP] fetchEvListings failed, returning []:", err);
    return [];
  }
}

export async function fetchEvListingBySlug(slug: string): Promise<EvListing | null> {
  const query = /* GraphQL */ `
    query FetchEvListingBySlug($slug: ID!) {
      evlisting(id: $slug, idType: SLUG) { ${EVLIST_FRAGMENT} }
    }
  `;
  try {
    const data = await gql<{ evlisting: RawEvlistNode | null }>(
      query, { slug }, { revalidate: 60 }
    );
    if (data.evlisting) return mapEvlistNode(data.evlisting);
  } catch (err) {
    console.warn("[WP] fetchEvListingBySlug direct failed:", err);
  }

  // Fallback: search in the full list (which we know works from /catalog)
  try {
    const all = await fetchEvListings(200);
    return all.find((l) => l.slug === slug) || null;
  } catch {
    return null;
  }
}

// ── WP REST API — evlisting detail (OpenFields meta) ─────────────────────────
// Used for the /product/[slug] page to get the full OpenFields meta fields
// once "Show in REST API" is enabled in OpenFields field group settings.

const WP_REST_BASE = "https://evplse.online/wp-json/wp/v2";

type RestEvlisting = {
  id: number;
  slug: string;
  title: { rendered: string };
  date: string;
  featured_media: number;
  meta: Record<string, unknown>;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
  };
};

// function mapRestListing(p: RestEvlisting): EvListing {
//   const m = p.meta ?? {};

//   // Helper to safely get string/array from meta
//   const str  = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : "");
//   const arr  = (k: string): string[] => Array.isArray(m[k]) ? (m[k] as string[]) : (str(k) ? [str(k)] : []);
//   const num  = (k: string): number | null => { const v = parseFloat(String(m[k] ?? "")); return isNaN(v) ? null : v; };
//   const bool = (k: string): boolean => boolValue(m[k]);

//   const photo = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";

//   const batteryVariants = applyBatterySubs(
//     parseBatteryVariants(m["battery_variants"] ?? m["batteryVariants"]),
//     m["battery_subs"] ?? m["batterySubs"] ?? m["battery_subscriptions"] ?? m["batterySubscriptions"]
//   );
//   const hasBaas = bool("has__baas") || bool("has_baas") || bool("hasBaas") || bool("baas") || hasVariantBaasPricing(batteryVariants);

//   // OpenFields can expose repeaters as JSON, arrays, or nested fieldset objects.
//   const proPointMeta = m["pro_point"] ?? m["proPoint"] ?? m["propoint"];
//   let pros = parseTextList(pickNested(proPointMeta, "propoint") ?? proPointMeta);
//   if (pros.length === 0) {
//     pros = [str("proone"), str("protwo"), str("prothree")].filter(Boolean);
//   }

//   let cons = parseTextList(m["con_point"] ?? m["conPoint"] ?? m["conpoint"]);
//   if (cons.length === 0) {
//     cons = [str("conone"), str("contwo"), str("conthree")].filter(Boolean);
//   }

//   return {
//     id:             String(p.id),
//     databaseId:     p.id,
//     title:          p.title.rendered.trim(),
//     slug:           p.slug,
//     date:           p.date,
//     photo,
//     brand:          str("brand"),
//     types:          arr("type"),
//     prices:         arr("price"),
//     topSpeed:       num("top_speed") ?? num("topSpeed"),
//     commercial:     bool("commercial"),
//     launchdate:     str("launchdate") || null,
//     batteryCapacity: num("battery_capacity") ?? num("batteryCapacity"),
//     chargingSpeed:  num("charging_speed") ?? num("chargingSpeed"),
//     realWorldRange: num("real_world_range") ?? num("realWorldRange"),
//     batteryTypes:   arr("battery_type"),
//     colors:         parseJsonArray<string>(str("colorTestText") || str("colors") || str("color_test_text")),
//     pros,
//     cons,
//     batteryVariants,
//      baasVariants: baasVariants, // Add thi
//     galleryImages:  parseJsonArray<string>(str("galleryImages") || str("gallery_images")),
//     offers:         parseJsonArray<EVOffer>(str("offervalue") || str("offer_value")),
//     baas:           hasBaas,
//   };
// }
function mapRestListing(p: RestEvlisting): EvListing {
  const m = p.meta ?? {};

  // Helper to safely get string/array from meta
  const str = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : "");
  const arr = (k: string): string[] => Array.isArray(m[k]) ? (m[k] as string[]) : (str(k) ? [str(k)] : []);
  const num = (k: string): number | null => { const v = parseFloat(String(m[k] ?? "")); return isNaN(v) ? null : v; };
  const bool = (k: string): boolean => boolValue(m[k]);

  const featuredPhoto = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
  const galleryFallback = parseJsonArray<string>(str("galleryImages") || str("gallery_images"));
  const photo = featuredPhoto || galleryFallback[0] || "";

  // Stop merging - keep them separate
  const standardVariants = parseBatteryVariants(m["battery_variants"] ?? m["batteryVariants"]);
  const baasVariants = parseBatteryVariants(
    m["battery_subs"] ?? m["batterySubs"] ?? m["battery_subscriptions"] ?? m["batterySubscriptions"]
  );

  const hasBaas = bool("has__baas") || bool("has_baas") || bool("hasBaas") || bool("baas") || baasVariants.length > 0;

  // OpenFields can expose repeaters as JSON, arrays, or nested fieldset objects.
  const proPointMeta = m["pro_point"] ?? m["proPoint"] ?? m["propoint"];
  let pros = parseTextList(pickNested(proPointMeta, "propoint") ?? proPointMeta);
  if (pros.length === 0) {
    pros = [str("proone"), str("protwo"), str("prothree")].filter(Boolean);
  }

  let cons = parseTextList(m["con_point"] ?? m["conPoint"] ?? m["conpoint"]);
  if (cons.length === 0) {
    cons = [str("conone"), str("contwo"), str("conthree")].filter(Boolean);
  }

  return {
    id: String(p.id),
    databaseId: p.id,
    title: p.title.rendered.trim(),
    slug: p.slug,
    date: p.date,
    photo,
    brand: str("brand"),
    types: arr("type"),
    prices: arr("price"),
    topSpeed: num("top_speed") ?? num("topSpeed"),
    commercial: bool("commercial"),
    launchdate: str("launchdate") || null,
    batteryCapacity: num("battery_capacity") ?? num("batteryCapacity"),
    chargingSpeed: num("charging_speed") ?? num("chargingSpeed"),
    realWorldRange: num("real_world_range") ?? num("realWorldRange"),
    batteryTypes: arr("battery_type"),
    colors: parseJsonArray<string>(str("colorTestText") || str("colors") || str("color_test_text")),
    pros,
    cons,
    batteryVariants: standardVariants, // Standard only
    baasVariants: baasVariants, // BAAS only - no merge
    galleryImages: parseJsonArray<string>(str("galleryImages") || str("gallery_images")),
    energyComparison: parseJsonArray<Record<string, unknown>>(str("energyComparison") || str("energy_comparison")).map(mapEnergyEntry),
    batterySpecs: parseJsonArray<BatterySpec>(str("batterySpecs") || str("battery_specs")),
    chargingSpecs: parseJsonArray<ChargingSpec>(str("chargingSpecs") || str("charging_specs")),
    offers: parseJsonArray<EVOffer>(str("offervalue") || str("offer_value")),
    baas: hasBaas,
  };
}
/**
 * Fetch a single evlisting by slug via WP REST API.
 * Returns richer OpenFields meta fields once "Show in REST API" is enabled.
 * Falls back to GraphQL if REST meta is empty.
 */
export async function fetchEvListingBySlugREST(slug: string): Promise<EvListing | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const url = `${WP_REST_BASE}/evlisting?slug=${encodeURIComponent(slug)}&_embed&per_page=1`;
      const res = await fetch(url, { signal: controller.signal, next: { revalidate: 60 } });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`REST ${res.status}`);
      const posts = await res.json() as RestEvlisting[];
      if (!posts[0]) break;
      const listing = mapRestListing(posts[0]);
      if (listing.brand && (listing.batteryVariants.length > 0 || listing.topSpeed !== null)) {
        return listing;
      }
      break; // REST worked but no meta — fall through to GraphQL
    } catch {
      if (attempt < 2) await delay(500 * Math.pow(2, attempt));
    }
  }
  // Fallback to GraphQL
  return fetchEvListingBySlug(slug);
}

/**
 * Fetch all evlistings via WP REST API (with OpenFields meta).
 * Falls back to GraphQL if meta is empty.
 */
export async function fetchEvListingsREST(perPage = 100): Promise<EvListing[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const url = `${WP_REST_BASE}/evlisting?_embed&per_page=${perPage}&status=publish&orderby=date&order=desc`;
      const res = await fetch(url, { signal: controller.signal, next: { revalidate: 60 } });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`REST ${res.status}`);
      const posts = await res.json() as RestEvlisting[];
      const listings = posts.map(mapRestListing);
      if (listings.length > 0) {
        return listings;
      }
      break; // REST worked but no meta
    } catch {
      if (attempt < 2) await delay(500 * Math.pow(2, attempt));
    }
  }
  // Fallback to GraphQL
  return fetchEvListings(perPage);
}

type RawUpdateNode = {
  id: string;
  title: string;
  slug: string;
  date: string;
  content: string;
  featuredImage: { node: { sourceUrl: string } } | null;
};

function mapUpdateNode(n: RawUpdateNode): WPUpdate {
  // Build a plain-text excerpt from the first paragraph of content
  const stripped = n.content?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
  const excerpt = stripped.length > 160 ? stripped.slice(0, 157) + "…" : stripped;
  return {
    id: n.id,
    title: n.title,
    slug: n.slug,
    date: n.date,
    excerpt,
    content: n.content ?? "",
    photo: n.featuredImage?.node?.sourceUrl ?? "",
  };
}

const UPDATE_FRAGMENT = /* GraphQL */ `
  id title slug date content
  featuredImage { node { sourceUrl } }
`;

export async function fetchWPUpdates(first = 10): Promise<WPUpdate[]> {
  const query = /* GraphQL */ `
    query FetchUpdates($first: Int!) {
      updates(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
        nodes { ${UPDATE_FRAGMENT} }
      }
    }
  `;
  try {
    const data = await gql<{ updates: { nodes: RawUpdateNode[] } }>(
      query, { first }, { revalidate: 300 }
    );
    return data.updates.nodes.map(mapUpdateNode);
  } catch (err) {
    console.warn("[WP] fetchWPUpdates failed, returning []:", err);
    return [];
  }
}

export async function fetchWPUpdateBySlug(slug: string): Promise<WPUpdate | null> {
  const query = /* GraphQL */ `
    query FetchUpdateBySlug($slug: ID!) {
      update(id: $slug, idType: SLUG) { ${UPDATE_FRAGMENT} }
    }
  `;
  try {
    const data = await gql<{ update: RawUpdateNode | null }>(
      query, { slug }, { revalidate: 300 }
    );
    return data.update ? mapUpdateNode(data.update) : null;
  } catch (err) {
    console.warn("[WP] fetchWPUpdateBySlug failed:", err);
    return null;
  }
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export async function createWPLead(data: {
  name: string; phone: string; pincode: string; interest: string; message?: string;
}): Promise<void> {
  const mutation = /* GraphQL */ `
    mutation CreateLead($title: String!, $content: String!) {
      createEvlisting(input: { title: $title, content: $content, status: PRIVATE }) {
        evlisting { id }
      }
    }
  `;
  const content = JSON.stringify({
    phone: data.phone, pincode: data.pincode,
    interest: data.interest, message: data.message ?? "",
    source: "get-assist", submittedAt: new Date().toISOString(),
  });
  await gql<unknown>(mutation, { title: data.name, content }, { auth: true });
}

export async function fetchWPLeads(): Promise<WPLead[]> {
  const query = /* GraphQL */ `
    query FetchLeads {
      evlistings(first: 100, where: { status: PRIVATE, orderby: { field: DATE, order: DESC } }) {
        nodes { id title date content }
      }
    }
  `;
  type LeadNode = { id: string; title: string; date: string; content: string };
  const data = await gql<{ evlistings: { nodes: LeadNode[] } }>(query, {}, { auth: true });
  return data.evlistings.nodes.map((n) => {
    let meta: Record<string, string> = {};
    try { meta = JSON.parse(n.content.replace(/<[^>]+>/g, "").trim()); } catch { /* ignore */ }
    return {
      id: n.id, name: n.title, createdAt: n.date,
      phone: meta.phone ?? "", pincode: meta.pincode ?? "",
      interest: meta.interest ?? "", message: meta.message ?? "",
    };
  });
}

// ── Team auth ─────────────────────────────────────────────────────────────────

export async function verifyWPTeamMember(mobile: string, password: string): Promise<boolean> {
  const envUser = process.env.WP_TEAM_USERNAME;
  const envPass = process.env.WP_TEAM_PASSWORD;
  if (envUser && envPass) return mobile === envUser && password === envPass;

  const mutation = /* GraphQL */ `
    mutation Login($username: String!, $password: String!) {
      login(input: { username: $username, password: $password }) { authToken }
    }
  `;
  try {
    const data = await gql<{ login: { authToken: string } }>(mutation, { username: mobile, password });
    return !!data.login?.authToken;
  } catch { return false; }
}

// ── Hero Banners ──────────────────────────────────────────────────────────────

export type HeroBanner = {
  id: string;
  cta: string;
  href: string;
  details: string;           // ACF details field — shown in info popover
  imageHorizontal: string;
  imageVertical: string;
  accent: string;
};

const BANNER_ACCENTS = [
  "from-sky-600/90 via-sky-500/80 to-cyan-400/80",
  "from-emerald-600/90 via-emerald-500/80 to-lime-400/80",
  "from-violet-600/90 via-fuchsia-500/80 to-pink-400/80",
  "from-amber-600/90 via-orange-500/80 to-rose-400/80",
];

/**
 * Fetch hero banners from the Banner CPT.
 *
 * WP structure (per slide):
 *   - One post with title = CTA label (e.g. "Explore catalog")
 *     → featuredImage  = desktop/horizontal image
 *     → banner.link    = destination URL (ACF field)
 *   - One post with title = "Mobile"
 *     → featuredImage  = mobile/vertical image
 *
 * NOTE: The ACF group is named "Banner" which conflicts with the CPT name,
 * causing a DUPLICATE_TYPE warning in WPGraphQL. Rename the ACF field group
 * to "BannerData" in ACF → Field Groups to resolve this. Until then only
 * the `link` sub-field is accessible via the `banner` field.
 *
 * Falls back to an empty array so the Hero uses its hardcoded slides.
 */
export async function fetchHeroBanners(): Promise<HeroBanner[]> {
  const query = /* GraphQL */ `
    query FetchBanners {
      banners(first: 20, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes {
          id
          title
          bannerfield { link details }
          featuredImage { node { sourceUrl altText } }
        }
      }
    }
  `;

  try {
    type BannerNode = {
      id: string;
      title: string;
      bannerfield: { link: string | null; details: string | null } | null;
      featuredImage: { node: { sourceUrl: string; altText: string } } | null;
    };

    const data = await gql<{ banners: { nodes: BannerNode[] } }>(
      query, {}, { revalidate: 300 }
    );

    const nodes = data.banners.nodes;

    // Separate desktop (non-"Mobile" title) and mobile posts
    const desktop = nodes.filter((n) => n.title.toLowerCase() !== "mobile");
    const mobile = nodes.filter((n) => n.title.toLowerCase() === "mobile");

    if (!desktop.length) return [];

    return desktop.map((d, i): HeroBanner => {
      const mob = mobile[i] ?? null;
      const rawLink = d.bannerfield?.link?.trim() ?? "";
      return {
        id: d.id,
        cta: d.title,
        href: rawLink.startsWith("http") || rawLink.startsWith("/") ? rawLink : "/catalog",
        details: d.bannerfield?.details?.trim() ?? "",
        imageHorizontal: d.featuredImage?.node?.sourceUrl ?? "",
        imageVertical: mob?.featuredImage?.node?.sourceUrl ?? d.featuredImage?.node?.sourceUrl ?? "",
        accent: BANNER_ACCENTS[i % BANNER_ACCENTS.length],
      };
    });
  } catch (err) {
    console.warn("[WP] fetchHeroBanners failed:", err);
    return [];
  }
}
// ── Batched homepage query ────────────────────────────────────────────────────
// Combines evlistings + banners + updates into ONE GraphQL round-trip.

export type HomepageData = {
  listings: EvListing[];
  banners: HeroBanner[];
  updates: WPUpdate[];
};

export async function fetchHomepageData(): Promise<HomepageData> {
  const query = /* GraphQL */ `
    query HomepageData($first: Int!) {
      evlistings(first: $first, where: { status: PUBLISH }) {
        nodes { ${EVLIST_FRAGMENT} }
      }
      banners(first: 20, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes {
          id title
          bannerfield { link details }
          featuredImage { node { sourceUrl altText } }
        }
      }
      updates(first: 3, where: { orderby: { field: DATE, order: DESC } }) {
        nodes { ${UPDATE_FRAGMENT} }
      }
    }
  `;

  type HomepageRaw = {
    evlistings: { nodes: RawEvlistNode[] };
    banners: {
      nodes: Array<{
        id: string;
        title: string;
        bannerfield: { link: string | null; details: string | null } | null;
        featuredImage: { node: { sourceUrl: string; altText: string } } | null;
      }>;
    };
    updates: { nodes: RawUpdateNode[] };
  };

  try {
    const data = await gql<HomepageRaw>(query, { first: 20 }, { revalidate: 300 });

    const listings = data.evlistings.nodes.map(mapEvlistNode);

    const desktopBanners = data.banners.nodes.filter((n) => n.title.toLowerCase() !== "mobile");
    const mobileBanners = data.banners.nodes.filter((n) => n.title.toLowerCase() === "mobile");
    const banners: HeroBanner[] = desktopBanners.map((d, i) => {
      const mob = mobileBanners[i] ?? null;
      const rawLink = d.bannerfield?.link?.trim() ?? "";
      return {
        id: d.id,
        cta: d.title,
        href: rawLink.startsWith("http") || rawLink.startsWith("/") ? rawLink : "/catalog",
        details: d.bannerfield?.details?.trim() ?? "",
        imageHorizontal: d.featuredImage?.node?.sourceUrl ?? "",
        imageVertical: mob?.featuredImage?.node?.sourceUrl ?? d.featuredImage?.node?.sourceUrl ?? "",
        accent: BANNER_ACCENTS[i % BANNER_ACCENTS.length],
      };
    });

    const updates = data.updates.nodes.map(mapUpdateNode);

    return { listings, banners, updates };
  } catch (err) {
    console.warn("[WP] fetchHomepageData failed, falling back:", err);
    // Parallel fallback
    const [listings, banners, updates] = await Promise.all([
      fetchEvListings(20),
      fetchHeroBanners(),
      fetchWPUpdates(3),
    ]);
    return { listings, banners, updates };
  }
}

const OFFER_PAGE_FRAGMENT = /* GraphQL */ `
  id
  databaseId
  title
  offervalue {
    offerdetail
    offerlocation
    offeroption
    offerimage {
      node {
        sourceUrl
      }
    }
  }
`;

type RawOfferPageNode = {
  id: string;
  databaseId: number;
  title: string | null;
  offervalue: {
    offerdetail: string | null;
    offerlocation: string | null;
    offeroption: string[] | null;
    offerimage: {
      node: {
        sourceUrl: string;
      };
    } | null;
  } | null;
};

function mapOfferPageNode(n: RawOfferPageNode): WPOfferPage {
  return {
    id: n.id,
    databaseId: n.databaseId,
    title: n.title || n.offervalue?.offerdetail || "Special Offer",
    detail: n.offervalue?.offerdetail || "",
    location: n.offervalue?.offerlocation || "All Cities",
    options: n.offervalue?.offeroption || [],
    image: n.offervalue?.offerimage?.node?.sourceUrl || "",
  };
}

export async function fetchOfferPages(): Promise<WPOfferPage[]> {
  const query = /* GraphQL */ `
    query FetchOfferPages {
      offerpages(first: 100, where: { status: PUBLISH }) {
        nodes { ${OFFER_PAGE_FRAGMENT} }
      }
    }
  `;
  try {
    const data = await gql<{ offerpages: { nodes: RawOfferPageNode[] } }>(
      query, {}, { revalidate: 60 }
    );
    return data.offerpages.nodes.map(mapOfferPageNode);
  } catch (err) {
    console.warn("[WP] fetchOfferPages failed:", err);
    return [];
  }
}
