import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCustomersWithStats } from "@/lib/business";
import { TrustBadge } from "@/components/TrustBadge";
import { AddCustomerForm } from "@/components/AddCustomerForm";

export default async function CustomersPage() {
  const session = await auth();
  const customers = await listCustomersWithStats(session!.user.id);

  const totalDailyLiters = customers.reduce((s, c) => s + c.customer.dailyQuantity, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Daily customers</h1>
        <p className="text-sm text-slate-500">
          People you deliver to every day. Set each one&apos;s standard order in liters — it auto-fills on the deliveries page.
        </p>
      </div>

      <AddCustomerForm />

      {customers.length === 0 ? (
        <p className="text-sm text-slate-500">No daily customers yet. Add your first one above.</p>
      ) : (
        <>
          <div className="rounded-xl bg-white p-3 text-sm text-slate-600 border border-slate-200">
            <span className="font-semibold text-slate-900">{customers.length}</span> customers ·{" "}
            <span className="font-semibold text-slate-900">{totalDailyLiters.toFixed(1)} L</span> delivered per day
          </div>
          <ul className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200">
            {customers.map(({ customer, duesInfo, trust }) => (
              <li key={customer.id}>
                <Link
                  href={`/customers/${customer.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{customer.name}</p>
                    <p className="text-xs text-slate-500">
                      {customer.dailyQuantity.toFixed(2)} L/day
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-sm font-semibold ${duesInfo.dues > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {duesInfo.dues > 0 ? `₹${duesInfo.dues.toFixed(2)} due` : "Paid up"}
                    </span>
                    <TrustBadge trust={trust} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
