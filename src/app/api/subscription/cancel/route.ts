import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cancels autopay: tells Razorpay to stop future monthly debits. The user keeps
// access until the period they've already paid for (paidUntil) runs out.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { razorpaySubscriptionId: true },
  });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (user?.razorpaySubscriptionId && keyId && keySecret) {
    // cancel_at_cycle_end: 0 → stop immediately (no further debits).
    const res = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${user.razorpaySubscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
        },
        body: JSON.stringify({ cancel_at_cycle_end: 0 }),
      },
    );
    // If Razorpay says it's already cancelled/expired, treat as success.
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const desc: string = err?.error?.description ?? "";
      if (!/cancel|already|not.*active/i.test(desc)) {
        return NextResponse.json({ error: desc || "Could not cancel autopay" }, { status: 400 });
      }
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { subscriptionStatus: "cancelled", razorpaySubscriptionId: null },
  });

  return NextResponse.json({ ok: true });
}
