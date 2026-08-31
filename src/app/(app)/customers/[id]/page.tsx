import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCustomerWithStats, getOrCreateSetting, parseCustomRates } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CustomerRates } from "@/components/CustomerRates";
import { Collapsible } from "@/components/Collapsible";
import { AddPaymentForm } from "@/components/AddPaymentForm";
import { EditCustomerForm } from "@/components/EditCustomerForm";
import { WhatsAppBillButton } from "@/components/WhatsAppBillButton";
import { toWhatsAppNumber, buildBillMessage, buildWhatsAppLink } from "@/lib/whatsapp";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const [result, setting, products] = await Promise.all([
    getCustomerWithStats(id, session!.user.id),
    getOrCreateSetting(session!.user.id),
    prisma.customProduct.findMany({
      where: { userId: session!.user.id, active: true },
      orderBy: { name: "asc" },
      select: { name: true, unit: true, pricePerUnit: true },
    }),
  ]);
  if (!result) notFound();

  const { customer } = result;

  // Build the WhatsApp bill as a day-by-day list of this month's purchases,
  // then the month total and the amount still due.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Split the outstanding balance into "previous" (carried in from before this
  // month) vs "this month". Charges = deliveries + unpaid one-time orders.
  // Payments clear the OLDEST charges first (FIFO), using the customer's total
  // payments regardless of when each was made, so what's left in each bucket
  // reads the way a seller thinks ("purana hisaab" vs "is mahine ka") and the
  // two always add up to the outstanding — even when the customer is carrying
  // an advance (paid more than owed).
  const charges = [
    ...customer.deliveries.map((d) => ({ date: d.date, amt: d.quantity * d.pricePerUnit })),
    ...customer.oneTimeOrders.filter((o) => !o.paid).map((o) => ({ date: o.date, amt: o.amount })),
  ];
  const sum = (arr: number[]) => arr.reduce((s, n) => s + n, 0);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const beforeBilled = sum(charges.filter((c) => c.date < monthStart).map((c) => c.amt));
  const monthBilled = sum(charges.filter((c) => c.date >= monthStart).map((c) => c.amt));
  const allPaid = sum(customer.payments.map((p) => p.amount));
  const previousDue = round2(Math.max(0, beforeBilled - allPaid));
  const paidLeftForMonth = Math.max(0, allPaid - beforeBilled); // payment beyond the old balance
  const thisMonthDue = round2(Math.max(0, monthBilled - paidLeftForMonth));
  const totalDue = round2(previousDue + thisMonthDue);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const inMonth = (d: Date) => d >= monthStart && d < monthEnd;

  // Milk deliveries this month, one line per delivery (skip zero-litre days).
  const milkThisMonth = customer.deliveries
    .filter((d) => d.product === "Milk" && d.quantity > 0 && inMonth(d.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const milkDays = milkThisMonth.map((d) => ({
    dateLabel: d.date.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    litres: d.quantity,
    amount: Math.round(d.quantity * d.pricePerUnit * 100) / 100,
  }));
  const totalMilkLitres = Math.round(milkDays.reduce((s, d) => s + d.litres, 0) * 100) / 100;
  // Latest ₹/L charged this month (deliveries are ordered newest-first).
  const milkRate = milkThisMonth.length ? milkThisMonth[milkThisMonth.length - 1].pricePerUnit : null;

  // Non-milk items this month (deliveries + unpaid one-time), summed per product.
  const extrasMap = new Map<string, { product: string; unit: string; quantity: number; amount: number }>();
  const addExtra = (product: string, unit: string, quantity: number, amount: number) => {
    const e = extrasMap.get(product) ?? { product, unit, quantity: 0, amount: 0 };
    e.quantity += quantity;
    e.amount += amount;
    extrasMap.set(product, e);
  };
  for (const d of customer.deliveries) {
    if (d.product !== "Milk" && d.quantity > 0 && inMonth(d.date)) {
      addExtra(d.product, d.unit, d.quantity, Math.round(d.quantity * d.pricePerUnit * 100) / 100);
    }
  }
  for (const o of customer.oneTimeOrders) {
    if (!o.paid && inMonth(o.date)) addExtra(o.product, o.unit, o.quantity, o.amount);
  }
  const extras = Array.from(extrasMap.values()).map((e) => ({
    ...e,
    quantity: Math.round(e.quantity * 100) / 100,
    amount: Math.round(e.amount * 100) / 100,
  }));

  const waNumber = toWhatsAppNumber(customer.phone);
  const billMessage = buildBillMessage({
    businessName: setting.businessName,
    monthLabel,
    milkDays,
    totalMilkLitres,
    milkRate,
    extras,
    previousDue,
    thisMonthDue,
    totalDue,
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

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="This month due"
          value={`₹${thisMonthDue.toFixed(2)}`}
          accent={thisMonthDue > 0 ? "text-[var(--color-accent-900)]" : "text-[var(--color-accent-2-700)]"}
        />
        <StatCard
          label="Previous due"
          value={`₹${previousDue.toFixed(2)}`}
          accent={previousDue > 0 ? "text-[var(--color-accent-700)]" : "text-[var(--color-accent-2-700)]"}
        />
      </div>

      {/* Money actions grouped on a tinted panel */}
      <div className="space-y-3 rounded-2xl border border-[var(--color-accent-2-300)] bg-[var(--color-accent-2-100)] p-3">
        {totalDue > 0 && (
          <section className="rounded-xl border border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)] p-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--color-neutral-700)]">Send bill on WhatsApp</h2>
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
          <AddPaymentForm customerId={customer.id} defaultAmount={totalDue > 0 ? totalDue : undefined} />
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

      <CustomerRates
        customerId={customer.id}
        customerName={customer.name}
        products={products.map((p) => ({ name: p.name, unit: p.unit, globalPrice: p.pricePerUnit }))}
        starred={setting.starredProducts}
        initialRates={parseCustomRates(customer.customRates)}
      />
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
