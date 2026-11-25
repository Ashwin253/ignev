import { NextResponse } from "next/server";
import { SHOP_ORDER_STATUSES, mapRowToShopOrder, type ShopOrderStatus } from "../../../../lib/shop";
import { supabaseEnabled, supabaseAsUser, bearerToken } from "../../../../lib/supabase";

// PATCH /api/shop/orders/[id] → update fulfilment status / notes (team only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Order was not updated." },
        { status: 503 }
      );
    }

    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to update an order." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { status?: string; notes?: string };
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!SHOP_ORDER_STATUSES.includes(body.status as ShopOrderStatus)) {
        return NextResponse.json({ ok: false, error: "Unknown order status." }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.notes !== undefined) updates.notes = String(body.notes);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400 });
    }

    const { data, error } = await db
      .from("shop_orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[API shop orders PATCH] Update failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: mapRowToShopOrder(data) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

// DELETE /api/shop/orders/[id] → remove an order (team only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!supabaseEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured. Order was not deleted." },
        { status: 503 }
      );
    }

    const db = supabaseAsUser(bearerToken(req) || "");
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to the team dashboard to delete an order." },
        { status: 401 }
      );
    }

    const { error } = await db.from("shop_orders").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Order deleted." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
