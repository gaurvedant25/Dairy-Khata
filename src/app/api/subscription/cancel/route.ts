import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cancels the subscription: ends paid access and the trial immediately.
// (When Razorpay is connected, this will also cancel the recurring plan there.)
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { paidUntil: null, trialEndsAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
