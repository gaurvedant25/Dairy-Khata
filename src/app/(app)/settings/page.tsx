import { auth } from "@/lib/auth";
import { getOrCreateSetting, ensureDefaultProducts } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";
import { CustomProductsManager } from "@/components/CustomProductsManager";
import { StarredProductsPicker } from "@/components/StarredProductsPicker";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;
  await ensureDefaultProducts(userId);
  const [setting, customProducts] = await Promise.all([
    getOrCreateSetting(userId),
    prisma.customProduct.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#4E220F]">Settings</h1>
        <p className="text-sm text-slate-500">Defaults used across your customers and deliveries.</p>
      </div>

      <div className="rounded-xl bg-[#FBF3D1] p-6 border border-[#E0CB9E]">
        <SettingsForm
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
    </div>
  );
}
