import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCustomRates, type CustomRates } from "@/lib/business";

/**
 * Set a customer's per-product price overrides.
 *
 * Body: { rates: { [product: string]: number } } — the full desired map of
 * custom rates (omit a product to use the global price).
 *
 * Side effect: any product whose effective rate changed is re-priced across
 * THIS calendar month's already-recorded deliveries for this customer, so the
 * current (unpaid) bill reflects the new rate. Past months are left untouched.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, userId: session.user.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { rates?: Record<string, unknown> } | null;
  if (!body || typeof body.rates !== "object" || body.rates === null) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Validate + normalize the incoming map (drop anything not a valid price).
  const next: CustomRates = {};
  for (const [product, v] of Object.entries(body.rates)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n >= 0) next[product] = Math.round(n * 100) / 100;
  }

  const prev = parseCustomRates(customer.customRates);

  // Which products' effective rate changed (set, cleared, or edited)?
  const changed = new Set<string>();
  for (const p of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (prev[p] !== next[p]) changed.add(p);
  }

  // Resolve global prices so a cleared override falls back to the standard rate.
  const products = await prisma.customProduct.findMany({
    where: { userId: session.user.id },
    select: { name: true, pricePerUnit: true },
  });
  const globalPrice = new Map(products.map((p) => [p.name, p.pricePerUnit]));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let repriced = 0;
  await prisma.$transaction(async (tx) => {
    await tx.customer.update({ where: { id }, data: { customRates: next } });

    for (const product of changed) {
      const target = next[product] ?? globalPrice.get(product);
      if (target === undefined) continue; // unknown product with no global price
      const res = await tx.deliveryEntry.updateMany({
        where: { customerId: id, product, date: { gte: monthStart, lt: monthEnd } },
        data: { pricePerUnit: target },
      });
      repriced += res.count;
    }
  });

  return NextResponse.json({ rates: next, repriced });
}
