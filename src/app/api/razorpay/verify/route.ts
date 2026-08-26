import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Verifies a completed payment and extends the user's paid access by 30 days.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Payments not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Extend from the later of now or the current paid-through date.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { paidUntil: true },
  });
  const now = new Date();
  const base = user?.paidUntil && user.paidUntil > now ? user.paidUntil : now;
  const paidUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.user.update({ where: { id: session.user.id }, data: { paidUntil } });

  return NextResponse.json({ ok: true });
}
