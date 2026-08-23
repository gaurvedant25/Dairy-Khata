import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStats, getReminderList, type Period } from "@/lib/business";
import { TrustBadge } from "@/components/TrustBadge";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;

  const params = await searchParams;
  const period: Period = (["today", "week", "month"] as string[]).includes(params.period ?? "")
    ? (params.period as Period)
    : "month";

  const [stats, reminders] = await Promise.all([
    getStats(userId, period),
    getReminderList(userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/dashboard?period=${p.value}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === p.value ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Sales" value={`₹${stats.sales.toFixed(2)}`} accent="text-blue-700" />
        <StatCard label="Liters delivered" value={stats.litersDelivered.toFixed(1)} accent="text-slate-700" />
        <StatCard label="To collect" value={`₹${stats.totalOutstanding.toFixed(2)}`} accent="text-red-700" />
      </div>

      <div className="rounded-xl bg-white p-4 border border-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Customers to remind</h2>
          {reminders.pastReminderDay && (
            <span className="text-xs text-slate-400">Reminder day: {reminders.reminderDay}th</span>
          )}
        </div>
        {reminders.customers.length === 0 ? (
          <p className="text-sm text-slate-500">
            {reminders.pastReminderDay ? "Nobody owes you money right now." : "No reminders due yet this month."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reminders.customers.map(({ customer, duesInfo, trust }) => (
              <li key={customer.id} className="flex items-center justify-between py-3">
                <div>
                  <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:underline">
                    {customer.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    ₹{duesInfo.dues.toFixed(2)} due · {duesInfo.daysOverdue} days
                  </p>
                </div>
                <TrustBadge trust={trust} />
              </li>
            ))}
          </ul>
        )}
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
