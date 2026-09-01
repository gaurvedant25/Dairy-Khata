import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customProductSchema } from "@/lib/validation";
import { customRate } from "@/lib/business";
import { istParts } from "@/lib/date";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;
  const existing = await prisma.customProduct.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = customProductSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const newPrice = parsed.data.pricePerUnit;
  const priceChanged = newPrice !== undefined && newPrice !== existing.pricePerUnit;

  const product = await prisma.customProduct.update({ where: { id }, data: parsed.data });

  // When the standard rate changes, re-price this month's deliveries for
  // customers who follow the standard — i.e. everyone WITHOUT a custom rate for
  // this product. Custom-rate customers keep their own price.
  let repriced = 0;
  if (priceChanged) {
    const customers = await prisma.customer.findMany({
      where: { userId },
      select: { id: true, customRates: true },
    });
    const customRateCustomerIds = customers
      .filter((c) => customRate(c.customRates, existing.name) !== undefined)
      .map((c) => c.id);

    const { y, m } = istParts();
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 1);

    const res = await prisma.deliveryEntry.updateMany({
      where: {
        product: existing.name,
        date: { gte: monthStart, lt: monthEnd },
        customer: { userId },
        customerId: { notIn: customRateCustomerIds },
      },
      data: { pricePerUnit: newPrice },
    });
    repriced = res.count;
  }

  return NextResponse.json({ ...product, repriced });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.customProduct.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.customProduct.delete({ where: { id } });

  // Drop the deleted item from the starred list so it stops showing on the dashboard.
  const setting = await prisma.setting.findUnique({ where: { userId: session.user.id } });
  if (setting && setting.starredProducts.includes(existing.name)) {
    await prisma.setting.update({
      where: { userId: session.user.id },
      data: { starredProducts: setting.starredProducts.filter((n) => n !== existing.name) },
    });
  }

  return NextResponse.json({ ok: true });
}
