"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CustomProduct = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
};

const COMMON_UNITS = ["kg", "g", "litre", "ml", "cup", "piece", "packet", "dozen"];

export function CustomProductsManager({ products }: { products: CustomProduct[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [customUnit, setCustomUnit] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const noUnit = unit === "__none__";
  const effectiveUnit = noUnit ? "" : unit === "__custom__" ? customUnit.trim() : unit;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!noUnit && !effectiveUnit) {
      setError("Enter a unit");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, unit: effectiveUnit, pricePerUnit: price || 0 }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    setName("");
    setUnit("kg");
    setCustomUnit("");
    setPrice("");
    setOpen(false);
    router.refresh();
  }

  async function remove(p: CustomProduct) {
    setBusyId(p.id);
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmingId(null);
    router.refresh();
  }

  async function updatePrice(p: CustomProduct, newPrice: string) {
    const n = Number(newPrice);
    if (!Number.isFinite(n) || n < 0 || n === p.pricePerUnit) return;
    setBusyId(p.id);
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricePerUnit: n }),
    });
    setBusyId(null);
    router.refresh();
  }

  const inputCls =
    "h-11 w-full rounded-full px-4 text-[14px] text-[var(--color-accent-900)] outline-none placeholder:text-[var(--color-neutral-500)]";
  const inputStyle = { background: "var(--color-bg)", border: "1.5px solid var(--color-neutral-300)" } as const;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-[var(--color-accent-900)]">Your items</h2>
          <p className="mt-0.5 text-[12px] text-[var(--color-neutral-600)]">
            Custom products, with any unit, for the walk-in form.
          </p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-[34px] shrink-0 items-center rounded-full px-3.5 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
            style={{ background: "var(--color-accent-600)" }}
          >
            + Add
          </button>
        )}
      </div>

      {open && (
        <form
          onSubmit={add}
          className="flex flex-col gap-2.5 rounded-2xl p-3.5"
          style={{ background: "var(--color-accent-100)", border: "1.5px solid var(--color-accent-300)" }}
        >
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name, e.g. Ghee"
            className={inputCls}
            style={inputStyle}
          />
          <div className="flex gap-2.5">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-11 flex-1 rounded-full px-4 text-[14px] text-[var(--color-accent-900)] outline-none"
              style={inputStyle}
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="__none__">No unit</option>
              <option value="__custom__">Custom unit…</option>
            </select>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              required={!noUnit}
              placeholder="₹ price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 w-[104px] rounded-full px-4 text-[14px] text-[var(--color-accent-900)] outline-none placeholder:text-[var(--color-neutral-500)]"
              style={inputStyle}
            />
          </div>
          {unit === "__custom__" && (
            <input
              required
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Your unit, e.g. tin, bottle"
              className={inputCls}
              style={inputStyle}
            />
          )}
          {error && <p className="text-sm text-[#8C491A]">{error}</p>}
          <div className="mt-0.5 flex gap-2.5">
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-[42px] flex-1 items-center justify-center rounded-full text-[13.5px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: "var(--color-accent-600)" }}
            >
              {saving ? "Saving…" : "Save item"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="flex min-h-[42px] items-center rounded-full px-4 text-[13px] font-semibold text-[var(--color-neutral-700)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p
          className="rounded-2xl border border-dashed py-4 text-center text-[13px] text-[var(--color-neutral-600)]"
          style={{ borderColor: "var(--color-neutral-300)" }}
        >
          No custom items yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
              style={{ background: "var(--color-neutral-200)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--color-accent-900)]">{p.name}</p>
                <p className="text-[12px] text-[var(--color-neutral-600)]">
                  {p.unit ? `per ${p.unit}` : "no unit"}
                </p>
              </div>
              <div className="flex items-center gap-0.5 text-[13px] font-semibold text-[var(--color-neutral-700)]">
                ₹
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={p.pricePerUnit}
                  onBlur={(e) => updatePrice(p, e.target.value)}
                  disabled={busyId === p.id}
                  className="w-[58px] rounded-lg px-2 py-1.5 text-right text-[13px] text-[var(--color-accent-900)] outline-none disabled:opacity-60"
                  style={{ background: "var(--color-bg)" }}
                />
              </div>
              {confirmingId === p.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => remove(p)}
                    disabled={busyId === p.id}
                    className="flex min-h-[32px] items-center rounded-full px-3 text-[11.5px] font-bold text-white disabled:opacity-60"
                    style={{ background: "var(--color-accent-900)" }}
                  >
                    {busyId === p.id ? "…" : "Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="px-1.5 text-[11.5px] font-semibold text-[var(--color-neutral-600)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(p.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-[var(--color-neutral-500)]"
                  aria-label={`Delete ${p.name}`}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
