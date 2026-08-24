import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { oneTimeOrderSchema } from "@/lib/validation";
import { getOrCreateSetting } from "@/lib/business";

type ResolvedLine = {
  productLabel: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  amount: number;
  isMilk: boolean;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = oneTimeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { existingCustomerId, customerName, phone, items, paid, date } = parsed.data;
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

  const milkPrice = existingCustomer?.defaultPricePerUnit ?? setting.defaultPricePerUnit;

  const userProductIds = items
    .filter((i) => i.product === "UserProduct" && i.userProductId)
    .map((i) => i.userProductId!);
  const userProducts = userProductIds.length
    ? await prisma.customProduct.findMany({
        where: { id: { in: userProductIds }, userId: session.user.id },
      })
    : [];
  const userProductById = new Map(userProducts.map((p) => [p.id, p]));

  const missingProduct = items.some(
    (i) => i.product === "UserProduct" && !userProductById.has(i.userProductId ?? "")
  );
  if (missingProduct) {
    return NextResponse.json({ error: "One of the selected items no longer exists" }, { status: 400 });
  }

  const resolved: ResolvedLine[] = items.map((item) => {
    if (item.product === "Milk") {
      return {
        productLabel: "Milk",
        unit: "L",
        quantity: item.quantity!,
        pricePerUnit: milkPrice,
        amount: Math.round(item.quantity! * milkPrice * 100) / 100,
        isMilk: true,
      };
    }
    if (item.product === "Chai") {
      return {
        productLabel: "Chai",
        unit: "cup",
        quantity: item.quantity!,
        pricePerUnit: setting.defaultChaiPricePerCup,
        amount: Math.round(item.quantity! * setting.defaultChaiPricePerCup * 100) / 100,
        isMilk: false,
      };
    }
    if (item.product === "Dahi") {
      return {
        productLabel: "Dahi",
        unit: "cup",
        quantity: item.quantity!,
        pricePerUnit: setting.defaultDahiPricePerCup,
        amount: Math.round(item.quantity! * setting.defaultDahiPricePerCup * 100) / 100,
        isMilk: false,
      };
    }
    if (item.product === "Paneer") {
      return {
        productLabel: "Paneer",
        unit: "piece",
        quantity: item.quantity!,
        pricePerUnit: setting.defaultPaneerPricePerPiece,
        amount: Math.round(item.quantity! * setting.defaultPaneerPricePerPiece * 100) / 100,
        isMilk: false,
      };
    }
    if (item.product === "UserProduct") {
      const up = userProductById.get(item.userProductId!);
      if (!up) throw new Error("Custom product not found");
      return {
        productLabel: up.name,
        unit: up.unit,
        quantity: item.quantity!,
        pricePerUnit: up.pricePerUnit,
        amount: Math.round(item.quantity! * up.pricePerUnit * 100) / 100,
        isMilk: false,
      };
    }
    // Custom
    const amt = item.customAmount!;
    return {
      productLabel: (item.customProductName ?? "Item").trim(),
      unit: "",
      quantity: 1,
      pricePerUnit: amt,
      amount: amt,
      isMilk: false,
    };
  });

  const created: unknown[] = [];

  for (const line of resolved) {
    // Milk sold on credit to a daily customer folds into their milk ledger
    // as a real delivery so dues + trust math keep working through the
    // existing DeliveryEntry-based pipeline.
    if (existingCustomer && !paid && line.isMilk) {
      const delivery = await prisma.deliveryEntry.create({
        data: {
          customerId: existingCustomer.id,
          date: orderDate,
          quantity: line.quantity,
          pricePerUnit: line.pricePerUnit,
          costPerUnit: setting.defaultCostPerUnit,
        },
      });
      created.push({ kind: "delivery", delivery });
      continue;
    }

    const order = await prisma.oneTimeOrder.create({
      data: {
        userId: session.user.id,
        customerId: existingCustomer?.id ?? null,
        customerName: existingCustomer?.name ?? (customerName ?? "").trim(),
        phone: existingCustomer?.phone ?? (phone || null),
        product: line.productLabel,
        unit: line.unit,
        quantity: line.quantity,
        pricePerUnit: line.pricePerUnit,
        amount: line.amount,
        paid: paid ?? false,
        date: orderDate,
      },
    });
    created.push({ kind: "order", order });
  }

  return NextResponse.json({ created: created.length, results: created }, { status: 201 });
}
