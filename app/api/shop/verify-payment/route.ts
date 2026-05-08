import crypto from "crypto";
import { NextResponse } from "next/server";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

export async function POST(req: Request) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json() as {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    };

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay secret key is not configured." }, { status: 501 });
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      paymentId: razorpayPaymentId,
      razorpayOrderId,
    });
  } catch (err) {
    console.error("[shop/verify-payment]", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
