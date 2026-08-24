import { auth } from "@/lib/auth";
import { getOrCreateSetting, BUILTIN_UNITS } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";
import { CustomProductsManager } from "@/components/CustomProductsManager";
import { StarredProductsPicker } from "@/components/StarredProductsPicker";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [setting, customProducts] = await Promise.all([
    getOrCreateSetting(userId),
    prisma.customProduct.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Defaults used across your customers and deliveries.</p>
      </div>

      <div className="rounded-xl bg-white p-6 border border-slate-200">
        <SettingsForm
          initial={{
            businessName: setting.businessName,
            defaultPricePerUnit: setting.defaultPricePerUnit,
            defaultCostPerUnit: setting.defaultCostPerUnit,
            defaultChaiPricePerCup: setting.defaultChaiPricePerCup,
            defaultDahiPricePerCup: setting.defaultDahiPricePerCup,
            defaultPaneerPricePerPiece: setting.defaultPaneerPricePerPiece,
            reminderDayOfMonth: setting.reminderDayOfMonth,
          }}
        />
      </div>

      <div className="rounded-xl bg-white p-6 border border-slate-200">
        <CustomProductsManager
          products={customProducts.map((p) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            pricePerUnit: p.pricePerUnit,
          }))}
        />
      </div>

      <div className="rounded-xl bg-white p-6 border border-slate-200">
        <StarredProductsPicker
          initialStarred={setting.starredProducts}
          options={[
            ...Object.entries(BUILTIN_UNITS).map(([name, unit]) => ({ name, unit, builtin: true })),
            ...customProducts.map((p) => ({ name: p.name, unit: p.unit, builtin: false })),
          ]}
        />
      </div>
    </div>
  );
}
