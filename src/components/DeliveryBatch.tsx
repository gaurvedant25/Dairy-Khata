"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang } from "@/lib/i18n";

type Line = {
  key: string;
  product: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  costPerUnit: number;
  isMilk: boolean;
  custom: boolean; // user-typed one-off item (editable name/unit/price)
};

type CustomerRow = {
  customerId: string;
  name: string;
  lines: Line[];
};

type AvailableProduct = {
  product: string;
  unit: string;
  pricePerUnit: number;
  costPerUnit: number;
};

type SheetLine = {
  product: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  costPerUnit: number;
  isMilk: boolean;
};
type SheetCustomer = {
  customerId: string;
  name: string;
  saved: boolean;
  lines: SheetLine[];
};

function randKey() {
  return Math.random().toString(36).slice(2, 9);
}

function toRow(c: SheetCustomer): CustomerRow {
  return {
    customerId: c.customerId,
    name: c.name,
    lines: c.lines.map((l) => ({ ...l, key: randKey(), custom: false })),
  };
}

export function DeliveryBatch({
  initialCustomers,
  initialDate,
  availableProducts,
  lang = "en",
}: {
  initialCustomers: SheetCustomer[];
  initialDate: string;
  availableProducts: AvailableProduct[];
  lang?: Lang;
}) {
  const router = useRouter();
  const t = (k: string) => translate(lang, k);
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<CustomerRow[]>(initialCustomers.map(toRow));
  const [loading, startLoading] = useTransition();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.lines.reduce((ls, l) => ls + l.quantity * l.pricePerUnit, 0), 0),
    [rows]
  );

  useEffect(() => {
    startLoading(async () => {
      const res = await fetch(`/api/deliveries?date=${date}`);
      if (!res.ok) return;
      const data = (await res.json()) as { customers: SheetCustomer[] };
      setRows(data.customers.map(toRow));
    });
  }, [date]);

  function patchLine(customerId: string, key: string, patch: Partial<Line>) {
    setRows((prev) =>
      prev.map((r) =>
        r.customerId === customerId
          ? { ...r, lines: r.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }
          : r
      )
    );
  }

  function setLineQty(customerId: string, key: string, value: string) {
    const n = value === "" ? 0 : Number(value);
    if (Number.isNaN(n) || n < 0) return;
    patchLine(customerId, key, { quantity: n });
  }

  function addLine(customerId: string, product: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.customerId !== customerId) return r;

        if (product === "__custom__") {
          return {
            ...r,
            lines: [
              ...r.lines,
              {
                key: randKey(),
                product: "",
                unit: "",
                quantity: 1,
                pricePerUnit: 0,
                costPerUnit: 0,
                isMilk: false,
                custom: true,
              },
            ],
          };
        }

        const p = availableProducts.find((a) => a.product === product);
        if (!p || r.lines.some((l) => l.product === p.product)) return r;
        return {
          ...r,
          lines: [
            ...r.lines,
            {
              key: randKey(),
              product: p.product,
              unit: p.unit,
              quantity: 1,
              pricePerUnit: p.pricePerUnit,
              costPerUnit: p.costPerUnit,
              isMilk: p.product === "Milk",
              custom: false,
            },
          ],
        };
      })
    );
  }

  function removeLine(customerId: string, key: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.customerId === customerId ? { ...r, lines: r.lines.filter((l) => l.key !== key) } : r
      )
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        customers: rows.map((r) => ({
          customerId: r.customerId,
          lines: r.lines
            .filter((l) => l.product.trim() !== "")
            .map((l) => ({
              product: l.product.trim(),
              unit: l.unit.trim(),
              quantity: l.quantity,
              pricePerUnit: l.pricePerUnit,
              costPerUnit: l.costPerUnit,
            })),
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to save");
      return;
    }
    setMessage(t("deliv.saved"));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">{t("deliv.date")}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-lg border border-[#D6BE8C] px-3 py-2 text-sm"
          />
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-medium text-slate-500">{t("deliv.dayTotal")}</p>
          <p className="text-lg font-bold text-[#4E220F]">₹{total.toFixed(2)}</p>
        </div>
      </div>

      {loading && <p className="text-xs text-slate-400">Loading…</p>}

      <div className="space-y-3">
        {rows.map((r) => {
          const custTotal = r.lines.reduce((s, l) => s + l.quantity * l.pricePerUnit, 0);
          const addable = availableProducts.filter((a) => !r.lines.some((l) => l.product === a.product));
          return (
            <div key={r.customerId} className="rounded-xl border border-[#E0CB9E] bg-[#FBF3D1] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate font-medium text-[#4E220F]">{r.name}</p>
                <span className="text-sm font-semibold text-slate-800">₹{custTotal.toFixed(2)}</span>
              </div>

              <ul className="space-y-2">
                {r.lines.map((l) =>
                  l.custom ? (
                    <li key={l.key} className="rounded-lg bg-[#F3E7C7] p-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={l.product}
                          onChange={(e) => patchLine(r.customerId, l.key, { product: e.target.value })}
                          placeholder="Item name"
                          className="min-w-0 flex-1 rounded-lg border border-[#D6BE8C] px-2 py-1.5 text-sm"
                          aria-label={`Custom item name for ${r.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeLine(r.customerId, l.key)}
                          className="w-5 shrink-0 text-slate-400 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          value={l.pricePerUnit || ""}
                          onChange={(e) =>
                            patchLine(r.customerId, l.key, { pricePerUnit: Number(e.target.value) || 0 })
                          }
                          placeholder="Price"
                          className="w-20 rounded-lg border border-[#D6BE8C] px-2 py-1.5 text-sm"
                          aria-label="Price"
                        />
                        <input
                          value={l.unit}
                          onChange={(e) => patchLine(r.customerId, l.key, { unit: e.target.value })}
                          placeholder="unit"
                          className="w-16 rounded-lg border border-[#D6BE8C] px-2 py-1.5 text-sm"
                          aria-label="Unit"
                        />
                        <span className="text-xs text-slate-400">×</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min={0}
                          value={l.quantity || ""}
                          onChange={(e) => setLineQty(r.customerId, l.key, e.target.value)}
                          placeholder="Qty"
                          className="w-16 rounded-lg border border-[#D6BE8C] px-2 py-1.5 text-right text-sm"
                          aria-label="Quantity"
                        />
                        <span className="ml-auto text-sm font-medium text-slate-700">
                          ₹{(l.quantity * l.pricePerUnit).toFixed(2)}
                        </span>
                      </div>
                    </li>
                  ) : (
                    <li key={l.key} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">{l.product}</p>
                        <p className="text-xs text-slate-400">
                          ₹{l.pricePerUnit.toFixed(2)}
                          {l.unit ? `/${l.unit}` : ""}
                        </p>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        step={l.unit === "piece" ? "1" : l.isMilk ? "0.1" : "0.5"}
                        min={0}
                        placeholder="0"
                        value={l.quantity || ""}
                        onChange={(e) => setLineQty(r.customerId, l.key, e.target.value)}
                        className="w-16 rounded-lg border border-[#D6BE8C] px-2 py-1.5 text-right text-base"
                        aria-label={`${l.product || "item"} quantity for ${r.name}`}
                      />
                      <span className="w-16 text-right text-xs font-medium text-slate-600">
                        ₹{(l.quantity * l.pricePerUnit).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(r.customerId, l.key)}
                        className="w-5 text-slate-300 hover:text-red-600"
                        aria-label={`Remove ${l.product}`}
                      >
                        ✕
                      </button>
                    </li>
                  )
                )}
              </ul>

              <div className="mt-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addLine(r.customerId, e.target.value);
                    e.target.value = "";
                  }}
                  className="rounded-lg border border-[#E0CB9E] bg-[#F3E7C7] px-2 py-1 text-xs text-slate-600"
                >
                  <option value="">{t("deliv.addItem")}</option>
                  {addable.map((a) => (
                    <option key={a.product} value={a.product}>
                      {a.product} (₹{a.pricePerUnit.toFixed(2)}/{a.unit})
                    </option>
                  ))}
                  <option value="__custom__">{t("deliv.custom")}</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#9D6638] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4E220F] disabled:opacity-60"
        >
          {saving ? t("deliv.saving") : t("deliv.save")}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}
