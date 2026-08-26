import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Creates a Razorpay Subscription (UPI Autopay mandate) for the signed-in user.
// The customer authorises it once in Checkout; Razorpay then auto-charges
// ₹249 every month and fires a `subscription.charged` webhook each time.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const planId = process.env.RAZORPAY_PLAN_ID;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 500 });
  }
  if (!planId) {
    return NextResponse.json(
      { error: "Autopay is not set up yet. Please try again shortly." },
      { status: 500 },
    );
  }

  // Guard against creating a second mandate for someone who already has one
  // active — otherwise they'd be charged twice a month.
  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true },
  });
  if (existing?.subscriptionStatus === "active" || existing?.subscriptionStatus === "authenticated") {
    return NextResponse.json(
      { error: "Autopay is already active on your account." },
      { status: 409 },
    );
  }

  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
    },
    body: JSON.stringify({
      plan_id: planId,
      total_count: 120, // up to 120 monthly cycles (~10 yrs); cancel ends it early
      quantity: 1,
      customer_notify: 1,
      notes: { userId: session.user.id },
    }),
  });

  const sub = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: sub?.error?.description ?? "Could not start autopay setup" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { razorpaySubscriptionId: sub.id, subscriptionStatus: sub.status ?? "created" },
  });

  return NextResponse.json({ subscriptionId: sub.id, keyId });
}
