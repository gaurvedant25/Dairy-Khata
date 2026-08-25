import { auth } from "@/lib/auth";
import { getOrCreateSetting, ensureDefaultProducts } from "@/lib/business";
import { getT } from "@/lib/lang";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";
import { CustomProductsManager } from "@/components/CustomProductsManager";
import { StarredProductsPicker } from "@/components/StarredProductsPicker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InstallAppBox } from "@/components/InstallAppBox";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;
  await ensureDefaultProducts(userId);
  const { lang, t } = await getT();
  const [setting, customProducts] = await Promise.all([
    getOrCreateSetting(userId),
    prisma.customProduct.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#4E220F]">{t("set.title")}</h1>
        <p className="text-sm text-slate-500">{t("set.subtitle")}</p>
      </div>

      <div className="rounded-xl bg-[#FBF3D1] p-6 border border-[#E0CB9E]">
        <LanguageSwitcher current={lang} label={t("set.language")} />
      </div>

      <div className="rounded-xl bg-[#FBF3D1] p-6 border border-[#E0CB9E]">
        <SettingsForm
          lang={lang}
          initial={{
            businessName: setting.businessName,
            reminderDayOfMonth: setting.reminderDayOfMonth,
          }}
        />
      </div>

      <div className="rounded-xl bg-[#FBF3D1] p-6 border border-[#E0CB9E]">
        <CustomProductsManager
          products={customProducts.map((p) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            pricePerUnit: p.pricePerUnit,
          }))}
        />
      </div>

      <div className="rounded-xl bg-[#FBF3D1] p-6 border border-[#E0CB9E]">
        <StarredProductsPicker
          initialStarred={setting.starredProducts}
          options={customProducts.map((p) => ({ name: p.name, unit: p.unit, builtin: false }))}
        />
      </div>

      <div className="rounded-xl bg-[#9D6638] p-6">
        <InstallAppBox
          title={t("set.installTitle")}
          bodyAndroid={t("set.installAndroid")}
          bodyIos={t("set.installIos")}
          installed={t("set.installed")}
          button={t("set.installBtn")}
        />
      </div>
    </div>
  );
}
