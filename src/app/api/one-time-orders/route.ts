import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { oneTimeOrderSchema } from "@/lib/validation";
import { getOrCreateSetting } from "@/lib/business";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = oneTimeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { existingCustomerId, customerName, phone, product, quantity, paid, date } = parsed.data;
  const setting = await getOrCreateSetting(session.user.id);
  const orderDate = date ? new Date(date) : new Date();

  let existingCustomer = null as null | Awaited<ReturnType<typeof prisma.customer.findFirst>>;
  if (existingCustomerId) {
    existingCustomer = await prisma.customer.findFirst({
      where: { id: existingCustomerId, userId: session.user.id },
    });
    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
  }

  const pricePerUnit = existingCustomer?.defaultPricePerUnit ?? setting.defaultPricePerUnit;
  const amount = Math.round(quantity * pricePerUnit * 100) / 100;

  // Daily customer + unpaid: add to their ledger as a real delivery so dues track it.
  if (existingCustomer && !paid) {
    const delivery = await prisma.deliveryEntry.create({
      data: {
        customerId: existingCustomer.id,
        date: orderDate,
        quantity,
        pricePerUnit,
        costPerUnit: setting.defaultCostPerUnit,
      },
    });
    return NextResponse.json({ mode: "added-to-ledger", delivery }, { status: 201 });
  }

  // Either a new walk-in, or a daily customer paying on the spot — log as one-time.
  const order = await prisma.oneTimeOrder.create({
    data: {
      userId: session.user.id,
      customerName: existingCustomer?.name ?? (customerName ?? "").trim(),
      phone: existingCustomer?.phone ?? (phone || null),
      product,
      quantity,
      pricePerUnit,
      amount,
      paid: paid ?? false,
      date: orderDate,
    },
  });
  return NextResponse.json({ mode: "walk-in-logged", order }, { status: 201 });
}
