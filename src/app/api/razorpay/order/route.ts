import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PRICE_INR } from "@/lib/subscription";

// Creates a Razorpay order for the monthly subscription amount.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 500 });
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: PRICE_INR * 100, // paise
      currency: "INR",
      notes: { userId: session.user.id },
    }),
  });

  const order = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: order?.error?.description ?? "Could not start payment" }, { status: 400 });
  }

  return NextResponse.json({ orderId: order.id, amount: order.amount, keyId, userId: session.user.id });
}
