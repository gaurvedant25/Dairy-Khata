import { auth } from "@/lib/auth";
import { getOrCreateSetting, listOneTimeOrders } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { OneTimeOrders } from "@/components/OneTimeOrders";

export default async function WalkInPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [orders, setting, dailyCustomers] = await Promise.all([
    listOneTimeOrders(userId, 100),
    getOrCreateSetting(userId),
    prisma.customer.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, defaultPricePerUnit: true },
    }),
  ]);

  const unpaidTotal = orders.filter((o) => !o.paid).reduce((s, o) => s + o.amount, 0);
  const paidTotal = orders.filter((o) => o.paid).reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Walk-in orders</h1>
        <p className="text-sm text-slate-500">
          One-time or casual sales that aren&apos;t tied to a regular customer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Orders" value={orders.length.toString()} accent="text-slate-800" />
        <StatCard label="Collected" value={`₹${paidTotal.toFixed(2)}`} accent="text-emerald-700" />
        <StatCard label="To collect" value={`₹${unpaidTotal.toFixed(2)}`} accent={unpaidTotal > 0 ? "text-red-700" : "text-slate-800"} />
      </div>

      <OneTimeOrders
        defaultPricePerUnit={setting.defaultPricePerUnit}
        defaultChaiPricePerCup={setting.defaultChaiPricePerCup}
        dailyCustomers={dailyCustomers.map((c) => ({
          id: c.id,
          name: c.name,
          pricePerUnit: c.defaultPricePerUnit ?? setting.defaultPricePerUnit,
        }))}
        initialOrders={orders.map((o) => ({
          id: o.id,
          customerName: o.customerName,
          phone: o.phone,
          product: o.product,
          unit: o.unit,
          quantity: o.quantity,
          amount: o.amount,
          paid: o.paid,
          date: o.date.toISOString(),
        }))}
      />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-white p-4 border border-slate-200">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}
