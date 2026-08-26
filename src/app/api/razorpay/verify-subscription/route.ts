import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { grantCycle } from "@/lib/subscription";

// Verifies the autopay mandate authorisation returned by Checkout.
// For Subscriptions, the signature is HMAC(payment_id|subscription_id).
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Payments not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body ?? {};
  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Grant the first cycle now (idempotent — the subscription.charged webhook
  // for this same payment won't double-count it).
  await grantCycle(session.user.id, razorpay_payment_id);

  return NextResponse.json({ ok: true });
}
