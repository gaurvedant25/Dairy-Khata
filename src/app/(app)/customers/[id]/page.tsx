import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCustomerWithStats, getOrCreateSetting } from "@/lib/business";
import { TrustBadge } from "@/components/TrustBadge";
import { AddPaymentForm } from "@/components/AddPaymentForm";
import { EditCustomerForm } from "@/components/EditCustomerForm";
import { RemindButton } from "@/components/RemindButton";
import { WhatsAppBillButton } from "@/components/WhatsAppBillButton";
import { toWhatsAppNumber, buildBillMessage, buildWhatsAppLink } from "@/lib/whatsapp";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const [result, setting] = await Promise.all([
    getCustomerWithStats(id, session!.user.id),
    getOrCreateSetting(session!.user.id),
  ]);
  if (!result) notFound();

  const { customer, duesInfo, trust } = result;

  // Build the WhatsApp bill from the customer's outstanding activity.
  const milkLiters = customer.deliveries.reduce((s, d) => s + d.quantity, 0);
  const milkAmount = customer.deliveries.reduce((s, d) => s + d.quantity * d.pricePerUnit, 0);
  const extraItems = customer.oneTimeOrders
    .filter((o) => !o.paid)
    .map((o) => ({ product: o.product, unit: o.unit, quantity: o.quantity, amount: o.amount }));

  const waNumber = toWhatsAppNumber(customer.phone);
  const billMessage = buildBillMessage({
    customerName: customer.name,
    businessName: setting.businessName,
    milkLiters,
    milkAmount,
    extraItems,
    totalPaid: duesInfo.totalPaid,
    dues: duesInfo.dues,
  });
  const waLink = waNumber ? buildWhatsAppLink(waNumber, billMessage) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/customers" className="text-sm text-slate-500 hover:underline">
          ← Back to daily customers
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
            {customer.address && <p className="text-sm text-slate-500">{customer.address}</p>}
          </div>
          <TrustBadge trust={trust} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total billed" value={`₹${duesInfo.totalBilled.toFixed(2)}`} accent="text-slate-800" />
        <StatCard label="Total paid" value={`₹${duesInfo.totalPaid.toFixed(2)}`} accent="text-emerald-700" />
        <StatCard label="Outstanding" value={`₹${duesInfo.dues.toFixed(2)}`} accent={duesInfo.dues > 0 ? "text-red-700" : "text-slate-800"} />
        <StatCard label="Days overdue" value={duesInfo.daysOverdue.toString()} accent="text-slate-800" />
      </div>

      {duesInfo.dues > 0 && (
        <section className="space-y-3 rounded-xl bg-white p-4 border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Send bill on WhatsApp</h2>
          <WhatsAppBillButton customerId={customer.id} link={waLink} />
          {customer.lastReminderSentAt && (
            <p className="text-xs text-slate-400">Last reminded: {customer.lastReminderSentAt.toLocaleDateString()}</p>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-xl bg-white p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Record payment</h2>
          {duesInfo.dues > 0 && (
            <RemindButton
              customerId={customer.id}
              lastRemindedAt={customer.lastReminderSentAt ? customer.lastReminderSentAt.toISOString() : null}
            />
          )}
        </div>
        <AddPaymentForm customerId={customer.id} defaultAmount={duesInfo.dues > 0 ? duesInfo.dues : undefined} />
      </section>

      <section className="rounded-xl bg-white p-4 border border-slate-200">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Customer details</h2>
        <EditCustomerForm
          customerId={customer.id}
          initial={{
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            defaultPricePerUnit: customer.defaultPricePerUnit?.toString() ?? "",
            dailyQuantity: customer.dailyQuantity.toString(),
            manualTrustRating: customer.manualTrustRating ?? 3,
          }}
        />
      </section>

      <section className="rounded-xl bg-white p-4 border border-slate-200">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent deliveries</h2>
        {customer.deliveries.length === 0 ? (
          <p className="text-sm text-slate-500">No deliveries yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {customer.deliveries.slice(0, 30).map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-800">{d.date.toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">
                    {d.quantity.toFixed(2)} L × ₹{d.pricePerUnit.toFixed(2)}
                  </p>
                </div>
                <span className="font-medium text-slate-800">₹{(d.quantity * d.pricePerUnit).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl bg-white p-4 border border-slate-200">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Payment history</h2>
        {customer.payments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {customer.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-800">{p.date.toLocaleDateString()}</p>
                  {p.note && <p className="text-xs text-slate-500">{p.note}</p>}
                </div>
                <span className="font-medium text-emerald-700">₹{p.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
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
