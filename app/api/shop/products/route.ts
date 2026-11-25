import { NextResponse } from "next/server";
import {
  getShopProducts,
  mapRowToShopProduct,
  normalizeShopProductPayload,
  slugifyShopProduct,
} from "../../../lib/shop";
import { supabaseEnabled, supabaseAsUser, bearerToken } from "../../../lib/supabase";

// GET /api/shop/products            → active products (public)
// GET /api/shop/products?all=1      → every product, including hidden (team only)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wantsAll = searchParams.get("all") === "1";

    if (wantsAll) {
      const token = bearerToken(req);
      const db = token ? supabaseAsUser(token) : null;
      if (!db) {
        return NextResponse.json(
          { ok: false, error: "Sign in to the team dashboard to view all products." },
          { status: 401 }
        );
      }
      const { data, error } = await db
        .from("shop_products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ ok: true, data: (data || []).map(mapRowToShopProduct) });
    }

    const products = await getShopProducts();
    return NextResponse.json({ ok: true, data: products });
  } catch (error) {
    console.error("[API shop products GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

// POST /api/shop/products → create a product (team only)
export async function POST(req: Request) {
  try {
    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Product was not saved." },
        { status: 503 }
      );
    }

    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to add a product." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ ok: false, error: "Product name is required." }, { status: 400 });
    }
    if (body.price === undefined || Number(body.price) <= 0) {
      return NextResponse.json({ ok: false, error: "A price greater than zero is required." }, { status: 400 });
    }

    const payload = normalizeShopProductPayload(body);
    payload.slug =
      (typeof payload.slug === "string" && payload.slug) || slugifyShopProduct(String(body.name));
    if (!payload.slug) payload.slug = `product-${Date.now()}`;

    let { data, error } = await db.from("shop_products").insert(payload).select().single();

    // Slug collision → retry once with a short random suffix.
    if (error && (error.code === "23505" || /duplicate key/i.test(error.message))) {
      payload.slug = `${payload.slug}-${Math.random().toString(36).slice(2, 6)}`;
      ({ data, error } = await db.from("shop_products").insert(payload).select().single());
    }

    if (error) {
      console.error("[API shop products POST] Insert failed:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: mapRowToShopProduct(data) });
  } catch (error) {
    console.error("[API shop products POST] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
