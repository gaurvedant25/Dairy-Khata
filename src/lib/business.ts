import { prisma } from "@/lib/prisma";

export type TrustLevel = {
  score: number; // 1-5, floor 1
  label: "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";
  daysOverdue: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function trustLabel(score: number): TrustLevel["label"] {
  if (score >= 5) return "Excellent";
  if (score >= 4) return "Good";
  if (score >= 3) return "Fair";
  if (score >= 2) return "Poor";
  return "Very Poor";
}

/**
 * Dues = total billed - total paid, tracked oldest-unpaid-first so we can
 * tell how many days a customer has been carrying an outstanding balance.
 */
export function computeDues(
  deliveries: { date: Date; quantity: number; pricePerUnit: number }[],
  payments: { date: Date; amount: number }[]
) {
  const totalBilled = deliveries.reduce((sum, d) => sum + d.quantity * d.pricePerUnit, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const dues = Math.round((totalBilled - totalPaid) * 100) / 100;

  let daysOverdue = 0;
  if (dues > 0 && deliveries.length > 0) {
    // Apply payments FIFO against the oldest deliveries; the earliest bill
    // still not fully covered marks when the outstanding balance began.
    const sortedDeliveries = [...deliveries].sort((a, b) => a.date.getTime() - b.date.getTime());
    let remainingPaid = totalPaid;
    let oldestUnpaidDate: Date | null = null;
    for (const d of sortedDeliveries) {
      const cost = d.quantity * d.pricePerUnit;
      if (remainingPaid >= cost) {
        remainingPaid -= cost;
      } else {
        oldestUnpaidDate = d.date;
        break;
      }
    }
    if (oldestUnpaidDate) {
      daysOverdue = Math.max(0, Math.floor((Date.now() - oldestUnpaidDate.getTime()) / DAY_MS));
    }
  }

  return { totalBilled, totalPaid, dues, daysOverdue };
}

/**
 * Trust score starts from the owner's manual rating (default 3/5) and is
 * penalized the longer an outstanding balance goes unpaid. Recomputed live
 * on every read, so it needs no scheduled job to "auto-lower".
 */
export function computeTrustLevel(manualTrustRating: number | null, daysOverdue: number): TrustLevel {
  const base = manualTrustRating ?? 3;
  let penalty = 0;
  if (daysOverdue >= 45) penalty = 3;
  else if (daysOverdue >= 30) penalty = 2;
  else if (daysOverdue >= 15) penalty = 1;

  const score = Math.min(5, Math.max(1, base - penalty));
  return { score, label: trustLabel(score), daysOverdue };
}

export async function getCustomerWithStats(customerId: string, userId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, userId },
    include: {
      deliveries: { orderBy: { date: "desc" } },
      payments: { orderBy: { date: "desc" } },
      oneTimeOrders: { orderBy: { date: "desc" } },
    },
  });
  if (!customer) return null;

  const extraCharges = customer.oneTimeOrders
    .filter((o) => !o.paid)
    .map((o) => ({ date: o.date, quantity: 1, pricePerUnit: o.amount }));

  const duesInfo = computeDues([...customer.deliveries, ...extraCharges], customer.payments);
  const trust = computeTrustLevel(customer.manualTrustRating, duesInfo.daysOverdue);

  return { customer, duesInfo, trust };
}

export async function listCustomersWithStats(userId: string) {
  const customers = await prisma.customer.findMany({
    where: { userId },
    include: { deliveries: true, payments: true, oneTimeOrders: true },
    orderBy: { name: "asc" },
  });

  return customers.map((customer) => {
    const extraCharges = customer.oneTimeOrders
      .filter((o) => !o.paid)
      .map((o) => ({ date: o.date, quantity: 1, pricePerUnit: o.amount }));
    const duesInfo = computeDues([...customer.deliveries, ...extraCharges], customer.payments);
    const trust = computeTrustLevel(customer.manualTrustRating, duesInfo.daysOverdue);
    return { customer, duesInfo, trust };
  });
}

export type Period = "today" | "week" | "month";

function periodStart(period: Period): Date {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getStats(userId: string, period: Period) {
  const start = periodStart(period);

  const [deliveries, oneTimeInPeriod, unpaidWalkInOnly, allWithStats] = await Promise.all([
    prisma.deliveryEntry.findMany({ where: { customer: { userId }, date: { gte: start } } }),
    prisma.oneTimeOrder.findMany({ where: { userId, date: { gte: start } } }),
    // Only untagged walk-ins here — tagged ones already show up under
    // their customer's dues via listCustomersWithStats, so counting them
    // in both places would double the "To collect" total.
    prisma.oneTimeOrder.findMany({ where: { userId, paid: false, customerId: null } }),
    listCustomersWithStats(userId),
  ]);

  const deliverySales = deliveries.reduce((s, d) => s + d.quantity * d.pricePerUnit, 0);
  const deliveryCost = deliveries.reduce((s, d) => s + d.quantity * d.costPerUnit, 0);
  const oneTimeSales = oneTimeInPeriod.reduce((s, o) => s + o.amount, 0);

  const sales = deliverySales + oneTimeSales;
  const profit = deliverySales - deliveryCost + oneTimeSales; // one-time has no tracked cost
  const litersDelivered = deliveries.reduce((s, d) => s + d.quantity, 0);

  const customerOutstanding = allWithStats.reduce((s, c) => s + Math.max(0, c.duesInfo.dues), 0);
  const oneTimeOutstanding = unpaidWalkInOnly.reduce((s, o) => s + o.amount, 0);

  return {
    sales: round2(sales),
    cost: round2(deliveryCost),
    profit: round2(profit),
    litersDelivered: round2(litersDelivered),
    totalOutstanding: round2(customerOutstanding + oneTimeOutstanding),
  };
}

export const BUILTIN_UNITS: Record<string, string> = {
  Milk: "L",
  Chai: "cup",
  Dahi: "cup",
  Paneer: "piece",
};

/**
 * Per-product totals for the products the owner starred. Milk is special:
 * it also accrues through DeliveryEntry (the daily round), so both sources
 * are summed for it.
 */
export async function getStarredProductStats(userId: string, period: Period) {
  const start = periodStart(period);
  const setting = await getOrCreateSetting(userId);
  const starred = setting.starredProducts;
  if (starred.length === 0) return [];

  const [orders, customProducts, milkDeliveries] = await Promise.all([
    prisma.oneTimeOrder.findMany({
      where: { userId, date: { gte: start }, product: { in: starred } },
      select: { product: true, unit: true, quantity: true, amount: true },
    }),
    prisma.customProduct.findMany({
      where: { userId, name: { in: starred } },
      select: { name: true, unit: true },
    }),
    starred.includes("Milk")
      ? prisma.deliveryEntry.findMany({
          where: { customer: { userId }, date: { gte: start } },
          select: { quantity: true, pricePerUnit: true },
        })
      : Promise.resolve([]),
  ]);

  const unitByName = new Map<string, string>(Object.entries(BUILTIN_UNITS));
  for (const cp of customProducts) unitByName.set(cp.name, cp.unit);

  const totals = new Map<string, { quantity: number; revenue: number; unit: string }>();
  for (const name of starred) {
    totals.set(name, { quantity: 0, revenue: 0, unit: unitByName.get(name) ?? "" });
  }

  for (const o of orders) {
    const t = totals.get(o.product);
    if (!t) continue;
    t.quantity += o.quantity;
    t.revenue += o.amount;
    if (!t.unit && o.unit) t.unit = o.unit;
  }

  const milk = totals.get("Milk");
  if (milk) {
    for (const d of milkDeliveries) {
      milk.quantity += d.quantity;
      milk.revenue += d.quantity * d.pricePerUnit;
    }
  }

  return starred.map((name) => {
    const t = totals.get(name)!;
    return { name, unit: t.unit, quantity: round2(t.quantity), revenue: round2(t.revenue) };
  });
}

/**
 * Everything that happened on one calendar day, split into the daily
 * delivery round and walk-in/one-time sales.
 */
export async function getDaySummary(userId: string, dateStr: string) {
  const parts = dateStr.split("-").map(Number);
  const dayStart = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [deliveries, walkIns] = await Promise.all([
    prisma.deliveryEntry.findMany({
      where: { customer: { userId }, date: { gte: dayStart, lt: dayEnd } },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { customer: { name: "asc" } },
    }),
    prisma.oneTimeOrder.findMany({
      where: { userId, date: { gte: dayStart, lt: dayEnd } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const deliveryRows = deliveries.map((d) => ({
    id: d.id,
    customerId: d.customer.id,
    customerName: d.customer.name,
    quantity: d.quantity,
    pricePerUnit: d.pricePerUnit,
    amount: round2(d.quantity * d.pricePerUnit),
  }));

  const walkInRows = walkIns.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    product: o.product,
    unit: o.unit,
    quantity: o.quantity,
    amount: o.amount,
    paid: o.paid,
  }));

  const deliveryTotal = round2(deliveryRows.reduce((s, r) => s + r.amount, 0));
  const deliveryLiters = round2(deliveryRows.reduce((s, r) => s + r.quantity, 0));
  const walkInTotal = round2(walkInRows.reduce((s, r) => s + r.amount, 0));
  const walkInUnpaid = round2(walkInRows.filter((r) => !r.paid).reduce((s, r) => s + r.amount, 0));

  return {
    deliveries: deliveryRows,
    walkIns: walkInRows,
    deliveryTotal,
    deliveryLiters,
    walkInTotal,
    walkInUnpaid,
    grandTotal: round2(deliveryTotal + walkInTotal),
  };
}

/**
 * Per-day activity flags for one month, used to dot the calendar.
 */
export async function getMonthActivity(userId: string, year: number, month0: number) {
  const start = new Date(year, month0, 1);
  const end = new Date(year, month0 + 1, 1);

  const [deliveries, walkIns] = await Promise.all([
    prisma.deliveryEntry.findMany({
      where: { customer: { userId }, date: { gte: start, lt: end } },
      select: { date: true, quantity: true, pricePerUnit: true },
    }),
    prisma.oneTimeOrder.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { date: true, amount: true },
    }),
  ]);

  const byDay = new Map<number, number>();
  for (const d of deliveries) {
    const k = d.date.getDate();
    byDay.set(k, (byDay.get(k) ?? 0) + d.quantity * d.pricePerUnit);
  }
  for (const o of walkIns) {
    const k = o.date.getDate();
    byDay.set(k, (byDay.get(k) ?? 0) + o.amount);
  }

  const out: Record<number, number> = {};
  for (const [day, total] of byDay) out[day] = round2(total);
  return out;
}

export async function listOneTimeOrders(userId: string, limit = 20) {
  return prisma.oneTimeOrder.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getDailyTrend(userId: string, days = 14) {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const deliveries = await prisma.deliveryEntry.findMany({
    where: { customer: { userId }, date: { gte: start } },
  });

  const buckets = new Map<string, { sales: number; profit: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { sales: 0, profit: 0 });
  }

  for (const d of deliveries) {
    const key = d.date.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.sales += d.quantity * d.pricePerUnit;
      bucket.profit += d.quantity * (d.pricePerUnit - d.costPerUnit);
    }
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    sales: round2(v.sales),
    profit: round2(v.profit),
  }));
}

/**
 * A customer shows up on the "remind" list once dues are outstanding and
 * we've reached/passed the owner's configured reminder day of the month.
 */
export async function getReminderList(userId: string) {
  const setting = await prisma.setting.findUnique({ where: { userId } });
  const reminderDay = setting?.reminderDayOfMonth ?? 28;
  const today = new Date();
  const pastReminderDay = today.getDate() >= reminderDay;

  const withStats = await listCustomersWithStats(userId);
  const due = withStats.filter((c) => c.duesInfo.dues > 0);

  return { customers: due, pastReminderDay, reminderDay };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function getOrCreateSetting(userId: string) {
  const existing = await prisma.setting.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.setting.create({ data: { userId } });
}
