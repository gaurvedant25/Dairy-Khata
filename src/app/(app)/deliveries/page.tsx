import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeliverySheet } from "@/lib/business";
import { getT } from "@/lib/lang";
import { DeliveryBatch } from "@/components/DeliveryBatch";
import { istToday } from "@/lib/date";
import Link from "next/link";

export default async function DeliveriesPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { t, lang } = await getT();
  const today = istToday();

  const [sheet, userProducts, customerCount] = await Promise.all([
    getDeliverySheet(userId, today),
    prisma.customProduct.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
      select: { name: true, unit: true, pricePerUnit: true },
    }),
    prisma.customer.count({ where: { userId, active: true } }),
  ]);

  // Every saved item the owner can add to a customer's sheet.
  const availableProducts = userProducts.map((p) => ({
    product: p.name,
    unit: p.unit,
    pricePerUnit: p.pricePerUnit,
    costPerUnit: 0,
  }));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="pt-1">
        <h1 className="font-heading text-[24px] leading-tight text-[var(--color-accent-900)]">
          {t("deliv.title")}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-neutral-600)]">{t("deliv.subtitle")}</p>
      </div>

      {customerCount === 0 ? (
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: "var(--color-neutral-100)", borderColor: "var(--color-divider)" }}
        >
          <p className="text-sm text-[var(--color-neutral-600)]">{t("deliv.needCustomers")}</p>
          <Link
            href="/customers"
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold text-white"
            style={{ background: "var(--color-accent-600)" }}
          >
            {t("deliv.goCustomers")}
          </Link>
        </div>
      ) : (
        <DeliveryBatch initialCustomers={sheet} initialDate={today} availableProducts={availableProducts} lang={lang} />
      )}
    </div>
  );
}
