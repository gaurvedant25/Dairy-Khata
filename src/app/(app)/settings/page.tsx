import { auth } from "@/lib/auth";
import { getOrCreateSetting, ensureDefaultProducts } from "@/lib/business";
import { getT } from "@/lib/lang";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";
import { CustomProductsManager } from "@/components/CustomProductsManager";
import { StarredProductsPicker } from "@/components/StarredProductsPicker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InstallAppBox } from "@/components/InstallAppBox";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;
  await ensureDefaultProducts(userId);
  const { lang, t } = await getT();
  const [setting, customProducts] = await Promise.all([
    getOrCreateSetting(userId),
    prisma.customProduct.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const card = "rounded-[28px] border p-5";
  const cardStyle = {
    background: "var(--color-neutral-100)",
    borderColor: "var(--color-neutral-300)",
  } as const;

  return (
    <div className="mx-auto max-w-md space-y-[18px]">
      <div className="pt-1">
        <h1 className="font-heading text-[24px] leading-tight text-[var(--color-accent-900)]">
          {t("set.title")}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-neutral-700)]">{t("set.subtitle")}</p>
      </div>

      {/* Language */}
      <div className={card} style={cardStyle}>
        <LanguageSwitcher current={lang} label={t("set.language")} />
      </div>

      {/* Business info */}
      <div className={card} style={cardStyle}>
        <SettingsForm
          lang={lang}
          initial={{
            businessName: setting.businessName,
            reminderDayOfMonth: setting.reminderDayOfMonth,
          }}
        />
      </div>

      {/* Your items */}
      <div className={card} style={cardStyle}>
        <CustomProductsManager
          products={customProducts.map((p) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            pricePerUnit: p.pricePerUnit,
          }))}
        />
      </div>

      {/* Star items — sage */}
      <div
        className={card}
        style={{ background: "var(--color-accent-2-100, #f0fae1)", borderColor: "var(--color-accent-2-300)" }}
      >
        <StarredProductsPicker
          initialStarred={setting.starredProducts}
          options={customProducts.map((p) => ({ name: p.name, unit: p.unit, builtin: false }))}
        />
      </div>

      {/* Install — dark brown */}
      <div className="rounded-[28px] p-5" style={{ background: "var(--color-accent-800)" }}>
        <InstallAppBox
          title={t("set.installTitle")}
          bodyAndroid={t("set.installAndroid")}
          bodyIos={t("set.installIos")}
          installed={t("set.installed")}
          button={t("set.installBtn")}
        />
      </div>

      {/* Subscription — brown */}
      <Link
        href="/subscription"
        className="flex items-center justify-between gap-3 rounded-[28px] p-5 text-white transition active:scale-[0.99]"
        style={{ background: "var(--color-accent)" }}
      >
        <div>
          <h2 className="text-[14.5px] font-semibold">{t("set.subscription")}</h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-accent-100)" }}>
            {t("set.subManage")}
          </p>
        </div>
        <span className="text-xl">›</span>
      </Link>
    </div>
  );
}
