import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStats, getStarredProductStats, type Period } from "@/lib/business";

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

  const [stats, starredStats] = await Promise.all([
    getStats(userId, period),
    getStarredProductStats(userId, period),
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
