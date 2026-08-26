import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSetting, ensureDefaultProducts } from "@/lib/business";

// Demo customers seeded so a brand-new account (or a sales pitch) shows a
// realistic, full dashboard. All rows are flagged sample:true so DELETE can
// remove them without ever touching the owner's real data.
const SAMPLE = [
  { name: "Ramesh Kumar", qty: 1, paidFraction: 1, trust: 5 },   // pays in full
  { name: "Sunita Devi", qty: 2, paidFraction: 0.5, trust: 4 },  // half paid
  { name: "Anil Sharma", qty: 0.5, paidFraction: 0, trust: 3 },  // owes everything
  { name: "Priya Singh", qty: 1.5, paidFraction: 0.3, trust: 4 },
];

const DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  // Don't pile up duplicates if tapped twice.
  const already = await prisma.customer.count({ where: { userId, sample: true } });
  if (already > 0) return NextResponse.json({ ok: true, alreadyLoaded: true });

  await ensureDefaultProducts(userId);
  const setting = await getOrCreateSetting(userId);
  const milk = await prisma.customProduct.findFirst({ where: { userId, name: "Milk" } });
  const price = milk?.pricePerUnit || setting.defaultPricePerUnit || 60;
  const cost = setting.defaultCostPerUnit || 45;

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  for (const s of SAMPLE) {
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: s.name,
        dailyQuantity: s.qty,
        manualTrustRating: s.trust,
        sample: true,
        active: true,
      },
    });

    // A daily milk delivery for each of the last DAYS days.
    const deliveries = [];
    let billed = 0;
    for (let i = DAYS - 1; i >= 0; i--) {
      const date = new Date(midnight.getTime() - i * DAY_MS);
      billed += s.qty * price;
      deliveries.push({
        customerId: customer.id,
        date,
        product: "Milk",
        unit: "L",
        quantity: s.qty,
        pricePerUnit: price,
        costPerUnit: cost,
      });
    }
    await prisma.deliveryEntry.createMany({ data: deliveries });

    // A single part-payment so dues + trust vary across customers.
    if (s.paidFraction > 0) {
      await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: Math.round(billed * s.paidFraction),
          date: new Date(midnight.getTime() - Math.floor(DAYS / 2) * DAY_MS),
          note: "Sample payment",
        },
      });
    }
  }

  return NextResponse.json({ ok: true, count: SAMPLE.length });
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Deleting sample customers cascades to their deliveries and payments.
  const res = await prisma.customer.deleteMany({
    where: { userId: session.user.id, sample: true },
  });

  return NextResponse.json({ ok: true, removed: res.count });
}
