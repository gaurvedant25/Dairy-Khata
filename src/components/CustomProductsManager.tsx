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

  const effectiveUnit = unit === "__custom__" ? customUnit.trim() : unit;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!effectiveUnit) {
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
    if (!confirm(`Delete "${p.name}"? Past orders that used it are not affected.`)) return;
    setBusyId(p.id);
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    setBusyId(null);
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

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Your items</h2>
          <p className="text-xs text-slate-400">
            Add your own products with any unit — they appear in the walk-in order form.
          </p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg bg-[#9D6638] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4E220F]"
          >
            + Add item
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={add} className="space-y-3 rounded-lg bg-[#F3E7C7] p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Item name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ghee"
                className="w-full rounded-lg border border-[#D6BE8C] bg-[#FBF3D1] px-3 py-2 text-sm text-[#4E220F] placeholder:text-slate-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Unit</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-[#D6BE8C] bg-[#FBF3D1] px-3 py-2 text-sm text-[#4E220F]"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="__custom__">Custom unit…</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Price per {effectiveUnit || "unit"} (₹)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-[#D6BE8C] bg-[#FBF3D1] px-3 py-2 text-sm text-[#4E220F]"
              />
            </label>
            {unit === "__custom__" && (
              <label className="block sm:col-span-3">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Your unit name</span>
                <input
                  required
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="e.g. tin, bottle, box"
                  className="w-full rounded-lg border border-[#D6BE8C] bg-[#FBF3D1] px-3 py-2 text-sm text-[#4E220F] placeholder:text-slate-400"
                />
              </label>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#9D6638] px-4 py-2 text-sm font-medium text-white hover:bg-[#4E220F] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save item"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-sm text-slate-500">No custom items yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-[#E0CB9E]">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#4E220F]">{p.name}</p>
                <p className="text-xs text-slate-500">per {p.unit}</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <span>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={p.pricePerUnit}
                  onBlur={(e) => updatePrice(p, e.target.value)}
                  disabled={busyId === p.id}
                  className="w-20 rounded-lg border border-[#D6BE8C] px-2 py-1 text-right text-sm text-[#4E220F] disabled:opacity-60"
                />
              </div>
              <button
                onClick={() => remove(p)}
                disabled={busyId === p.id}
                className="rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-60"
                aria-label={`Delete ${p.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
