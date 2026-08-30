import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deliveryBatchSchema } from "@/lib/validation";
import { getDeliverySheet } from "@/lib/business";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "Missing or invalid date" }, { status: 400 });
  }

  const customers = await getDeliverySheet(session.user.id, dateParam);
  return NextResponse.json({ customers });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = deliveryBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { date, customers } = parsed.data;
  const [y, m, d] = date.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const customerIds = customers.map((c) => c.customerId);
  const owned = await prisma.customer.findMany({
    where: { id: { in: customerIds }, userId: session.user.id },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((c) => c.id));

  const toCreate = customers
    .filter((c) => ownedIds.has(c.customerId))
    .flatMap((c) =>
      c.lines
        // Zero quantities are kept on purpose: a 0 row records "delivered
        // nothing today", which is different from having no row at all (never
        // visited). Tomorrow's sheet carries the 0 forward instead of
        // resurrecting an older amount.
        .filter((l) => l.product.trim() !== "")
        .map((l) => ({
          customerId: c.customerId,
          date: dayStart,
          product: l.product,
          unit: l.unit,
          quantity: l.quantity,
          pricePerUnit: l.pricePerUnit,
          costPerUnit: l.costPerUnit,
        }))
    );

  // Replace this date's entries atomically. Without the transaction two saves
  // fired close together (a double-tap, or a per-house save racing the bulk
  // one) can both delete before either creates, leaving duplicate rows that
  // double-charge the customer.
  await prisma.$transaction(async (tx) => {
    await tx.deliveryEntry.deleteMany({
      where: { customerId: { in: [...ownedIds] }, date: { gte: dayStart, lt: dayEnd } },
    });
    if (toCreate.length > 0) {
      await tx.deliveryEntry.createMany({ data: toCreate });
    }
  });

  return NextResponse.json({ ok: true, count: toCreate.length });
}
