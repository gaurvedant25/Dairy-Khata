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

  const {
    existingCustomerId,
    customerName,
    phone,
    product,
    customProductName,
    quantity,
    customAmount,
    paid,
    date,
  } = parsed.data;

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

  // Resolve product name, unit, per-unit price and total amount from the
  // three modes (Milk uses per-customer liter price when available;
  // Chai uses the business's per-cup price; Custom is a lump-sum amount).
  let productLabel: string;
  let unit: string;
  let effectiveQuantity: number;
  let pricePerUnit: number;
  let amount: number;

  if (product === "Milk") {
    productLabel = "Milk";
    unit = "L";
    effectiveQuantity = quantity!;
    pricePerUnit = existingCustomer?.defaultPricePerUnit ?? setting.defaultPricePerUnit;
    amount = Math.round(effectiveQuantity * pricePerUnit * 100) / 100;
  } else if (product === "Chai") {
    productLabel = "Chai";
    unit = "cup";
    effectiveQuantity = quantity!;
    pricePerUnit = setting.defaultChaiPricePerCup;
    amount = Math.round(effectiveQuantity * pricePerUnit * 100) / 100;
  } else {
    productLabel = (customProductName ?? "Item").trim();
    unit = "";
    effectiveQuantity = 1;
    amount = customAmount!;
    pricePerUnit = amount;
  }

  // Milk sold on credit to a daily customer folds straight into their
  // milk ledger as a real delivery so dues + trust math keeps working
  // through the existing DeliveryEntry-based pipeline.
  if (existingCustomer && !paid && product === "Milk") {
    const delivery = await prisma.deliveryEntry.create({
      data: {
        customerId: existingCustomer.id,
        date: orderDate,
        quantity: effectiveQuantity,
        pricePerUnit,
        costPerUnit: setting.defaultCostPerUnit,
      },
    });
    return NextResponse.json({ mode: "added-to-ledger", delivery }, { status: 201 });
  }

  const order = await prisma.oneTimeOrder.create({
    data: {
      userId: session.user.id,
      customerId: existingCustomer?.id ?? null,
      customerName: existingCustomer?.name ?? (customerName ?? "").trim(),
      phone: existingCustomer?.phone ?? (phone || null),
      product: productLabel,
      unit,
      quantity: effectiveQuantity,
      pricePerUnit,
      amount,
      paid: paid ?? false,
      date: orderDate,
    },
  });
  return NextResponse.json({ mode: "walk-in-logged", order }, { status: 201 });
}
