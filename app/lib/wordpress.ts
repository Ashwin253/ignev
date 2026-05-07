/**
 * WordPress GraphQL client — https://evplse.online/graphql
 *
 * Confirmed schema (introspected live):
 *
 * evlistings → Evlisting
 *   evlist (ACF): brand, type[],  price[], batteryCapacity(Float),
 *                 chargingSpeed(Float), realWorldRange(Float), launchdate(String|null),
 *                 proone, protwo, prothree, conone, contwo, conthree
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
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
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
  // ACF evlist fields
  brand: string;
  types: string[];          // e.g. ["4 wheeler"]
  prices: string[];         // e.g. ["10-15"]
  batteryCapacity: number | null;
  chargingSpeed: number | null;
  realWorldRange: number | null;
  topSpeed: number | null;
  commercial: boolean;
  launchdate: string | null;
  pros: string[];           // up to 3, nulls filtered out
  cons: string[];           // up to 3, nulls filtered out
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

// ── Raw ACF node type ─────────────────────────────────────────────────────────

type RawEvlistNode = {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  featuredImage: { node: { sourceUrl: string } } | null;
  evlist: {
    brand: string | null;
    type: string[] | null;
    price: string[] | null;
    batteryCapacity: number | null;
    chargingSpeed: number | null;
    realWorldRange: number | null;
    topSpeed: number | null;
    commercial: boolean | null;
    launchdate: string | null;
    proone: string | null;
    protwo: string | null;
    prothree: string | null;
    conone: string | null;
    contwo: string | null;
    conthree: string | null;
  } | null;
};

const EVLIST_FRAGMENT = /* GraphQL */ `
  id
  databaseId
  title
  slug
  date
  featuredImage { node { sourceUrl } }
  evlist {
    brand
    type
    price
    batteryCapacity
    chargingSpeed
    realWorldRange
    topSpeed
    commercial
    launchdate
    proone
    protwo
    prothree
    conone
    contwo
    conthree
  }
`;

function mapEvlistNode(n: RawEvlistNode): EvListing {
  const e = n.evlist;
  return {
    id: n.id,
    databaseId: n.databaseId,
    title: n.title,
    slug: n.slug,
    date: n.date,
    photo: n.featuredImage?.node?.sourceUrl ?? "",
    brand: e?.brand ?? "",
    types: e?.type ?? [],
    prices: e?.price ?? [],
    batteryCapacity: e?.batteryCapacity ?? null,
    chargingSpeed: e?.chargingSpeed ?? null,
    realWorldRange: e?.realWorldRange ?? null,
    topSpeed: e?.topSpeed ?? null,
    commercial: e?.commercial ?? false,
    launchdate: e?.launchdate ?? null,
    pros: [e?.proone, e?.protwo, e?.prothree].filter(Boolean) as string[],
    cons: [e?.conone, e?.contwo, e?.conthree].filter(Boolean) as string[],
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

// ── Updates ───────────────────────────────────────────────────────────────────

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
  cta: string;           // post title → button label
  href: string;          // post content (stripped) → link URL, fallback "/catalog"
  imageHorizontal: string; // featured image of the "Banner" post
  imageVertical: string;   // featured image of the "Mobile" post
  accent: string;          // colour gradient — cycled from a preset list
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
          banner { link }
          featuredImage { node { sourceUrl altText } }
        }
      }
    }
  `;

  try {
    type BannerNode = {
      id: string;
      title: string;
      banner: { link: string | null } | null;
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
      const rawLink = d.banner?.link?.trim() ?? "";
      return {
        id:              d.id,
        cta:             d.title,
        href:            rawLink.startsWith("http") || rawLink.startsWith("/") ? rawLink : "/catalog",
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
