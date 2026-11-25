import { NextResponse } from "next/server";
import {
  getShopProductBySlug,
  mapRowToShopProduct,
  normalizeShopProductPayload,
  slugifyShopProduct,
} from "../../../../lib/shop";
import { supabaseEnabled, supabaseAsUser, bearerToken } from "../../../../lib/supabase";

// GET /api/shop/products/[id] → public product detail (id or slug)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await getShopProductBySlug(id);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

// PUT /api/shop/products/[id] → update (team only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Product was not updated." },
        { status: 503 }
      );
    }

    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to update a product." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const payload = normalizeShopProductPayload(body);
    if (typeof payload.name === "string" && !payload.name) {
      return NextResponse.json({ ok: false, error: "Product name cannot be empty." }, { status: 400 });
    }
    if (typeof payload.slug === "string" && payload.slug) {
      payload.slug = slugifyShopProduct(payload.slug);
    }

    const { data, error } = await db
      .from("shop_products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[API shop products PUT] Update failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: mapRowToShopProduct(data) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

// DELETE /api/shop/products/[id] → delete (team only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Product was not deleted." },
        { status: 503 }
      );
    }

    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to delete a product." },
        { status: 401 }
      );
    }

    const { error } = await db.from("shop_products").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Product deleted." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
