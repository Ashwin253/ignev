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

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: { auth?: boolean; revalidate?: number } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth) {
    const auth = authHeader();
    if (auth) headers["Authorization"] = auth;
  }

  const res = await fetch(gqlEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: options.revalidate !== undefined
      ? { revalidate: options.revalidate }
      : { revalidate: 60 },   // default ISR — never block static builds
  });

  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as GQLResponse<T>;
  if (json.errors?.length) throw new Error(`GraphQL: ${json.errors.map((e) => e.message).join(", ")}`);
  if (!json.data) throw new Error("GraphQL returned no data.");
  return json.data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format launchdate:
 *   null / empty  → "Available Now"
 *   ISO string    → "May 2026"
 */
export function formatLaunchDate(launchdate: string | null | undefined): string {
  if (!launchdate) return "Available Now";
  const d = new Date(launchdate);
  if (isNaN(d.getTime())) return "Available Now";
  return d <= new Date() ? "Available Now" : "Coming Soon";
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
  pros: string[];
  cons: string[];
  colors: string[];           // hex codes e.g. ["673ab7", "b7673a"]
  galleryImages: string[];    // full image URLs
  offers: EVOffer[];
  // Legacy / optional
  batteryCapacity?: number | null;
  chargingSpeed?: number | null;
  realWorldRange?: number | null;
  batteryTypes: string[];
};

export type BatteryVariant = {
  capacity: string;   // kWh
  range: string;      // km
  charge: string;     // hours
  price?: string;     // Lakhs
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
  proPoint:        string | null;
  conpoint:        string | null;
  colorTestText:   string | null;
  galleryImages:   string | null;
  evlist: {
    brand: string | null;
    type: string[] | null;
    price: string[] | null;
    topSpeed: number | null;
    commercial: boolean | null;
    launchdate: string | null;
  } | null;
};

// Safe JSON parse helper
function parseJsonArray<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw !== "string") return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

const EVLIST_FRAGMENT = /* GraphQL */ `
  id
  databaseId
  title
  slug
  date
  featuredImage { node { sourceUrl } }
  batteryVariants
  proPoint
  conpoint
  colorTestText
  galleryImages
  evlist {
    brand
    type
    price
    topSpeed
    commercial
    launchdate
  }
`;

function mapEvlistNode(n: RawEvlistNode): EvListing {
  const e = n.evlist;
  return {
    id:             n.id,
    databaseId:     n.databaseId,
    title:          n.title.trim(),
    slug:           n.slug,
    date:           n.date,
    photo:          n.featuredImage?.node?.sourceUrl ?? "",
    brand:          e?.brand ?? "",
    types:          e?.type ?? [],
    prices:         e?.price ?? [],
    topSpeed:       e?.topSpeed ?? null,
    commercial:     e?.commercial ?? false,
    launchdate:     e?.launchdate ?? null,
    batteryVariants: parseJsonArray<BatteryVariant>(n.batteryVariants),
    pros:           parseJsonArray<string>(n.proPoint),
    cons:           parseJsonArray<string>(n.conpoint),
    colors:         parseJsonArray<string>(n.colorTestText),
    galleryImages:  parseJsonArray<string>(n.galleryImages),
    offers:         [],
    batteryTypes:   [],
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
    return data.evlisting ? mapEvlistNode(data.evlisting) : null;
  } catch (err) {
    console.warn("[WP] fetchEvListingBySlug failed:", err);
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

function mapRestListing(p: RestEvlisting): EvListing {
  const m = p.meta ?? {};

  // Helper to safely get string/array from meta
  const str  = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : "");
  const arr  = (k: string): string[] => Array.isArray(m[k]) ? (m[k] as string[]) : (str(k) ? [str(k)] : []);
  const num  = (k: string): number | null => { const v = parseFloat(String(m[k] ?? "")); return isNaN(v) ? null : v; };
  const bool = (k: string): boolean => m[k] === true || m[k] === "1" || m[k] === "true";

  const photo = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";

  return {
    id:             String(p.id),
    databaseId:     p.id,
    title:          p.title.rendered.trim(),
    slug:           p.slug,
    date:           p.date,
    photo,
    brand:          str("brand"),
    types:          arr("type"),
    prices:         arr("price"),
    topSpeed:       num("top_speed") ?? num("topSpeed"),
    commercial:     bool("commercial"),
    launchdate:     str("launchdate") || null,
    batteryCapacity: num("battery_capacity") ?? num("batteryCapacity"),
    chargingSpeed:  num("charging_speed") ?? num("chargingSpeed"),
    realWorldRange: num("real_world_range") ?? num("realWorldRange"),
    batteryTypes:   arr("battery_type"),
    colors:         arr("colors"),
    pros:           [str("proone"), str("protwo"), str("prothree")].filter(Boolean),
    cons:           [str("conone"), str("contwo"), str("conthree")].filter(Boolean),
    batteryVariants: parseJsonArray<BatteryVariant>(str("battery_variants") || str("batteryVariants")),
    galleryImages:  parseJsonArray<string>(str("gallery_images") || str("galleryImages")),
    offers:         parseJsonArray<EVOffer>(str("offervalue") || str("offer_value")),
  };
}

/**
 * Fetch a single evlisting by slug via WP REST API.
 * Returns richer OpenFields meta fields once "Show in REST API" is enabled.
 * Falls back to GraphQL if REST meta is empty.
 */
export async function fetchEvListingBySlugREST(slug: string): Promise<EvListing | null> {
  try {
    const url = `${WP_REST_BASE}/evlisting?slug=${encodeURIComponent(slug)}&_embed&per_page=1`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const posts = await res.json() as RestEvlisting[];
    if (!posts[0]) return null;
    const listing = mapRestListing(posts[0]);
    // If meta is populated (OpenFields REST enabled), use it; otherwise fall back to GraphQL
    if (listing.brand || listing.types.length) return listing;
  } catch { /* fall through */ }
  // Fallback to GraphQL
  return fetchEvListingBySlug(slug);
}

/**
 * Fetch all evlistings via WP REST API (with OpenFields meta).
 * Falls back to GraphQL if meta is empty.
 */
export async function fetchEvListingsREST(perPage = 100): Promise<EvListing[]> {
  try {
    const url = `${WP_REST_BASE}/evlisting?_embed&per_page=${perPage}&status=publish&orderby=date&order=desc`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const posts = await res.json() as RestEvlisting[];
    const listings = posts.map(mapRestListing);
    // If first listing has brand data, REST meta is working
    if (listings[0]?.brand) return listings;
  } catch { /* fall through */ }
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
    const mobile  = nodes.filter((n) => n.title.toLowerCase() === "mobile");

    if (!desktop.length) return [];

    return desktop.map((d, i): HeroBanner => {
      const mob = mobile[i] ?? null;
      const rawLink = d.bannerfield?.link?.trim() ?? "";
      return {
        id:              d.id,
        cta:             d.title,
        href:            rawLink.startsWith("http") || rawLink.startsWith("/") ? rawLink : "/catalog",
        details:         d.bannerfield?.details?.trim() ?? "",
        imageHorizontal: d.featuredImage?.node?.sourceUrl ?? "",
        imageVertical:   mob?.featuredImage?.node?.sourceUrl ?? d.featuredImage?.node?.sourceUrl ?? "",
        accent:          BANNER_ACCENTS[i % BANNER_ACCENTS.length],
      };
    });
  } catch (err) {
    console.warn("[WP] fetchHeroBanners failed:", err);
    return [];
  }
}
// ── Offer Pages ──────────────────────────────────────────────────────────────

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
