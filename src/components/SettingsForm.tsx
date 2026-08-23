"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  initial,
}: {
  initial: { businessName: string; defaultPricePerUnit: number; defaultCostPerUnit: number; reminderDayOfMonth: number };
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [price, setPrice] = useState(initial.defaultPricePerUnit.toString());
  const [cost, setCost] = useState(initial.defaultCostPerUnit.toString());
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
        defaultPricePerUnit: Number(price),
        defaultCostPerUnit: Number(cost),
        reminderDayOfMonth: Number(reminderDay),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to save");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500">Business name</label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500">Default price per liter (₹)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Default cost per liter (₹)</label>
          <input
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Reminder day of month (1–28)</label>
        <input
          type="number"
          min={1}
          max={28}
          value={reminderDay}
          onChange={(e) => setReminderDay(e.target.value)}
          className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">Reminders appear starting on this day for customers with outstanding dues.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save settings"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </form>
  );
}
