/**
 * WooCommerce REST API v3 client
 *
 * WooCommerce uses its own REST API (not WPGraphQL) for product data.
 * Authentication uses Consumer Key + Secret via query params (safe over HTTPS).
 *
 * Required env vars:
 *   WC_BASE_URL          e.g. https://evplse.online
 *   WC_CONSUMER_KEY      wc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   WC_CONSUMER_SECRET   cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * Optional:
 *   NEXT_PUBLIC_WC_STORE_URL   Public store URL shown as "Visit full store" link
 *
 * Generate keys: WP Admin → WooCommerce → Settings → Advanced → REST API → Add key
 * Permission needed: Read
 */

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder";
  short_description: string;
  description: string;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  attributes: { name: string; options: string[] }[];
};

export type WooCategory = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

// ── Config ────────────────────────────────────────────────────────────────────

function wcBase(): string {
  return (process.env.WC_BASE_URL ?? "").replace(/\/$/, "");
}

function wcAuth(): URLSearchParams {
  return new URLSearchParams({
    consumer_key:    process.env.WC_CONSUMER_KEY    ?? "",
    consumer_secret: process.env.WC_CONSUMER_SECRET ?? "",
  });
}

export function wcEnabled(): boolean {
  return !!(
    process.env.WC_BASE_URL &&
    process.env.WC_CONSUMER_KEY &&
    process.env.WC_CONSUMER_SECRET
  );
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function wcFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!wcEnabled()) return null;

  const auth = wcAuth();
  Object.entries(params).forEach(([k, v]) => auth.set(k, v));

  const url = `${wcBase()}/wp-json/wc/v3/${path}?${auth.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`[WooCommerce] ${path} → HTTP ${res.status}`);
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[WooCommerce] ${path} fetch error:`, err);
    return null;
  }
}

// ── Products ──────────────────────────────────────────────────────────────────

/**
 * Fetch published products. Returns null when WC is not configured.
 */
export async function fetchWooProducts(
  perPage = 20,
  page = 1,
  categorySlug?: string
): Promise<WooProduct[] | null> {
  const params: Record<string, string> = {
    per_page: String(perPage),
    page:     String(page),
    status:   "publish",
  };
  if (categorySlug) params.category = categorySlug;

  return wcFetch<WooProduct[]>("products", params);
}

/**
 * Fetch a single product by ID.
 */
export async function fetchWooProduct(id: number): Promise<WooProduct | null> {
  return wcFetch<WooProduct>(`products/${id}`);
}

/**
 * Fetch all product categories.
 */
export async function fetchWooCategories(): Promise<WooCategory[] | null> {
  return wcFetch<WooCategory[]>("products/categories", {
    per_page: "100",
    hide_empty: "true",
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format WC price string to Indian locale */
export function formatWooPrice(price: string): string {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  return `₹${n.toLocaleString("en-IN")}`;
}
