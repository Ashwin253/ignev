/**
 * POST /api/shop/create-order
 *
 * 1. Creates a WooCommerce order (if WC is configured)
 * 2. Creates a Cashfree order and returns payment_session_id
 *
 * Body: {
 *   productId:   number
 *   productName: string
 *   price:       number   (INR, not paise)
 *   customer: {
 *     name: string; email: string; phone: string
 *     address: string; city: string; pincode: string; state: string
 *   }
 * }
 *
 * Response: {
 *   paymentSessionId: string   → pass to Cashfree JS SDK
 *   cfOrderId:        string   → Cashfree order ID
 *   wcOrderId:        number | null
 * }
 */

import { NextResponse } from "next/server";

const CF_BASE = process.env.CASHFREE_ENV === "production"
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

const CF_VERSION = "2023-08-01";

// ── Cashfree order creation ───────────────────────────────────────────────────

async function createCashfreeOrder(opts: {
  orderId: string;
  amount: number;
  customer: { name: string; email: string; phone: string };
  productName: string;
}) {
  const res = await fetch(`${CF_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CF_VERSION,
      "x-client-id":     process.env.CASHFREE_APP_ID ?? "",
      "x-client-secret": process.env.CASHFREE_SECRET_KEY ?? "",
    },
    body: JSON.stringify({
      order_id:       opts.orderId,
      order_amount:   opts.amount,
      order_currency: "INR",
      order_note:     opts.productName,
      customer_details: {
        customer_id:    opts.customer.phone,   // unique per customer
        customer_name:  opts.customer.name,
        customer_email: opts.customer.email || `${opts.customer.phone}@evpulse.in`,
        customer_phone: opts.customer.phone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/shop?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/shop/webhook`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cashfree create order failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<{
    cf_order_id: string;
    order_id: string;
    payment_session_id: string;
    order_status: string;
  }>;
}

// ── WooCommerce order creation ────────────────────────────────────────────────

async function createWooOrder(opts: {
  productId: number;
  price: number;
  customer: { name: string; email: string; phone: string; address: string; city: string; pincode: string; state: string };
}): Promise<{ id: number } | null> {
  const base = (process.env.WC_BASE_URL ?? "").replace(/\/$/, "");
  const key  = process.env.WC_CONSUMER_KEY ?? "";
  const sec  = process.env.WC_CONSUMER_SECRET ?? "";
  if (!base || !key || !sec) return null;

  const [firstName, ...rest] = opts.customer.name.trim().split(" ");
  const lastName = rest.join(" ") || "-";
  const auth = Buffer.from(`${key}:${sec}`).toString("base64");

  const res = await fetch(`${base}/wp-json/wc/v3/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      payment_method: "cashfree",
      payment_method_title: "Cashfree",
      set_paid: false,
      status: "pending",
      billing: {
        first_name: firstName, last_name: lastName,
        email: opts.customer.email, phone: opts.customer.phone,
        address_1: opts.customer.address, city: opts.customer.city,
        postcode: opts.customer.pincode, state: opts.customer.state, country: "IN",
      },
      shipping: {
        first_name: firstName, last_name: lastName,
        address_1: opts.customer.address, city: opts.customer.city,
        postcode: opts.customer.pincode, state: opts.customer.state, country: "IN",
      },
      line_items: [{ product_id: opts.productId, quantity: 1 }],
    }),
  });

  if (!res.ok) { console.error("[WC] create order failed:", res.status); return null; }
  return res.json() as Promise<{ id: number }>;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { productId, productName, price, customer } = await req.json() as {
      productId: number;
      productName: string;
      price: number;
      customer: { name: string; email: string; phone: string; address: string; city: string; pincode: string; state: string };
    };

    if (!price || !customer?.name || !customer?.phone) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. WooCommerce order (optional)
    const wcOrder = productId ? await createWooOrder({ productId, price, customer }) : null;

    // 2. Cashfree order
    const orderId = wcOrder ? `wc_${wcOrder.id}` : `evp_${Date.now()}`;
    const cfOrder = await createCashfreeOrder({
      orderId,
      amount: price,
      customer,
      productName,
    });

    return NextResponse.json({
      paymentSessionId: cfOrder.payment_session_id,
      cfOrderId:        cfOrder.order_id,
      wcOrderId:        wcOrder?.id ?? null,
    });
  } catch (err) {
    console.error("[shop/create-order]", err);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
