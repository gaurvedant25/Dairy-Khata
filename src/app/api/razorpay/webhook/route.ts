import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Razorpay calls this directly when a payment is captured, so access is
// granted reliably even if the payer closed the tab before the client
// verify step ran.
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

  if (event?.event === "payment.captured") {
    const payment = event?.payload?.payment?.entity;
    const userId: string | undefined = payment?.notes?.userId;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { paidUntil: true } });
      if (user) {
        const now = new Date();
        const base = user.paidUntil && user.paidUntil > now ? user.paidUntil : now;
        const paidUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.user.update({ where: { id: userId }, data: { paidUntil } });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
