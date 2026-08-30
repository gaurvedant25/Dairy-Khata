import { auth } from "@/lib/auth";
import { listOneTimeOrders, ensureDefaultProducts, getOrCreateSetting } from "@/lib/business";
import { getT } from "@/lib/lang";
import { prisma } from "@/lib/prisma";
import { WalkInEntry } from "@/components/WalkInEntry";
import { WalkInRecent } from "@/components/WalkInRecent";

export default async function WalkInPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { t, lang } = await getT();
  await ensureDefaultProducts(userId);
  const [orders, dailyCustomers, allProducts, setting] = await Promise.all([
    listOneTimeOrders(userId, 100),
    prisma.customer.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.customProduct.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, pricePerUnit: true },
    }),
    getOrCreateSetting(userId),
  ]);

  // Only starred items get their own quick chip in the walk-in form; anything
  // else is reached through "Custom". If nothing is starred yet, fall back to
  // all items so the form isn't empty.
  const starred = new Set(setting.starredProducts);
  const userProducts = allProducts.filter((p) => starred.has(p.name));

  // Card shows today's takings, so the label stays honest.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays = orders.filter((o) => o.date >= startOfDay);
  const collected = todays.filter((o) => o.paid).reduce((s, o) => s + o.amount, 0);
  const toCollect = todays.filter((o) => !o.paid).reduce((s, o) => s + o.amount, 0);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="pt-1">
        <h1 className="font-heading text-[24px] leading-tight text-[var(--color-accent-900)]">
          {t("walk.title")}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-neutral-600)]">{t("walk.subtitle")}</p>
      </div>

      <section
        className="relative overflow-hidden rounded-[28px] px-[22px] pb-4 pt-[18px]"
        style={{ background: "var(--color-accent-600)", boxShadow: "var(--shadow-md)" }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-12 h-[150px] w-[150px] rounded-full"
          style={{ background: "rgba(255,255,255,.07)" }}
          aria-hidden
        />
        <p
          className="relative text-[12.5px] font-semibold uppercase tracking-[.1em]"
          style={{ color: "var(--color-accent-200)" }}
        >
          {t("walk.collectedToday")}
        </p>
        <p className="font-heading relative mt-1 text-[40px] leading-none text-white">
          ₹{collected.toFixed(2)}
        </p>
        <div className="relative mt-3 flex items-center gap-4">
          <div>
            <p className="font-heading text-[17px] leading-none text-white">{todays.length}</p>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--color-accent-200)" }}>
              {t("walk.salesCount")}
            </p>
          </div>
          <span className="h-8 w-px" style={{ background: "rgba(255,255,255,.28)" }} aria-hidden />
          <div>
            <p className="font-heading text-[17px] leading-none text-white">₹{toCollect.toFixed(2)}</p>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--color-accent-200)" }}>
              {t("dash.toCollect").toLowerCase()}
            </p>
          </div>
        </div>
      </section>

      <WalkInEntry lang={lang} dailyCustomers={dailyCustomers} userProducts={userProducts} />

      <WalkInRecent
        lang={lang}
        orders={orders.map((o) => ({
          id: o.id,
          customerName: o.customerName,
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
