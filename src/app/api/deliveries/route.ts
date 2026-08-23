import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deliveryBatchSchema } from "@/lib/validation";
import { getOrCreateSetting } from "@/lib/business";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  if (!dateParam) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const day = new Date(dateParam);
  if (Number.isNaN(day.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const entries = await prisma.deliveryEntry.findMany({
    where: {
      customer: { userId: session.user.id },
      date: { gte: dayStart, lt: dayEnd },
    },
    select: { customerId: true, quantity: true },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = deliveryBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { date, entries } = parsed.data;
  const day = new Date(date);
  if (Number.isNaN(day.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const setting = await getOrCreateSetting(session.user.id);
  const customerIds = entries.map((e) => e.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds }, userId: session.user.id },
  });
  const byId = new Map(customers.map((c) => [c.id, c]));

  // Wipe existing entries for this date so re-saving overwrites cleanly.
  await prisma.deliveryEntry.deleteMany({
    where: {
      customerId: { in: customerIds },
      date: { gte: dayStart, lt: dayEnd },
    },
  });

  const toCreate = entries
    .filter((e) => byId.has(e.customerId) && e.quantity > 0)
    .map((e) => {
      const c = byId.get(e.customerId)!;
      return {
        customerId: e.customerId,
        date: dayStart,
        quantity: e.quantity,
        pricePerUnit: c.defaultPricePerUnit ?? setting.defaultPricePerUnit,
        costPerUnit: setting.defaultCostPerUnit,
      };
    });

  if (toCreate.length > 0) {
    await prisma.deliveryEntry.createMany({ data: toCreate });
  }

  return NextResponse.json({ ok: true, count: toCreate.length });
}
