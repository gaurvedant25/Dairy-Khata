import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Onboarding } from "@/components/Onboarding";
import {
  getStats,
  getStarredProductStats,
  getDaySummary,
  getMonthActivity,
  getOutstandingBreakdown,
  getOrCreateSetting,
} from "@/lib/business";
import type { Lang } from "@/lib/i18n";
import { Calendar } from "@/components/Calendar";
import { ExpandableStat } from "@/components/ExpandableStat";
import { SalesCard } from "@/components/SalesCard";
import { DashboardBodySkeleton } from "@/components/Skeletons";
import { getT } from "@/lib/lang";

type T = (key: string, vars?: Record<string, string | number>) => string;

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function prettyDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { t, lang } = await getT();
  const ownerName = session!.user.name ?? "";

  const [setting, realCustomerCount, sampleCustomerCount, realDeliveryCount] = await Promise.all([
    getOrCreateSetting(userId),
    prisma.customer.count({ where: { userId, sample: false } }),
    prisma.customer.count({ where: { userId, sample: true } }),
    prisma.deliveryEntry.count({ where: { customer: { userId, sample: false } } }),
  ]);
  const hasSample = sampleCustomerCount > 0;
  const showOnboarding = realCustomerCount === 0 || hasSample;

  const params = await searchParams;
  const todayDate = isoLocal(new Date());
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : todayDate;

  const firstName = ownerName.trim().split(/\s+/)[0] || "";

  return (
    <div className="mx-auto max-w-md space-y-4">
      {showOnboarding && (
        <Onboarding
          hasCustomers={realCustomerCount > 0}
          hasDeliveries={realDeliveryCount > 0}
          hasSample={hasSample}
          lang={lang}
        />
      )}

      {/* Greeting row */}
      <div className="min-w-0 pb-1 pt-2">
        <p className="mb-0.5 text-sm font-medium text-[var(--color-neutral-600)]">
          {t("home.greeting", { name: firstName })}
        </p>
        <h1 className="font-heading truncate text-[34px] leading-none tracking-tight text-[var(--color-accent-900)]">
          {setting.businessName}
        </h1>
      </div>

      <Suspense key={selectedDate} fallback={<DashboardBodySkeleton />}>
        <HomeBody
          userId={userId}
          selectedDate={selectedDate}
          todayDate={todayDate}
          lang={lang}
          t={t}
        />
      </Suspense>
    </div>
  );
}

async function HomeBody({
  userId,
  selectedDate,
  todayDate,
  lang,
  t,
}: {
  userId: string;
  selectedDate: string;
  todayDate: string;
  lang: Lang;
  t: T;
}) {
  const [sy, sm] = selectedDate.split("-").map(Number);

  const [todayStats, monthStats, dues, starred, day, activity] = await Promise.all([
    getStats(userId, "today", todayDate),
    getStats(userId, "month", todayDate),
    getOutstandingBreakdown(userId),
    getStarredProductStats(userId, "month", selectedDate),
    getDaySummary(userId, selectedDate),
    getMonthActivity(userId, sy, sm - 1),
  ]);

  const isToday = selectedDate === todayDate;

  return (
    <>
      {/* Today's sales card — both figures preloaded so the switch is instant */}
      <SalesCard todaySales={todayStats.sales} monthSales={monthStats.sales} lang={lang} />

      {/* To collect — tap to see everyone who owes */}
      <ExpandableStat label={t("dash.toCollect")} value={`₹${todayStats.totalOutstanding.toFixed(2)}`}>
        {dues.dailyRows.length === 0 && dues.walkInRows.length === 0 ? (
          <p
            className="py-3 text-center text-sm"
            style={{ borderTop: "1px solid rgba(86,99,63,.22)", color: "var(--color-accent-2-700)" }}
          >
            {t("home.allPaid")}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {dues.dailyRows.map((r) => (
              <li key={r.customerId} style={{ borderTop: "1px solid rgba(86,99,63,.22)" }}>
                <Link href={`/customers/${r.customerId}`} className="flex items-center justify-between gap-3 py-[11px]">
                  <span
                    className="min-w-0 truncate text-[15px] font-semibold"
                    style={{ color: "var(--color-accent-2-900, #272e1b)" }}
                  >
                    {r.name}
                  </span>
                  <span
                    className="shrink-0 text-[15px] font-semibold"
                    style={{ color: "var(--color-accent-2-700)" }}
                  >
                    ₹{r.dues.toFixed(2)}
                  </span>
                </Link>
              </li>
            ))}
            {dues.walkInRows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-[11px]"
                style={{ borderTop: "1px solid rgba(86,99,63,.22)" }}
              >
                <span
                  className="min-w-0 truncate text-[15px] font-semibold"
                  style={{ color: "var(--color-accent-2-900, #272e1b)" }}
                >
                  {r.customerName}
                </span>
                <span className="shrink-0 text-[15px] font-semibold" style={{ color: "var(--color-accent-2-700)" }}>
                  ₹{r.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ExpandableStat>

      {/* Starred items */}
      <section>
        <div className="flex items-center gap-2 px-1.5 pb-3 pt-1.5">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="var(--color-accent-500)"
            stroke="var(--color-accent-500)"
            strokeWidth="2.75"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M11.5 3.2 14 8.4l5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
          </svg>
          <h2 className="font-heading text-[19px] text-[var(--color-accent-900)]">{t("dash.starredItems")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {starred.map((s) => (
            <div
              key={s.name}
              className="rounded-[22px] px-[18px] py-4"
              style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-base font-bold text-[var(--color-neutral-900)]">{s.name}</p>
              <p className="mt-0.5 text-[13px] text-[var(--color-neutral-600)]">
                {t("dash.sold")} {s.quantity.toFixed(s.unit === "piece" ? 0 : 1)}
                {s.unit ? ` ${s.unit}` : ""}
              </p>
              <p className="font-heading mt-2.5 text-[20px] text-[var(--color-accent-700)]">
                ₹{s.revenue.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* History: calendar + day detail (kept from the existing dashboard) */}
      <Calendar
        year={sy}
        month0={sm - 1}
        selectedDate={selectedDate}
        todayDate={todayDate}
        activity={activity}
        period="month"
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-[17px] text-[var(--color-accent-900)]">
            {isToday ? "Today" : prettyDate(selectedDate)}
          </h2>
          <span className="text-sm font-semibold text-[var(--color-accent-900)]">
            ₹{day.grandTotal.toFixed(2)}
          </span>
        </div>

        <section
          className="rounded-2xl border p-4"
          style={{ background: "var(--color-neutral-100)", borderColor: "var(--color-divider)" }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-neutral-700)]">{t("dash.dailyDeliveries")}</h3>
            <span className="text-xs text-[var(--color-neutral-600)]">
              {day.deliveryLiters.toFixed(1)} L · ₹{day.deliveryTotal.toFixed(2)}
            </span>
          </div>
          {day.deliveries.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-600)]">No deliveries logged for this day.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--color-divider)" }}>
              {day.deliveries.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/customers/${d.customerId}`} className="truncate text-sm font-medium text-[var(--color-accent-900)]">
                      {d.customerName}
                    </Link>
                    <p className="text-xs text-[var(--color-neutral-600)]">
                      {d.product} · {d.quantity.toFixed(d.unit === "piece" ? 0 : 2)}
                      {d.unit ? ` ${d.unit}` : ""} × ₹{d.pricePerUnit.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[var(--color-accent-900)]">₹{d.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="rounded-2xl border p-4"
          style={{ background: "var(--color-neutral-100)", borderColor: "var(--color-divider)" }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-neutral-700)]">{t("dash.walkinCustomers")}</h3>
            <span className="text-xs text-[var(--color-neutral-600)]">
              ₹{day.walkInTotal.toFixed(2)}
              {day.walkInUnpaid > 0 ? ` · ₹${day.walkInUnpaid.toFixed(2)} unpaid` : ""}
            </span>
          </div>
          {day.walkIns.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-600)]">No walk-in orders for this day.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--color-divider)" }}>
              {day.walkIns.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-accent-900)]">{o.customerName}</p>
                    <p className="text-xs text-[var(--color-neutral-600)]">
                      {o.product}
                      {o.unit ? ` · ${o.quantity.toFixed(o.unit === "piece" ? 0 : 1)} ${o.unit}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-accent-900)]">₹{o.amount.toFixed(2)}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={
                        o.paid
                          ? { background: "var(--color-accent-2-200)", color: "var(--color-accent-2-800)" }
                          : { background: "var(--color-peach-bg)", color: "var(--color-peach-fg)" }
                      }
                    >
                      {o.paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
