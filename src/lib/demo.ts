import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { istParts } from "@/lib/date";

// "See it in action" gives every visitor their own throwaway account, seeded
// with two months of realistic data, so they can click around (and even add
// entries) without touching anyone else's demo. Demo accounts are recognised
// by this username prefix, which signup refuses, and are deleted when the
// visitor leaves the demo or after a day.
export const DEMO_PREFIX = "demo-";
const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
const DAYS = 60;

export function isDemoUsername(username: string | null | undefined): boolean {
  return !!username && username.startsWith(DEMO_PREFIX);
}

// Small deterministic RNG so every demo looks equally lived-in.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const PRODUCTS = [
  { name: "Milk", unit: "L", pricePerUnit: 60 },
  { name: "Dahi", unit: "kg", pricePerUnit: 100 },
  { name: "Paneer", unit: "kg", pricePerUnit: 420 },
  { name: "Ghee", unit: "kg", pricePerUnit: 650 },
];

// payRate: share of last month's bill paid early this month.
const CUSTOMERS = [
  { name: "Ramesh Kumar", address: "12, Gandhi Nagar", qty: 1, payRate: 1, trust: 5 },
  { name: "Sunita Devi", address: "4B, Shivaji Colony", qty: 2, payRate: 0.6, trust: 4 },
  { name: "Anil Sharma", address: "Near Hanuman Mandir", qty: 0.5, payRate: 0, trust: 2 },
  { name: "Priya Singh", address: "21, Station Road", qty: 1.5, payRate: 1, trust: 5 },
  { name: "Mohd. Irfan", address: "Bazaar Gali, shop 3", qty: 3, payRate: 0.8, trust: 4 },
  { name: "Kavita Joshi", address: "Flat 7, Sai Apartments", qty: 1, payRate: 1, trust: 5, milkRate: 55 },
  { name: "Verma Tea Stall", address: "Bus stand", qty: 5, payRate: 0.5, trust: 3 },
  { name: "Deepak Yadav", address: "33, Nehru Park", qty: 1, payRate: 0.3, trust: 3 },
  { name: "Meena Patel", address: "9, Ram Vihar", qty: 2, payRate: 1, trust: 4 },
  { name: "Sharma Sweets", address: "Main Market", qty: 8, payRate: 0.9, trust: 4, milkRate: 56 },
];

const WALK_IN_NAMES = ["Walk-in", "Rahul", "Pooja", "Suresh", "Neha", "Walk-in", "Arjun", "Walk-in"];

/** Create a demo account with two months of data. Returns the new user. */
export async function createDemoUser() {
  // Opportunistic cleanup of abandoned demos (cascades to all their data).
  await prisma.user.deleteMany({
    where: { username: { startsWith: DEMO_PREFIX }, createdAt: { lt: new Date(Date.now() - DEMO_TTL_MS) } },
  });

  const user = await prisma.user.create({
    data: {
      name: "Mahesh Yadav",
      username: DEMO_PREFIX + randomBytes(8).toString("hex"),
      // Never used: demo accounts are only reachable through the demo sign-in.
      passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 4),
      setting: {
        create: { businessName: "Shree Krishna Dairy", starredProducts: ["Milk", "Dahi", "Paneer"] },
      },
      customProducts: { create: PRODUCTS },
    },
  });

  const rand = rng(42);
  const { y, m, d } = istParts();
  // Same calendar convention as the delivery API: local midnight of the IST day.
  const day = (offset: number) => new Date(y, m, d - offset);
  const cost = 45;

  const customers = await Promise.all(
    CUSTOMERS.map((c, i) =>
      prisma.customer.create({
        data: {
          userId: user.id,
          name: c.name,
          phone: `98${String(10000000 + i * 1234567).slice(0, 8)}`,
          address: c.address,
          dailyQuantity: c.qty,
          manualTrustRating: c.trust,
          customRates: c.milkRate ? { Milk: c.milkRate } : undefined,
          // Not flagged `sample`: the whole account is the demo, so it should
          // look like a shop in full swing, without the setup checklist.
          createdAt: day(DAYS),
        },
      }),
    ),
  );

  const deliveries = [];
  const payments = [];
  for (const [i, c] of CUSTOMERS.entries()) {
    const customerId = customers[i].id;
    const milkPrice = c.milkRate ?? 60;
    const billedByMonth = new Map<string, number>();

    for (let off = DAYS - 1; off >= 0; off--) {
      if (rand() < 0.06) continue; // the odd skipped day
      const date = day(off);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const qty = rand() < 0.1 ? c.qty + 0.5 : c.qty;
      deliveries.push({ customerId, date, product: "Milk", unit: "L", quantity: qty, pricePerUnit: milkPrice, costPerUnit: cost });
      let billed = qty * milkPrice;
      if (rand() < 0.12) {
        deliveries.push({ customerId, date, product: "Dahi", unit: "kg", quantity: 0.5, pricePerUnit: 100, costPerUnit: 70 });
        billed += 50;
      }
      billedByMonth.set(monthKey, (billedByMonth.get(monthKey) ?? 0) + billed);
    }

    // Settle each finished month in the first week of the next one.
    for (const [key, billed] of billedByMonth) {
      const [by, bm] = key.split("-").map(Number);
      const payDate = new Date(by, bm + 1, 3 + Math.floor(rand() * 5));
      if (c.payRate === 0 || payDate > day(0)) continue;
      payments.push({
        customerId,
        amount: Math.round((billed * c.payRate) / 10) * 10,
        date: payDate,
        note: c.payRate === 1 ? "Full payment (UPI)" : "Part payment (cash)",
      });
    }
  }

  const orders = [];
  for (let off = DAYS - 1; off >= 0; off--) {
    const count = 2 + Math.floor(rand() * 4);
    for (let k = 0; k < count; k++) {
      const p = PRODUCTS[rand() < 0.6 ? 0 : 1 + Math.floor(rand() * 3)];
      const quantity = p.name === "Milk" ? 0.5 + Math.floor(rand() * 4) * 0.5 : p.name === "Dahi" ? 0.5 : 0.25;
      const date = day(off);
      date.setHours(7 + Math.floor(rand() * 12), Math.floor(rand() * 60));
      orders.push({
        userId: user.id,
        customerName: WALK_IN_NAMES[Math.floor(rand() * WALK_IN_NAMES.length)],
        product: p.name,
        unit: p.unit,
        quantity,
        pricePerUnit: p.pricePerUnit,
        amount: quantity * p.pricePerUnit,
        paid: rand() < 0.9,
        date,
      });
    }
  }

  await Promise.all([
    prisma.deliveryEntry.createMany({ data: deliveries }),
    prisma.payment.createMany({ data: payments }),
    prisma.oneTimeOrder.createMany({ data: orders }),
  ]);

  return user;
}
