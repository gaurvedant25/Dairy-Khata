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

  // Build the WhatsApp bill as a day-by-day list of this month's purchases,
  // then the month total and the amount still due.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  type DayItem = { product: string; unit: string; quantity: number; amount: number };
  const byDay = new Map<string, { date: Date; items: DayItem[]; dayTotal: number }>();
  const addToDay = (date: Date, item: DayItem) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const entry = byDay.get(key) ?? { date, items: [], dayTotal: 0 };
    entry.items.push(item);
    entry.dayTotal += item.amount;
    byDay.set(key, entry);
  };

  for (const d of customer.deliveries) {
    if (d.date >= monthStart && d.date < monthEnd) {
      addToDay(d.date, {
        product: d.product,
        unit: d.unit,
        quantity: d.quantity,
        amount: Math.round(d.quantity * d.pricePerUnit * 100) / 100,
      });
    }
  }
  // Unpaid one-time items tied to this customer (e.g. ghee bought on credit).
  for (const o of customer.oneTimeOrders) {
    if (!o.paid && o.date >= monthStart && o.date < monthEnd) {
      addToDay(o.date, { product: o.product, unit: o.unit, quantity: o.quantity, amount: o.amount });
    }
  }

  const days = Array.from(byDay.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((d) => ({
      dateLabel: d.date.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      items: d.items,
      dayTotal: Math.round(d.dayTotal * 100) / 100,
    }));
  const monthTotal = Math.round(days.reduce((s, d) => s + d.dayTotal, 0) * 100) / 100;

  const waNumber = toWhatsAppNumber(customer.phone);
  const billMessage = buildBillMessage({
    customerName: customer.name,
    businessName: setting.businessName,
    monthLabel,
    days,
    monthTotal,
    totalPaid: duesInfo.totalPaid,
    dues: duesInfo.dues,
  });
  const waLink = waNumber ? buildWhatsAppLink(waNumber, billMessage) : null;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/customers" className="text-sm text-[var(--color-accent)] hover:underline">
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
        <StatCard label="Billed" value={`₹${duesInfo.totalBilled.toFixed(2)}`} accent="text-[var(--color-accent-900)]" />
        <StatCard label="Paid" value={`₹${duesInfo.totalPaid.toFixed(2)}`} accent="text-[var(--color-accent-2-700)]" />
        <StatCard
          label="Outstanding"
          value={`₹${duesInfo.dues.toFixed(2)}`}
          accent={duesInfo.dues > 0 ? "text-[var(--color-accent-700)]" : "text-[var(--color-accent-2-700)]"}
        />
      </div>

      {/* Money actions grouped on a tinted panel */}
      <div className="space-y-3 rounded-2xl border border-[var(--color-accent-2-300)] bg-[var(--color-accent-2-100)] p-3">
        {duesInfo.dues > 0 && (
          <section className="rounded-xl border border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--color-neutral-700)]">Send bill on WhatsApp</h2>
              <RemindButton
                customerId={customer.id}
                lastRemindedAt={customer.lastReminderSentAt ? customer.lastReminderSentAt.toISOString() : null}
              />
            </div>
            <WhatsAppBillButton customerId={customer.id} link={waLink} />
            {customer.lastReminderSentAt && (
              <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                Last reminded: {customer.lastReminderSentAt.toLocaleDateString()}
              </p>
            )}
          </section>
        )}

        <section className="rounded-xl border border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)] p-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--color-neutral-700)]">Record payment</h2>
          <AddPaymentForm customerId={customer.id} defaultAmount={duesInfo.dues > 0 ? duesInfo.dues : undefined} />
        </section>
      </div>

      <Collapsible title="Recent deliveries" subtitle={`${customer.deliveries.length}`}>
        {customer.deliveries.length === 0 ? (
          <p className="text-sm text-[var(--color-neutral-600)]">No deliveries yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-divider)] text-sm">
            {customer.deliveries.slice(0, 40).map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[var(--color-accent-900)]">{d.date.toLocaleDateString()}</p>
                  <p className="text-xs text-[var(--color-neutral-600)]">
                    {d.product} · {d.quantity.toFixed(d.unit === "piece" ? 0 : 2)}
                    {d.unit ? ` ${d.unit}` : ""} × ₹{d.pricePerUnit.toFixed(2)}
                  </p>
                </div>
                <span className="font-medium text-[var(--color-accent-900)]">₹{(d.quantity * d.pricePerUnit).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </Collapsible>

      <Collapsible title="Payment history" subtitle={`${customer.payments.length}`}>
        {customer.payments.length === 0 ? (
          <p className="text-sm text-[var(--color-neutral-600)]">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-divider)] text-sm">
            {customer.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[var(--color-accent-900)]">{p.date.toLocaleDateString()}</p>
                  {p.note && <p className="text-xs text-[var(--color-neutral-600)]">{p.note}</p>}
                </div>
                <span className="font-medium text-[var(--color-accent-2-700)]">₹{p.amount.toFixed(2)}</span>
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
    <div className="rounded-xl bg-[var(--color-neutral-100)] p-3 border border-[var(--color-neutral-300)]">
      <p className="text-xs font-medium text-[var(--color-neutral-600)]">{label}</p>
      <p className={`mt-1 text-base font-bold ${accent}`}>{value}</p>
    </div>
  );
}
