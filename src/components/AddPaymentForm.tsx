"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddPaymentForm({ customerId, defaultAmount }: { customerId: string; defaultAmount?: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(defaultAmount && defaultAmount > 0 ? String(defaultAmount) : "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, date, note }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs font-medium text-[var(--color-neutral-600)]">Amount</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-accent-900)]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--color-neutral-600)]">Date</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-accent-900)]"
        />
      </div>
      <div className="flex-1 min-w-[120px]">
        <label className="block text-xs font-medium text-[var(--color-neutral-600)]">Note (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-accent-900)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--color-accent-2-600)" }}
      >
        {loading ? "Saving..." : "Record payment"}
      </button>
      {error && <p className="w-full text-sm text-[var(--color-accent-700)]">{error}</p>}
    </form>
  );
}
