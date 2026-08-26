import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { grantCycle } from "@/lib/subscription";

// Razorpay calls this directly. For autopay it fires `subscription.charged`
// every month, so access is granted reliably even if the payer closed the tab
// before the client verify step ran, and every renewal is picked up here.
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const type: string = event?.event ?? "";

  // Monthly autopay charge (and the first one) → grant a 30-day cycle.
  if (type === "subscription.charged") {
    const sub = event?.payload?.subscription?.entity;
    const payment = event?.payload?.payment?.entity;
    const userId: string | undefined = sub?.notes?.userId;
    const paymentId: string | undefined = payment?.id;
    if (userId && paymentId) {
      await grantCycle(userId, paymentId); // idempotent across retries
    }
  }

  // Mandate lifecycle → keep our status in sync. Access still runs out
  // naturally when paidUntil lapses, so we don't touch paidUntil here.
  else if (
    type === "subscription.cancelled" ||
    type === "subscription.halted" ||
    type === "subscription.completed" ||
    type === "subscription.activated"
  ) {
    const sub = event?.payload?.subscription?.entity;
    const userId: string | undefined = sub?.notes?.userId;
    const status = type.split(".")[1]; // cancelled | halted | completed | activated
    if (userId) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { subscriptionStatus: status },
      });
    }
  }

  // Legacy one-time payments (kept for backward compatibility).
  else if (type === "payment.captured") {
    const payment = event?.payload?.payment?.entity;
    const userId: string | undefined = payment?.notes?.userId;
    const paymentId: string | undefined = payment?.id;
    // Only handle standalone order payments here; subscription charges arrive
    // via subscription.charged above (and carry no userId in payment.notes).
    if (userId && paymentId) {
      await grantCycle(userId, paymentId);
    }
  }

  return NextResponse.json({ ok: true });
}
