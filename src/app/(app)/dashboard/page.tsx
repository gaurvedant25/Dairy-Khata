import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getStats,
  getStarredProductStats,
  getDaySummary,
  getMonthActivity,
  type Period,
} from "@/lib/business";
import { Calendar } from "@/components/Calendar";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

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

  const params = await searchParams;
  const period: Period = (["today", "week", "month"] as string[]).includes(params.period ?? "")
    ? (params.period as Period)
    : "month";

  const todayDate = isoLocal(new Date());
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : todayDate;
  const [sy, sm] = selectedDate.split("-").map(Number);

  const [stats, starredStats, day, activity] = await Promise.all([
    getStats(userId, period),
    getStarredProductStats(userId, period),
    getDaySummary(userId, selectedDate),
    getMonthActivity(userId, sy, sm - 1),
  ]);

  const isToday = selectedDate === todayDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/dashboard?period=${p.value}&date=${selectedDate}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === p.value ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Sales" value={`₹${stats.sales.toFixed(2)}`} accent="text-blue-700" />
        <StatCard label="To collect" value={`₹${stats.totalOutstanding.toFixed(2)}`} accent="text-red-700" />
      </div>

      {starredStats.length > 0 && (
        <div className="rounded-xl bg-white p-4 border border-slate-200">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            <span className="text-amber-500">★</span> Starred items
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {starredStats.map((s) => (
              <li key={s.name} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{s.name}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">Sold</p>
                    <p className="text-base font-semibold text-slate-800">
                      {s.quantity.toFixed(s.unit === "piece" ? 0 : 1)}
                      {s.unit ? ` ${s.unit}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Earned</p>
                    <p className="text-base font-semibold text-blue-700">₹{s.revenue.toFixed(2)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-blue-50 px-4 py-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Today</p>
        <p className="mt-0.5 text-lg font-semibold text-slate-900">{prettyDate(todayDate)}</p>
      </div>

      <Calendar
        year={sy}
        month0={sm - 1}
        selectedDate={selectedDate}
        todayDate={todayDate}
        activity={activity}
        period={period}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">
            {isToday ? "Today" : prettyDate(selectedDate)}
          </h2>
          <span className="text-sm font-semibold text-slate-900">
            Day total: ₹{day.grandTotal.toFixed(2)}
          </span>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Daily deliveries</h3>
            <span className="text-xs text-slate-500">
              {day.deliveryLiters.toFixed(1)} L · ₹{day.deliveryTotal.toFixed(2)}
            </span>
          </div>
          {day.deliveries.length === 0 ? (
            <p className="text-sm text-slate-500">No deliveries logged for this day.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {day.deliveries.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/customers/${d.customerId}`}
                      className="truncate text-sm font-medium text-slate-900 hover:underline"
                    >
                      {d.customerName}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {d.quantity.toFixed(2)} L × ₹{d.pricePerUnit.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-800">₹{d.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Walk-in customers</h3>
            <span className="text-xs text-slate-500">
              ₹{day.walkInTotal.toFixed(2)}
              {day.walkInUnpaid > 0 ? ` · ₹${day.walkInUnpaid.toFixed(2)} unpaid` : ""}
            </span>
          </div>
          {day.walkIns.length === 0 ? (
            <p className="text-sm text-slate-500">No walk-in orders for this day.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {day.walkIns.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{o.customerName}</p>
                    <p className="text-xs text-slate-500">
                      {o.product}
                      {o.unit ? ` · ${o.quantity.toFixed(o.unit === "piece" ? 0 : 1)} ${o.unit}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">₹{o.amount.toFixed(2)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        o.paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
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
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}
