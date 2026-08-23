"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  customerName: string;
  phone: string | null;
  product: string;
  unit: string;
  quantity: number;
  amount: number;
  paid: boolean;
  date: string; // ISO
};

type ProductKind = "Milk" | "Chai" | "Custom";
const PRODUCTS: ProductKind[] = ["Milk", "Chai", "Custom"];

type DailyCustomerOption = { id: string; name: string; pricePerUnit: number };

export function OneTimeOrders({
  initialOrders,
  defaultPricePerUnit,
  defaultChaiPricePerCup,
  dailyCustomers = [],
}: {
  initialOrders: Order[];
  defaultPricePerUnit: number;
  defaultChaiPricePerCup: number;
  dailyCustomers?: DailyCustomerOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [existingCustomerId, setExistingCustomerId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState<ProductKind>("Milk");
  const [quantity, setQuantity] = useState("");
  const [customProductName, setCustomProductName] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCustomer = dailyCustomers.find((c) => c.id === existingCustomerId) ?? null;
  const milkPricePerUnit = selectedCustomer?.pricePerUnit ?? defaultPricePerUnit;

  const computedAmount = useMemo(() => {
    if (product === "Custom") {
      const a = Number(customAmount);
      return Number.isFinite(a) && a > 0 ? Math.round(a * 100) / 100 : 0;
    }
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) return 0;
    const perUnit = product === "Chai" ? defaultChaiPricePerCup : milkPricePerUnit;
    return Math.round(q * perUnit * 100) / 100;
  }, [product, quantity, customAmount, milkPricePerUnit, defaultChaiPricePerCup]);

  function resetForm() {
    setExistingCustomerId("");
    setName("");
    setPhone("");
    setProduct("Milk");
    setQuantity("");
    setCustomProductName("");
    setCustomAmount("");
    setPaid(false);
    setError(null);
  }

  async function addOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/one-time-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        existingCustomerId: existingCustomerId || undefined,
        customerName: existingCustomerId ? undefined : name,
        phone: existingCustomerId ? undefined : phone,
        product,
        quantity: product === "Custom" ? undefined : quantity,
        customProductName: product === "Custom" ? customProductName : undefined,
        customAmount: product === "Custom" ? customAmount : undefined,
        paid,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    resetForm();
    setShowForm(false);
    router.refresh();
  }

  async function togglePaid(order: Order) {
    setBusyId(order.id);
    await fetch(`/api/one-time-orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !order.paid }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(order: Order) {
    if (!confirm(`Delete this order for ${order.customerName}?`)) return;
    setBusyId(order.id);
    await fetch(`/api/one-time-orders/${order.id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  const unitLabel = product === "Milk" ? "liters" : product === "Chai" ? "cups" : "";
  const perUnitLabel =
    product === "Milk"
      ? `at ₹${milkPricePerUnit.toFixed(2)}/L`
      : product === "Chai"
      ? `at ₹${defaultChaiPricePerCup.toFixed(2)}/cup`
      : "";

  return (
    <div className="rounded-xl bg-white p-4 border border-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">One-time orders</h2>
          <p className="text-xs text-slate-400">Walk-in or casual sales — separate from your regular customers.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            + Add order
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={addOrder} className="mb-4 space-y-3 rounded-lg bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Customer</span>
              <select
                value={existingCustomerId}
                onChange={(e) => setExistingCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">— New walk-in customer —</option>
                {dailyCustomers.length > 0 && (
                  <optgroup label="Daily customers">
                    {dailyCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            {!existingCustomerId && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Customer name</span>
                  <input
                    required={!existingCustomerId}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    Phone <span className="font-normal text-slate-400">(optional)</span>
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>
              </>
            )}

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Product</span>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value as ProductKind)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p === "Custom" ? "Custom item…" : p}
                  </option>
                ))}
              </select>
            </label>

            {product !== "Custom" ? (
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  How many {unitLabel}? <span className="font-normal text-slate-400">({perUnitLabel})</span>
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={product === "Chai" ? "0.5" : "0.1"}
                  min={0}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Item name</span>
                  <input
                    required
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="e.g. Paneer, Butter, Ghee"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Amount (₹)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    required
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>
              </>
            )}

            <div className="rounded-lg bg-white px-3 py-2 text-sm border border-slate-200 sm:col-span-2">
              <span className="text-slate-500">Total: </span>
              <span className="font-semibold text-slate-900">₹{computedAmount.toFixed(2)}</span>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Paid on the spot
            </label>
            {selectedCustomer && (
              <p
                className={`sm:col-span-2 rounded-md px-3 py-2 text-xs ${
                  paid ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                }`}
              >
                {paid
                  ? `Logged as a sale for ${selectedCustomer.name} — will not affect their ledger.`
                  : `Will be added to ${selectedCustomer.name}'s bill (₹${computedAmount.toFixed(2)}).`}
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save order"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {initialOrders.length === 0 ? (
        <p className="text-sm text-slate-500">No one-time orders yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {initialOrders.map((order) => {
            const busy = busyId === order.id;
            const qtyLabel = order.unit
              ? `${order.quantity.toFixed(order.unit === "cup" ? 1 : 2)} ${order.unit}`
              : "";
            return (
              <li key={order.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{order.customerName}</p>
                  <p className="text-xs text-slate-500">
                    {order.product}
                    {qtyLabel ? ` · ${qtyLabel}` : ""} · {new Date(order.date).toLocaleDateString()}
                    {order.phone ? ` · ${order.phone}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-800">₹{order.amount.toFixed(2)}</span>
                <button
                  onClick={() => togglePaid(order)}
                  disabled={busy}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    order.paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  } disabled:opacity-60`}
                >
                  {order.paid ? "Paid" : "Unpaid"}
                </button>
                <button
                  onClick={() => remove(order)}
                  disabled={busy}
                  className="rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-60"
                  aria-label="Delete order"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
