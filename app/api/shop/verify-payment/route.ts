/**
 * POST /api/shop/verify-payment
 *
 * Verifies a Cashfree payment by fetching order status from Cashfree API
 * (server-to-server — cannot be spoofed by the client).
 * On success, marks the WooCommerce order as processing.
 *
 * Body: { cfOrderId: string; wcOrderId: number | null }
 */

import { NextResponse } from "next/server";

const CF_BASE = process.env.CASHFREE_ENV === "production"
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

const CF_VERSION = "2023-08-01";

function cfHeaders() {
  return {
    "x-api-version":   CF_VERSION,
    "x-client-id":     process.env.CASHFREE_APP_ID ?? "",
    "x-client-secret": process.env.CASHFREE_SECRET_KEY ?? "",
  };
}

// ── Fetch Cashfree order status ───────────────────────────────────────────────

async function getCashfreeOrderStatus(cfOrderId: string): Promise<string> {
  const res = await fetch(`${CF_BASE}/orders/${cfOrderId}`, {
    headers: cfHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cashfree get order failed: ${res.status}`);
  const data = await res.json() as { order_status: string };
  return data.order_status; // PAID | ACTIVE | EXPIRED | CANCELLED
}

// ── Get Cashfree payment ID ───────────────────────────────────────────────────

async function getCashfreePaymentId(cfOrderId: string): Promise<string> {
  const res = await fetch(`${CF_BASE}/orders/${cfOrderId}/payments`, {
    headers: cfHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return "";
  const payments = await res.json() as Array<{ cf_payment_id: number; payment_status: string }>;
  const paid = payments.find((p) => p.payment_status === "SUCCESS");
  return paid ? String(paid.cf_payment_id) : "";
}

// ── Mark WC order as processing ───────────────────────────────────────────────

async function markWCOrderProcessing(wcOrderId: number, paymentId: string) {
  const base = (process.env.WC_BASE_URL ?? "").replace(/\/$/, "");
  const key  = process.env.WC_CONSUMER_KEY ?? "";
  const sec  = process.env.WC_CONSUMER_SECRET ?? "";
  if (!base || !key || !sec || !wcOrderId) return;

  const auth = Buffer.from(`${key}:${sec}`).toString("base64");
  await fetch(`${base}/wp-json/wc/v3/orders/${wcOrderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ status: "processing", transaction_id: paymentId, set_paid: true }),
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { cfOrderId, wcOrderId } = await req.json() as {
      cfOrderId: string;
      wcOrderId: number | null;
    };

    if (!cfOrderId) {
      return NextResponse.json({ error: "Missing cfOrderId." }, { status: 400 });
    }

    // Server-side status check — client cannot fake this
    const status = await getCashfreeOrderStatus(cfOrderId);

    if (status !== "PAID") {
      return NextResponse.json({ error: `Payment not completed. Status: ${status}` }, { status: 400 });
    }

    const paymentId = await getCashfreePaymentId(cfOrderId);

    if (wcOrderId) {
      await markWCOrderProcessing(wcOrderId, paymentId);
    }

    return NextResponse.json({ ok: true, paymentId, cfOrderId });
  } catch (err) {
    console.error("[shop/verify-payment]", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
