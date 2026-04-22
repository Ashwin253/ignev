import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    // WARNING: In production, never expose your key_secret in client or logs.
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
    });

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise for INR)
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: "Failed to create order. Please configure Razorpay keys in .env.local" }, { status: 500 });
  }
}
