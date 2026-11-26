import { supabase, supabaseEnabled } from "./supabase";

// ── Types ────────────────────────────────────────────────────────────────────

export type ShopProductType = "accessory" | "vehicle" | "spare_part" | "merch";

export const SHOP_PRODUCT_TYPES: { value: ShopProductType; label: string; hint: string }[] = [
  { value: "accessory", label: "Accessory", hint: "Generic EV accessory (chargers, mats, dashcams…)" },
  { value: "vehicle", label: "Vehicle", hint: "An actual EV sold through the shop" },
  { value: "spare_part", label: "Spare part", hint: "Model-specific part (mirrors, brake pads…)" },
  { value: "merch", label: "Merch", hint: "Branded apparel / merchandise" },
];

export const SHOP_PRODUCT_TYPE_LABEL: Record<ShopProductType, string> = {
  accessory: "Accessory",
  vehicle: "Vehicle",
  spare_part: "Spare part",
  merch: "Merch",
};

export const SHOP_ORDER_STATUSES = [
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type ShopOrderStatus = (typeof SHOP_ORDER_STATUSES)[number];

export interface ShopSpec {
  label: string;
  value: string;
}

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  product_type: ShopProductType;
  category: string;
  brand: string;
  vehicle_model: string;
  vehicle_slug: string;
  price: number;
  mrp: number | null;
  sku: string;
  stock: number;
  image: string;
  gallery_images: string[];
  specs: ShopSpec[];
  highlights: string[];
  is_active: boolean;
  featured: boolean;
  cod_available: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopOrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface ShopOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: ShopOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  status: ShopOrderStatus;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeJson<T>(val: unknown, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === "object") return val as T;
  try {
    return JSON.parse(String(val)) as T;
  } catch {
    return fallback;
  }
}

export function slugifyShopProduct(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

export function formatShopPrice(amount: number): string {
  return `₹${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;
}

// e.g. EVP-8F2K4Q
export function generateShopOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `EVP-${stamp}${rand}`;
}

export function mapRowToShopProduct(row: Record<string, unknown>): ShopProduct {
  const type = String(row.product_type || "accessory") as ShopProductType;
  return {
    id: String(row.id),
    slug: String(row.slug || ""),
    name: String(row.name || ""),
    description: String(row.description || ""),
    product_type: SHOP_PRODUCT_TYPE_LABEL[type] ? type : "accessory",
    category: String(row.category || "Accessories"),
    brand: String(row.brand || ""),
    vehicle_model: String(row.vehicle_model || ""),
    vehicle_slug: String(row.vehicle_slug || ""),
    price: Number(row.price) || 0,
    mrp: row.mrp === null || row.mrp === undefined ? null : Number(row.mrp),
    sku: String(row.sku || ""),
    stock: Number(row.stock) || 0,
    image: String(row.image || ""),
    gallery_images: safeJson<string[]>(row.gallery_images, []).filter(Boolean),
    specs: safeJson<ShopSpec[]>(row.specs, []).filter((s) => s && s.label),
    highlights: Array.isArray(row.highlights) ? (row.highlights as string[]) : [],
    is_active: row.is_active !== false,
    featured: Boolean(row.featured),
    cod_available: row.cod_available !== false,
    sort_order: Number(row.sort_order) || 0,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export function mapRowToShopOrder(row: Record<string, unknown>): ShopOrder {
  return {
    id: String(row.id),
    order_number: String(row.order_number || ""),
    customer_name: String(row.customer_name || ""),
    customer_phone: String(row.customer_phone || ""),
    customer_email: String(row.customer_email || ""),
    address: String(row.address || ""),
    city: String(row.city || ""),
    state: String(row.state || ""),
    pincode: String(row.pincode || ""),
    items: safeJson<ShopOrderItem[]>(row.items, []),
    subtotal: Number(row.subtotal) || 0,
    shipping: Number(row.shipping) || 0,
    total: Number(row.total) || 0,
    payment_method: String(row.payment_method || "cod"),
    status: (String(row.status || "placed") as ShopOrderStatus),
    notes: String(row.notes || ""),
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

// ── Reads (public, anon client) ──────────────────────────────────────────────

export async function getShopProducts(): Promise<ShopProduct[]> {
  if (!supabaseEnabled()) return [];
  try {
    const { data, error } = await supabase
      .from("shop_products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToShopProduct);
  } catch (e) {
    console.warn("[Shop] Could not load products:", e);
    return [];
  }
}

/** Active shop products assigned to an EV model page in Team Shop. */
export async function getShopProductsForVehicleSlug(vehicleSlug: string): Promise<ShopProduct[]> {
  if (!supabaseEnabled()) return [];

  const cleanSlug = decodeURIComponent(vehicleSlug)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^product\//i, "");
  if (!cleanSlug) return [];

  try {
    const { data, error } = await supabase
      .from("shop_products")
      .select("*")
      .eq("is_active", true)
      .ilike("vehicle_slug", cleanSlug)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToShopProduct);
  } catch (e) {
    console.warn("[Shop] Could not load model-specific products:", e);
    return [];
  }
}

export async function getShopProductBySlug(slugOrId: string): Promise<ShopProduct | null> {
  if (!supabaseEnabled()) return null;
  const clean = decodeURIComponent(slugOrId).trim();
  if (!clean) return null;
  try {
    const { data, error } = await supabase
      .from("shop_products")
      .select("*")
      .or(`slug.eq.${clean},id.eq.${clean}`)
      .maybeSingle();

    if (!error && data) return mapRowToShopProduct(data);
  } catch (e) {
    console.warn("[Shop] Could not load product:", e);
  }
  return null;
}

// ── Product payload normalisation (shared by API routes) ─────────────────────

const PRODUCT_FIELDS = [
  "name", "description", "product_type", "category", "brand",
  "vehicle_model", "vehicle_slug", "price", "mrp", "sku", "stock",
  "image", "gallery_images", "specs", "highlights", "is_active",
  "featured", "cod_available", "sort_order", "slug",
] as const;

const NUMERIC_FIELDS = new Set(["price", "mrp", "stock", "sort_order"]);

export function normalizeShopProductPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  for (const key of PRODUCT_FIELDS) {
    if (!(key in body)) continue;
    const value = body[key];
    if (key === "mrp") {
      payload[key] = value === null || value === "" || value === undefined ? null : Number(value);
    } else if (NUMERIC_FIELDS.has(key)) {
      payload[key] = Number(value) || 0;
    } else if (key === "is_active" || key === "featured" || key === "cod_available") {
      payload[key] = Boolean(value);
    } else if (key === "highlights") {
      payload[key] = Array.isArray(value) ? value : [];
    } else if (key === "gallery_images") {
      payload[key] = Array.isArray(value) ? value : [];
    } else if (key === "specs") {
      payload[key] = Array.isArray(value)
        ? (value as ShopSpec[]).filter((s) => s && s.label && s.value)
        : [];
    } else {
      payload[key] = value;
    }
  }

  if (typeof payload.name === "string") payload.name = payload.name.trim();
  if (typeof payload.brand === "string") payload.brand = payload.brand.trim();
  if (typeof payload.slug === "string" && payload.slug.trim()) {
    payload.slug = slugifyShopProduct(payload.slug);
  }

  return payload;
}
