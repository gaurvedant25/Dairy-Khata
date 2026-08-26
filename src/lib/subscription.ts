import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const TRIAL_DAYS = 14;
export const PRICE_INR = 249;
export const CYCLE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Grant one billing cycle (30 days) of paid access, idempotently.
 *
 * Keyed on the Razorpay payment id via ProcessedPayment, so the same charge is
 * never counted twice — safe to call from both the client verify step and the
 * subscription.charged webhook, and safe under Razorpay's webhook retries.
 * Returns true if this call actually extended access, false if already applied.
 */
export async function grantCycle(userId: string, paymentId: string): Promise<boolean> {
  try {
    await prisma.processedPayment.create({ data: { paymentId, userId } });
  } catch {
    return false; // unique paymentId already recorded → already granted
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { paidUntil: true } });
  if (!user) return false;

  const now = new Date();
  const base = user.paidUntil && user.paidUntil > now ? user.paidUntil : now;
  const paidUntil = new Date(base.getTime() + CYCLE_DAYS * DAY_MS);

  await prisma.user.update({
    where: { id: userId },
    data: { paidUntil, subscriptionStatus: "active" },
  });
  return true;
}

export type SubStatus = "trialing" | "active" | "expired";

export type Subscription = {
  status: SubStatus;
  hasAccess: boolean;
  daysLeft: number; // days left in trial (0 if not trialing)
  trialEndsAt: Date | null;
  paidUntil: Date | null;
};

/**
 * Resolve a user's access: they get in if their paid period is current, or
 * they're still inside the 14-day free trial. New/legacy accounts get their
 * trial seeded lazily from signup date.
 */
export const getSubscription = cache(async (userId: string): Promise<Subscription> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, trialEndsAt: true, paidUntil: true },
  });
  if (!user) {
    return { status: "expired", hasAccess: false, daysLeft: 0, trialEndsAt: null, paidUntil: null };
  }

  let trialEndsAt = user.trialEndsAt;
  if (!trialEndsAt) {
    trialEndsAt = new Date(user.createdAt.getTime() + TRIAL_DAYS * DAY_MS);
    await prisma.user.update({ where: { id: userId }, data: { trialEndsAt } });
  }

  const now = Date.now();
  const paidActive = user.paidUntil ? user.paidUntil.getTime() > now : false;
  const trialActive = trialEndsAt.getTime() > now;

  const status: SubStatus = paidActive ? "active" : trialActive ? "trialing" : "expired";
  const daysLeft = trialActive ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / DAY_MS)) : 0;

  return {
    status,
    hasAccess: paidActive || trialActive,
    daysLeft,
    trialEndsAt,
    paidUntil: user.paidUntil ?? null,
  };
});
