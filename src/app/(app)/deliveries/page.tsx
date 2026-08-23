import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSetting } from "@/lib/business";
import { DeliveryBatch } from "@/components/DeliveryBatch";
import Link from "next/link";

export default async function DeliveriesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [setting, customers] = await Promise.all([
    getOrCreateSetting(userId),
    prisma.customer.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, defaultPricePerUnit: true, dailyQuantity: true },
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Log deliveries</h1>
        <p className="text-sm text-slate-500">Enter the liters delivered for each customer today, then save.</p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center border border-slate-200">
          <p className="text-sm text-slate-500">Add customers first to start logging deliveries.</p>
          <Link
            href="/customers"
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to customers
          </Link>
        </div>
      ) : (
        <DeliveryBatch
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            pricePerUnit: c.defaultPricePerUnit ?? setting.defaultPricePerUnit,
            dailyQuantity: c.dailyQuantity,
          }))}
          initialDate={today}
          defaultPricePerUnit={setting.defaultPricePerUnit}
        />
      )}
    </div>
  );
}
