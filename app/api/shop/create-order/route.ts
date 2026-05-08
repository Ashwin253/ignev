import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

function razorpayEnabled() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

function getRazorpayClient() {
  if (!razorpayEnabled()) return null;
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

export async function POST(req: Request) {
  try {
    const {
      productId,
      productName,
      price,
      customer,
    } = await req.json() as {
      productId: number;
      productName: string;
      price: number;
      customer: { name: string; email: string; phone: string; address: string; city: string; pincode: string; state: string };
    };

    if (!price || !customer?.name || !customer?.phone) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json(
        {
          error: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local.",
        },
        { status: 501 }
      );
    }

    const amountPaise = Math.round(price * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `shop_${productId || Date.now()}`,
      notes: {
        productName,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerCity: customer.city,
      },
    });

    return NextResponse.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[shop/create-order]", err);
    return NextResponse.json({ error: "Failed to create Razorpay order." }, { status: 500 });
  }
}
