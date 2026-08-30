import { auth } from "@/lib/auth";
import { listCustomersWithStats } from "@/lib/business";
import { getT } from "@/lib/lang";
import { CustomerList } from "@/components/CustomerList";

export default async function CustomersPage() {
  const session = await auth();
  const { t, lang } = await getT();
  const withStats = await listCustomersWithStats(session!.user.id);

  const customers = withStats.map(({ customer, duesInfo }) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    dues: duesInfo.dues,
  }));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="pt-1">
        <h1 className="font-heading text-[24px] leading-tight text-[var(--color-accent-900)]">
          {t("cust.title")}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-neutral-600)]">{t("cust.subtitle")}</p>
      </div>

      <CustomerList customers={customers} lang={lang} />
    </div>
  );
}
