import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCustomerWithStats, getOrCreateSetting } from "@/lib/business";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Collapsible } from "@/components/Collapsible";
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

  const { customer, duesInfo } = result;

  // Build the WhatsApp bill from the customer's activity, grouping the daily
  // round by product (Milk, Dahi, …) plus any unpaid one-time items.
  const deliveryGroups = new Map<string, { product: string; unit: string; quantity: number; amount: number }>();
  for (const d of customer.deliveries) {
    const g = deliveryGroups.get(d.product) ?? { product: d.product, unit: d.unit, quantity: 0, amount: 0 };
    g.quantity += d.quantity;
    g.amount += d.quantity * d.pricePerUnit;
    deliveryGroups.set(d.product, g);
  }
  const deliveryItems = Array.from(deliveryGroups.values()).map((g) => ({
    ...g,
    amount: Math.round(g.amount * 100) / 100,
  }));
  const extraItems = customer.oneTimeOrders
    .filter((o) => !o.paid)
    .map((o) => ({ product: o.product, unit: o.unit, quantity: o.quantity, amount: o.amount }));

  const waNumber = toWhatsAppNumber(customer.phone);
  const billMessage = buildBillMessage({
    customerName: customer.name,
    businessName: setting.businessName,
    deliveryItems,
    extraItems,
    totalPaid: duesInfo.totalPaid,
    dues: duesInfo.dues,
  });
  const waLink = waNumber ? buildWhatsAppLink(waNumber, billMessage) : null;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/customers" className="text-sm text-slate-500 hover:underline">
          ← Back to daily customers
        </Link>
        <div className="mt-2">
          <CustomerHeader name={customer.name} address={customer.address}>
            <EditCustomerForm
              customerId={customer.id}
              initial={{
                name: customer.name,
                phone: customer.phone ?? "",
                address: customer.address ?? "",
              }}
            />
          </CustomerHeader>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Billed" value={`₹${duesInfo.totalBilled.toFixed(2)}`} accent="text-slate-800" />
        <StatCard label="Paid" value={`₹${duesInfo.totalPaid.toFixed(2)}`} accent="text-emerald-700" />
        <StatCard
          label="Outstanding"
          value={`₹${duesInfo.dues.toFixed(2)}`}
          accent={duesInfo.dues > 0 ? "text-red-700" : "text-slate-800"}
        />
      </div>

      {/* Money actions grouped on a tinted panel */}
      <div className="space-y-3 rounded-2xl border border-[#B0BA99] bg-[#B0BA99]/25 p-3">
        {duesInfo.dues > 0 && (
          <section className="rounded-xl border border-[#E0CB9E] bg-[#FBF3D1] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-700">Send bill on WhatsApp</h2>
              <RemindButton
                customerId={customer.id}
                lastRemindedAt={customer.lastReminderSentAt ? customer.lastReminderSentAt.toISOString() : null}
              />
            </div>
            <WhatsAppBillButton customerId={customer.id} link={waLink} />
            {customer.lastReminderSentAt && (
              <p className="mt-2 text-xs text-slate-400">
                Last reminded: {customer.lastReminderSentAt.toLocaleDateString()}
              </p>
            )}
          </section>
        )}

        <section className="rounded-xl border border-[#E0CB9E] bg-[#FBF3D1] p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Record payment</h2>
          <AddPaymentForm customerId={customer.id} defaultAmount={duesInfo.dues > 0 ? duesInfo.dues : undefined} />
        </section>
      </div>

      <Collapsible title="Recent deliveries" subtitle={`${customer.deliveries.length}`}>
        {customer.deliveries.length === 0 ? (
          <p className="text-sm text-slate-500">No deliveries yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {customer.deliveries.slice(0, 40).map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-800">{d.date.toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">
                    {d.product} · {d.quantity.toFixed(d.unit === "piece" ? 0 : 2)}
                    {d.unit ? ` ${d.unit}` : ""} × ₹{d.pricePerUnit.toFixed(2)}
                  </p>
                </div>
                <span className="font-medium text-slate-800">₹{(d.quantity * d.pricePerUnit).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </Collapsible>

      <Collapsible title="Payment history" subtitle={`${customer.payments.length}`}>
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
      </Collapsible>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-[#FBF3D1] p-3 border border-[#E0CB9E]">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${accent}`}>{value}</p>
    </div>
  );
}
