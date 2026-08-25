"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang } from "@/lib/i18n";

export function SettingsForm({
  initial,
  lang = "en",
}: {
  initial: {
    businessName: string;
    reminderDayOfMonth: number;
  };
  lang?: Lang;
}) {
  const router = useRouter();
  const t = (k: string) => translate(lang, k);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [reminderDay, setReminderDay] = useState(initial.reminderDayOfMonth.toString());
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        reminderDayOfMonth: Number(reminderDay),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to save");
      return;
    }
    setMessage(t("set.saved"));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500">{t("set.businessName")}</label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#D6BE8C] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">{t("set.reminderDay")}</label>
        <input
          type="number"
          min={1}
          max={28}
          value={reminderDay}
          onChange={(e) => setReminderDay(e.target.value)}
          className="mt-1 w-24 rounded-lg border border-[#D6BE8C] px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">{t("set.reminderHint")}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#9D6638] px-4 py-2 text-sm font-medium text-white hover:bg-[#4E220F] disabled:opacity-60"
        >
          {loading ? t("set.saving") : t("set.save")}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </form>
  );
}
