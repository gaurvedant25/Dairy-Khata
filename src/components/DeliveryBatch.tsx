"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  pricePerUnit: number;
  dailyQuantity: number;
  currentQuantity: number;
};

export function DeliveryBatch({
  customers,
  initialDate,
  defaultPricePerUnit,
}: {
  customers: { id: string; name: string; pricePerUnit: number; dailyQuantity: number }[];
  initialDate: string;
  defaultPricePerUnit: number;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<Row[]>(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      pricePerUnit: c.pricePerUnit || defaultPricePerUnit,
      dailyQuantity: c.dailyQuantity,
      currentQuantity: c.dailyQuantity,
    }))
  );
  const [loading, startLoading] = useTransition();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.currentQuantity * r.pricePerUnit, 0),
    [rows]
  );
  const doneCount = useMemo(() => rows.filter((r) => r.currentQuantity > 0).length, [rows]);

  useEffect(() => {
    startLoading(async () => {
      const res = await fetch(`/api/deliveries?date=${date}`);
      if (!res.ok) return;
      const data = (await res.json()) as { entries: { customerId: string; quantity: number }[] };
      const byId = new Map(data.entries.map((e) => [e.customerId, e.quantity]));
      const hasAnyEntries = byId.size > 0;
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          // If entries already exist for this date, show them exactly (an
          // explicit 0 means "no delivery"). Otherwise seed with the
          // customer's daily standing order so the user just tweaks
          // exceptions.
          currentQuantity: hasAnyEntries ? byId.get(r.id) ?? 0 : r.dailyQuantity,
        }))
      );
    });
  }, [date]);

  function setQty(id: string, value: string) {
    const n = value === "" ? 0 : Number(value);
    if (Number.isNaN(n) || n < 0) return;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, currentQuantity: n } : r)));
  }

  function toggleDone(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, currentQuantity: r.currentQuantity > 0 ? 0 : r.dailyQuantity || 1 }
          : r
      )
    );
  }

  function markAllDone() {
    setRows((prev) => prev.map((r) => ({ ...r, currentQuantity: r.dailyQuantity || 1 })));
  }

  function markAllSkipped() {
    setRows((prev) => prev.map((r) => ({ ...r, currentQuantity: 0 })));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        entries: rows.map((r) => ({ customerId: r.id, quantity: r.currentQuantity })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to save");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Delivery date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-medium text-slate-500">Day total</p>
          <p className="text-lg font-bold text-slate-900">₹{total.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 border border-slate-200">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">
            {doneCount} of {rows.length}
          </span>{" "}
          marked done
        </p>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={markAllDone}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            ✓ Mark all done
          </button>
          <button
            type="button"
            onClick={markAllSkipped}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            Clear all
          </button>
        </div>
      </div>

      {loading && <p className="text-xs text-slate-400">Loading existing entries…</p>}

      <ul className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200">
        {rows.map((r) => {
          const done = r.currentQuantity > 0;
          return (
            <li key={r.id} className={`flex items-center gap-3 px-4 py-3 ${done ? "" : "opacity-60"}`}>
              <button
                type="button"
                onClick={() => toggleDone(r.id)}
                aria-label={done ? "Mark as skipped" : "Mark as done"}
                aria-pressed={done}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold transition ${
                  done
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                }`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${done ? "text-slate-900" : "text-slate-500 line-through"}`}>
                  {r.name}
                </p>
                <p className="text-xs text-slate-500">
                  ₹{r.pricePerUnit.toFixed(2)}/L · usually {r.dailyQuantity.toFixed(2)} L
                </p>
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                placeholder="0"
                value={r.currentQuantity || ""}
                onChange={(e) => setQty(r.id, e.target.value)}
                className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-right text-base"
              />
              <span className="w-20 text-right text-sm font-medium text-slate-700">
                ₹{(r.currentQuantity * r.pricePerUnit).toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save today's round"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}
