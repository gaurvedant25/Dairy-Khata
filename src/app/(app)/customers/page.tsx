import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCustomersWithStats } from "@/lib/business";
import { AddCustomerForm } from "@/components/AddCustomerForm";

export default async function CustomersPage() {
  const session = await auth();
  const customers = await listCustomersWithStats(session!.user.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#4E220F]">Daily customers</h1>
        <p className="text-sm text-slate-500">People you deliver to regularly.</p>
      </div>

      <AddCustomerForm />

      {customers.length === 0 ? (
        <p className="text-sm text-slate-500">No daily customers yet. Add your first one above.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl bg-[#FBF3D1] border border-[#E0CB9E]">
          {customers.map(({ customer, duesInfo }) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F3E7C7]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#4E220F]">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.phone || customer.address || "No contact on file"}</p>
                </div>
                <span className={`text-sm font-semibold ${duesInfo.dues > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {duesInfo.dues > 0 ? `₹${duesInfo.dues.toFixed(2)} due` : "Paid up"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
