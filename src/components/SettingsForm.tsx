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
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // reminderDayOfMonth kept unchanged — the setting still exists, it's just
      // not surfaced (monthly reminders were removed from the UI).
      body: JSON.stringify({ businessName, reminderDayOfMonth: initial.reminderDayOfMonth }),
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

  const fieldLabel =
    "text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--color-neutral-600)]";

  return (
    <div className="flex flex-col gap-3.5">
      <span className="text-[13px] font-semibold text-[var(--color-accent-900)]">{t("set.businessInfo")}</span>

      <label className="flex flex-col gap-2">
        <span className={fieldLabel}>{t("set.businessName")}</span>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="h-12 w-full rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none"
          style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-neutral-300)" }}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="flex min-h-[44px] items-center rounded-full px-5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: "var(--color-accent-600)", boxShadow: "var(--shadow-sm)" }}
        >
          {loading ? t("set.saving") : t("set.save")}
        </button>
        {message && <p className="text-sm text-[var(--color-neutral-600)]">{message}</p>}
      </div>
    </div>
  );
}
