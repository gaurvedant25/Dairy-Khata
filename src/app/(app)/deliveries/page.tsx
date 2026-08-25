import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeliverySheet } from "@/lib/business";
import { getT } from "@/lib/lang";
import { DeliveryBatch } from "@/components/DeliveryBatch";
import Link from "next/link";

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DeliveriesPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { t, lang } = await getT();
  const today = isoLocal(new Date());

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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#4E220F]">{t("deliv.title")}</h1>
        <p className="text-sm text-slate-500">{t("deliv.subtitle")}</p>
      </div>

      {customerCount === 0 ? (
        <div className="rounded-xl bg-[#FBF3D1] p-6 text-center border border-[#E0CB9E]">
          <p className="text-sm text-slate-500">{t("deliv.needCustomers")}</p>
          <Link
            href="/customers"
            className="mt-3 inline-block rounded-lg bg-[#9D6638] px-4 py-2 text-sm font-medium text-white hover:bg-[#4E220F]"
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
