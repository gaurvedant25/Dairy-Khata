import { cache } from "react";
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

// Wrapped in React cache() so multiple callers in the same request (e.g. the
// dashboard's getStats + getOutstandingBreakdown) share one DB query.
export const listCustomersWithStats = cache(async (userId: string) => {
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
});

export type Period = "today" | "week" | "month";

/**
 * The date window for a period, anchored to the date the user is viewing on
 * the dashboard (not just "now"), with a proper upper bound so navigating to
 * a past month shows that month's figures.
 */
export function periodRange(period: Period, dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (period === "today") {
    const start = new Date(y, m - 1, d);
    const end = new Date(y, m - 1, d + 1);
    return { start, end };
  }
  if (period === "week") {
    const end = new Date(y, m - 1, d + 1); // exclusive, day after the viewed day
    const start = new Date(y, m - 1, d - 6); // 7-day window ending on the viewed day
    return { start, end };
  }
  // month containing the viewed date
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

export async function getStats(userId: string, period: Period, dateStr: string) {
  const { start, end } = periodRange(period, dateStr);

  const [deliveries, oneTimeInPeriod, unpaidWalkInOnly, allWithStats] = await Promise.all([
    prisma.deliveryEntry.findMany({ where: { customer: { userId }, date: { gte: start, lt: end } } }),
    prisma.oneTimeOrder.findMany({ where: { userId, date: { gte: start, lt: end } } }),
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
  const litersDelivered = deliveries
    .filter((d) => d.product === "Milk")
    .reduce((s, d) => s + d.quantity, 0);

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

/**
 * Line-by-line breakdown of what makes up the "Sales" figure for the period:
 * the milk round (per customer) plus every walk-in / one-time order.
 */
export async function getSalesBreakdown(userId: string, period: Period, dateStr: string) {
  const { start, end } = periodRange(period, dateStr);

  const [deliveries, orders] = await Promise.all([
    prisma.deliveryEntry.findMany({
      where: { customer: { userId }, date: { gte: start, lt: end } },
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.oneTimeOrder.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    }),
  ]);

  // Roll up deliveries per customer so the list is short and readable.
  // `liters` counts only milk; `amount` is the customer's full delivery value.
  const byCustomer = new Map<string, { customerId: string; name: string; liters: number; amount: number }>();
  for (const d of deliveries) {
    const key = d.customer.id;
    const cur = byCustomer.get(key) ?? { customerId: key, name: d.customer.name, liters: 0, amount: 0 };
    if (d.product === "Milk") cur.liters += d.quantity;
    cur.amount += d.quantity * d.pricePerUnit;
    byCustomer.set(key, cur);
  }
  const deliveryRows = Array.from(byCustomer.values())
    .map((r) => ({ ...r, liters: round2(r.liters), amount: round2(r.amount) }))
    .sort((a, b) => b.amount - a.amount);

  const walkInRows = orders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    product: o.product,
    unit: o.unit,
    quantity: o.quantity,
    amount: round2(o.amount),
    paid: o.paid,
  }));

  return {
    deliveryRows,
    walkInRows,
    deliveryTotal: round2(deliveryRows.reduce((s, r) => s + r.amount, 0)),
    walkInTotal: round2(walkInRows.reduce((s, r) => s + r.amount, 0)),
  };
}

/**
 * Everyone who currently owes money, split into daily customers (dues from
 * the ledger) and untagged walk-in orders that are still unpaid.
 */
export async function getOutstandingBreakdown(userId: string) {
  const [allWithStats, unpaidWalkIns] = await Promise.all([
    listCustomersWithStats(userId),
    prisma.oneTimeOrder.findMany({
      where: { userId, paid: false, customerId: null },
      orderBy: { date: "desc" },
    }),
  ]);

  const dailyRows = allWithStats
    .filter((c) => c.duesInfo.dues > 0)
    .map((c) => ({
      customerId: c.customer.id,
      name: c.customer.name,
      dues: round2(c.duesInfo.dues),
      daysOverdue: c.duesInfo.daysOverdue,
    }))
    .sort((a, b) => b.dues - a.dues);

  const walkInRows = unpaidWalkIns.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    product: o.product,
    unit: o.unit,
    quantity: o.quantity,
    amount: round2(o.amount),
  }));

  return {
    dailyRows,
    walkInRows,
    dailyTotal: round2(dailyRows.reduce((s, r) => s + r.dues, 0)),
    walkInTotal: round2(walkInRows.reduce((s, r) => s + r.amount, 0)),
  };
}

/**
 * Ensure the account has at least the default "Milk" item. Seeds new
 * accounts and backfills existing ones on first read.
 */
export async function ensureDefaultProducts(userId: string) {
  const milk = await prisma.customProduct.findFirst({ where: { userId, name: "Milk" } });
  if (!milk) {
    const setting = await getOrCreateSetting(userId);
    await prisma.customProduct.create({
      data: { userId, name: "Milk", unit: "L", pricePerUnit: setting.defaultPricePerUnit || 60 },
    });
  }
}

/**
 * Per-product totals for the products the owner starred, combining walk-in
 * sales and the daily delivery round.
 */
export async function getStarredProductStats(userId: string, period: Period, dateStr: string) {
  const { start, end } = periodRange(period, dateStr);
  const setting = await getOrCreateSetting(userId);
  const starred = setting.starredProducts;
  if (starred.length === 0) return [];

  const [orders, customProducts, deliveriesByProduct] = await Promise.all([
    prisma.oneTimeOrder.findMany({
      where: { userId, date: { gte: start, lt: end }, product: { in: starred } },
      select: { product: true, unit: true, quantity: true, amount: true },
    }),
    prisma.customProduct.findMany({
      where: { userId, name: { in: starred } },
      select: { name: true, unit: true },
    }),
    prisma.deliveryEntry.findMany({
      where: { customer: { userId }, date: { gte: start, lt: end }, product: { in: starred } },
      select: { product: true, unit: true, quantity: true, pricePerUnit: true },
    }),
  ]);

  const unitByName = new Map<string, string>();
  for (const cp of customProducts) unitByName.set(cp.name, cp.unit);

  // Only show starred items that still exist as products (drop deleted ones).
  const activeStarred = starred.filter((name) => unitByName.has(name));

  const totals = new Map<string, { quantity: number; revenue: number; unit: string }>();
  for (const name of activeStarred) {
    totals.set(name, { quantity: 0, revenue: 0, unit: unitByName.get(name) ?? "" });
  }

  for (const o of orders) {
    const t = totals.get(o.product);
    if (!t) continue;
    t.quantity += o.quantity;
    t.revenue += o.amount;
    if (!t.unit && o.unit) t.unit = o.unit;
  }

  for (const d of deliveriesByProduct) {
    const t = totals.get(d.product);
    if (!t) continue;
    t.quantity += d.quantity;
    t.revenue += d.quantity * d.pricePerUnit;
    if (!t.unit && d.unit) t.unit = d.unit;
  }

  return activeStarred.map((name) => {
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
    product: d.product,
    unit: d.unit,
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
  const deliveryLiters = round2(
    deliveryRows.filter((r) => r.product === "Milk").reduce((s, r) => s + r.quantity, 0)
  );
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

export const getOrCreateSetting = cache(async (userId: string) => {
  const existing = await prisma.setting.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.setting.create({ data: { userId } });
});

export type SheetLine = {
  product: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  costPerUnit: number;
  isMilk: boolean;
};

export type SheetCustomer = {
  customerId: string;
  name: string;
  saved: boolean; // true if this date already has saved entries
  lines: SheetLine[];
};

/**
 * The editable delivery sheet for one date. For each active customer we
 * return the saved lines if the date already has entries; otherwise we carry
 * forward the items from their most recent previous delivery day. Brand-new
 * customers (no history) start with a Milk line from the Milk item.
 */
export async function getDeliverySheet(userId: string, dateStr: string): Promise<SheetCustomer[]> {
  await ensureDefaultProducts(userId);

  const [y, m, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [customers, todays, milkProduct] = await Promise.all([
    prisma.customer.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, dailyQuantity: true },
    }),
    prisma.deliveryEntry.findMany({
      where: { customer: { userId }, date: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.customProduct.findFirst({ where: { userId, name: "Milk" } }),
  ]);

  const todaysByCustomer = new Map<string, typeof todays>();
  for (const e of todays) {
    const arr = todaysByCustomer.get(e.customerId) ?? [];
    arr.push(e);
    todaysByCustomer.set(e.customerId, arr);
  }

  // For customers with no entries today, carry forward all items from their
  // most recent prior delivery day so recurring orders keep showing up.
  const needSeed = customers.filter((c) => !todaysByCustomer.has(c.id)).map((c) => c.id);
  const carryByCustomer = new Map<string, { product: string; unit: string; pricePerUnit: number; costPerUnit: number; quantity: number }[]>();
  if (needSeed.length > 0) {
    const lookback = new Date(dayStart);
    lookback.setDate(lookback.getDate() - 60);
    const prior = await prisma.deliveryEntry.findMany({
      where: { customerId: { in: needSeed }, date: { gte: lookback, lt: dayStart } },
      orderBy: { date: "desc" },
    });
    const latestDateKey = new Map<string, number>();
    for (const e of prior) {
      if (!latestDateKey.has(e.customerId)) latestDateKey.set(e.customerId, e.date.getTime());
    }
    for (const e of prior) {
      if (latestDateKey.get(e.customerId) !== e.date.getTime()) continue;
      const arr = carryByCustomer.get(e.customerId) ?? [];
      arr.push({
        product: e.product,
        unit: e.unit,
        pricePerUnit: e.pricePerUnit,
        costPerUnit: e.costPerUnit,
        quantity: e.quantity,
      });
      carryByCustomer.set(e.customerId, arr);
    }
  }

  return customers.map((c) => {
    const saved = todaysByCustomer.get(c.id);
    if (saved && saved.length > 0) {
      const lines: SheetLine[] = saved
        .sort((a, b) => (a.product === "Milk" ? -1 : b.product === "Milk" ? 1 : 0))
        .map((e) => ({
          product: e.product,
          unit: e.unit,
          quantity: e.quantity,
          pricePerUnit: e.pricePerUnit,
          costPerUnit: e.costPerUnit,
          isMilk: e.product === "Milk",
        }));
      return { customerId: c.id, name: c.name, saved: true, lines };
    }

    const carried = carryByCustomer.get(c.id);
    if (carried && carried.length > 0) {
      return {
        customerId: c.id,
        name: c.name,
        saved: false,
        lines: carried.map((e) => ({ ...e, isMilk: e.product === "Milk" })),
      };
    }

    // Brand-new customer: start with a Milk line if a Milk item exists.
    const lines: SheetLine[] = milkProduct
      ? [
          {
            product: milkProduct.name,
            unit: milkProduct.unit,
            quantity: c.dailyQuantity || 1,
            pricePerUnit: milkProduct.pricePerUnit,
            costPerUnit: 0,
            isMilk: true,
          },
        ]
      : [];
    return { customerId: c.id, name: c.name, saved: false, lines };
  });
}
