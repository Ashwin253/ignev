/**
 * WooCommerce REST API client
 *
 * Set these env vars to enable WooCommerce:
 *   WC_BASE_URL        e.g. https://yourstore.com
 *   WC_CONSUMER_KEY    wc_...
 *   WC_CONSUMER_SECRET cs_...
 *
 * When the vars are absent the shop falls back to the local product list.
 */

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;          // WC returns price as a string
  regular_price: string;
  sale_price: string;
  short_description: string;
  description: string;
  images: { src: string; alt: string }[];
  permalink: string;
  stock_status: "instock" | "outofstock" | "onbackorder";
};

function wcEnabled() {
  return !!(
    process.env.WC_BASE_URL &&
    process.env.WC_CONSUMER_KEY &&
    process.env.WC_CONSUMER_SECRET
  );
}

function wcAuthParams() {
  return new URLSearchParams({
    consumer_key: process.env.WC_CONSUMER_KEY ?? "",
    consumer_secret: process.env.WC_CONSUMER_SECRET ?? "",
  });
}

/**
 * Fetch products from WooCommerce REST API v3.
 * Returns null when WC is not configured so the caller can fall back.
 */
export async function fetchWooProducts(
  perPage = 20,
  page = 1
): Promise<WooProduct[] | null> {
  if (!wcEnabled()) return null;

  const base = process.env.WC_BASE_URL!.replace(/\/$/, "");
  const params = wcAuthParams();
  params.set("per_page", String(perPage));
  params.set("page", String(page));
  params.set("status", "publish");

  const url = `${base}/wp-json/wc/v3/products?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 60 }, // ISR — refresh every 60 s
  });

  if (!res.ok) {
    console.error(`[WooCommerce] Failed to fetch products: ${res.status}`);
    return null;
  }

  return res.json() as Promise<WooProduct[]>;
}

/**
 * Fetch a single WooCommerce product by ID.
 */
export async function fetchWooProduct(id: number): Promise<WooProduct | null> {
  if (!wcEnabled()) return null;

  const base = process.env.WC_BASE_URL!.replace(/\/$/, "");
  const params = wcAuthParams();

  const url = `${base}/wp-json/wc/v3/products/${id}?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;

  return res.json() as Promise<WooProduct>;
}

export { wcEnabled };
