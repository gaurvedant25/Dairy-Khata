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

  // Wipe existing entries for this date so re-saving overwrites cleanly.
  await prisma.deliveryEntry.deleteMany({
    where: { customerId: { in: [...ownedIds] }, date: { gte: dayStart, lt: dayEnd } },
  });

  const toCreate = customers
    .filter((c) => ownedIds.has(c.customerId))
    .flatMap((c) =>
      c.lines
        .filter((l) => l.quantity > 0)
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

  if (toCreate.length > 0) {
    await prisma.deliveryEntry.createMany({ data: toCreate });
  }

  return NextResponse.json({ ok: true, count: toCreate.length });
}
