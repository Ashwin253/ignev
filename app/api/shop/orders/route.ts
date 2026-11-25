import { NextResponse } from "next/server";
import {
  generateShopOrderNumber,
  mapRowToShopOrder,
  type ShopOrderItem,
} from "../../../lib/shop";
import { supabase, supabaseEnabled, supabaseAsUser, bearerToken } from "../../../lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type IncomingItem = {
  productId?: string | number;
  name?: string;
  price?: number;
  qty?: number;
  image?: string;
};

type IncomingCustomer = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

// GET /api/shop/orders?status=placed → team order list
export async function GET(req: Request) {
  try {
    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to view orders." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = db.from("shop_orders").select("*").order("created_at", { ascending: false }).limit(300);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, data: (data || []).map(mapRowToShopOrder) });
  } catch (error) {
    console.error("[API shop orders GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

// POST /api/shop/orders → place a cash-on-delivery order (public)
export async function POST(req: Request) {
  try {
    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Orders are temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      items?: IncomingItem[];
      product?: IncomingItem;
      customer?: IncomingCustomer;
      notes?: string;
    };

    const rawItems = Array.isArray(body.items) ? body.items : body.product ? [body.product] : [];
    const customer = body.customer || {};

    if (rawItems.length === 0) {
      return NextResponse.json({ ok: false, error: "Your cart is empty." }, { status: 400 });
    }
    if (!customer.name?.trim() || !customer.phone?.trim()) {
      return NextResponse.json({ ok: false, error: "Name and phone number are required." }, { status: 400 });
    }
    if (!customer.address?.trim() || !customer.city?.trim() || !customer.pincode?.trim()) {
      return NextResponse.json({ ok: false, error: "A complete delivery address is required." }, { status: 400 });
    }

    // Trust the database price for real shop products; fall back to the supplied
    // values only for legacy product ids (e.g. WooCommerce numeric ids).
    const uuidIds = rawItems
      .map((i) => (i.productId === undefined ? "" : String(i.productId)))
      .filter((id) => UUID_RE.test(id));

    const priceById = new Map<string, { name: string; price: number; image: string }>();
    if (uuidIds.length > 0) {
      const { data: rows, error } = await supabase
        .from("shop_products")
        .select("id, name, price, image, is_active")
        .in("id", uuidIds);
      if (error) throw error;
      for (const row of rows || []) {
        if (row.is_active === false) continue;
        priceById.set(String(row.id), {
          name: String(row.name || ""),
          price: Number(row.price) || 0,
          image: String(row.image || ""),
        });
      }
    }

    const items: ShopOrderItem[] = [];
    for (const raw of rawItems) {
      const productId = raw.productId === undefined ? "" : String(raw.productId);
      const fromDb = priceById.get(productId);
      const qty = Math.min(Math.max(Number(raw.qty) || 1, 1), 10);

      if (fromDb) {
        if (fromDb.price <= 0) continue;
        items.push({ productId, name: fromDb.name, price: fromDb.price, qty, image: fromDb.image });
        continue;
      }

      // Legacy path: numeric/unknown ids keep their submitted details.
      const price = Number(raw.price) || 0;
      if (price <= 0 || !raw.name) continue;
      items.push({
        productId: productId || "legacy",
        name: String(raw.name),
        price,
        qty,
        image: raw.image ? String(raw.image) : "",
      });
    }

    if (items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "These products are no longer available." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = 0;
    const total = subtotal + shipping;

    const orderNumber = generateShopOrderNumber();
    const payload = {
      order_number: orderNumber,
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_email: (customer.email || "").trim(),
      address: customer.address.trim(),
      city: customer.city.trim(),
      state: (customer.state || "").trim(),
      pincode: customer.pincode.trim(),
      items,
      subtotal,
      shipping,
      total,
      payment_method: "cod",
      status: "placed",
      notes: (body.notes || "").trim(),
    };

    // Insert without `.select()`: PostgREST's RETURNING clause needs a SELECT
    // policy, and anonymous customers intentionally cannot read orders back.
    const { error } = await supabase.from("shop_orders").insert(payload);
    if (error) {
      console.error("[API shop orders POST] Insert failed:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      order: {
        order_number: orderNumber,
        total,
        status: "placed",
      },
    });
  } catch (error) {
    console.error("[API shop orders POST] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not place the order." },
      { status: 500 }
    );
  }
}
