import { auth } from "@/lib/auth";
import { getOrCreateSetting } from "@/lib/business";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  const setting = await getOrCreateSetting(session!.user.id);

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
            reminderDayOfMonth: setting.reminderDayOfMonth,
          }}
        />
      </div>
    </div>
  );
}
