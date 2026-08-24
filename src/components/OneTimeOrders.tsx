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

type ProductKind = "Milk" | "Chai" | "Dahi" | "Paneer" | "Custom" | "UserProduct";
const BUILTINS: ProductKind[] = ["Milk", "Chai", "Dahi", "Paneer"];

type DailyCustomerOption = { id: string; name: string; pricePerUnit: number };
type UserProduct = { id: string; name: string; unit: string; pricePerUnit: number };

type ItemDraft = {
  key: string;
  product: ProductKind;
  userProductId: string;
  quantity: string;
  customProductName: string;
  customAmount: string;
};

function newItem(): ItemDraft {
  return {
    key: Math.random().toString(36).slice(2, 9),
    product: "Milk",
    userProductId: "",
    quantity: "",
    customProductName: "",
    customAmount: "",
  };
}

export function OneTimeOrders({
  initialOrders,
  defaultPricePerUnit,
  defaultChaiPricePerCup,
  defaultDahiPricePerCup,
  defaultPaneerPricePerPiece,
  dailyCustomers = [],
  userProducts = [],
}: {
  initialOrders: Order[];
  defaultPricePerUnit: number;
  defaultChaiPricePerCup: number;
  defaultDahiPricePerCup: number;
  defaultPaneerPricePerPiece: number;
  dailyCustomers?: DailyCustomerOption[];
  userProducts?: UserProduct[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [existingCustomerId, setExistingCustomerId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCustomer = dailyCustomers.find((c) => c.id === existingCustomerId) ?? null;
  const milkPricePerUnit = selectedCustomer?.pricePerUnit ?? defaultPricePerUnit;

  function unitFor(it: ItemDraft) {
    const p = it.product;
    if (p === "Milk") return { unit: "liters", step: "0.1", per: `₹${milkPricePerUnit.toFixed(2)}/L` };
    if (p === "Chai") return { unit: "cups", step: "0.5", per: `₹${defaultChaiPricePerCup.toFixed(2)}/cup` };
    if (p === "Dahi") return { unit: "cups", step: "0.5", per: `₹${defaultDahiPricePerCup.toFixed(2)}/cup` };
    if (p === "Paneer") return { unit: "pieces", step: "1", per: `₹${defaultPaneerPricePerPiece.toFixed(2)}/piece` };
    if (p === "UserProduct") {
      const up = userProducts.find((u) => u.id === it.userProductId);
      if (up) return { unit: up.unit, step: "0.1", per: `₹${up.pricePerUnit.toFixed(2)}/${up.unit}` };
    }
    return { unit: "", step: "0.01", per: "" };
  }

  function priceFor(it: ItemDraft) {
    const p = it.product;
    if (p === "Milk") return milkPricePerUnit;
    if (p === "Chai") return defaultChaiPricePerCup;
    if (p === "Dahi") return defaultDahiPricePerCup;
    if (p === "Paneer") return defaultPaneerPricePerPiece;
    if (p === "UserProduct") {
      return userProducts.find((u) => u.id === it.userProductId)?.pricePerUnit ?? 0;
    }
    return 0;
  }

  function lineAmount(it: ItemDraft) {
    if (it.product === "Custom") {
      const a = Number(it.customAmount);
      return Number.isFinite(a) && a > 0 ? Math.round(a * 100) / 100 : 0;
    }
    const q = Number(it.quantity);
    if (!Number.isFinite(q) || q <= 0) return 0;
    return Math.round(q * priceFor(it) * 100) / 100;
  }

  const total = useMemo(() => items.reduce((s, it) => s + lineAmount(it), 0), [items, milkPricePerUnit]);

  function resetForm() {
    setExistingCustomerId("");
    setName("");
    setPhone("");
    setItems([newItem()]);
    setPaid(false);
    setError(null);
  }

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.key !== key)));
  }

  async function addOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payloadItems = items.map((it) => {
      if (it.product === "Custom") {
        return {
          product: "Custom",
          customProductName: it.customProductName,
          customAmount: it.customAmount,
        };
      }
      if (it.product === "UserProduct") {
        return { product: "UserProduct", userProductId: it.userProductId, quantity: it.quantity };
      }
      return { product: it.product, quantity: it.quantity };
    });
    const res = await fetch("/api/one-time-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        existingCustomerId: existingCustomerId || undefined,
        customerName: existingCustomerId ? undefined : name,
        phone: existingCustomerId ? undefined : phone,
        items: payloadItems,
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Items</span>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, newItem()])}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                + Add another item
              </button>
            </div>

            {items.map((it, idx) => {
              const { unit, step, per } = unitFor(it);
              const selectValue = it.product === "UserProduct" ? `up:${it.userProductId}` : it.product;
              return (
                <div
                  key={it.key}
                  className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(it.key)}
                        className="text-xs text-slate-400 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Product</span>
                    <select
                      value={selectValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.startsWith("up:")) {
                          updateItem(it.key, { product: "UserProduct", userProductId: v.slice(3) });
                        } else {
                          updateItem(it.key, { product: v as ProductKind, userProductId: "" });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {BUILTINS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      {userProducts.length > 0 && (
                        <optgroup label="Your items">
                          {userProducts.map((up) => (
                            <option key={up.id} value={`up:${up.id}`}>
                              {up.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <option value="Custom">One-off item…</option>
                    </select>
                  </label>

                  {it.product !== "Custom" ? (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">
                        How many {unit}? <span className="font-normal text-slate-400">(at {per})</span>
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step={step}
                        min={0}
                        required
                        value={it.quantity}
                        onChange={(e) => updateItem(it.key, { quantity: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </label>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Item name</span>
                        <input
                          required
                          value={it.customProductName}
                          onChange={(e) => updateItem(it.key, { customProductName: e.target.value })}
                          placeholder="e.g. Butter, Ghee"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Amount (₹)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          required
                          value={it.customAmount}
                          onChange={(e) => updateItem(it.key, { customAmount: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                    </div>
                  )}

                  <div className="text-right text-xs text-slate-500">
                    Line total: <span className="font-semibold text-slate-800">₹{lineAmount(it).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-white px-3 py-2 text-sm border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500">Order total</span>
            <span className="font-semibold text-slate-900">₹{total.toFixed(2)}</span>
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
              className={`rounded-md px-3 py-2 text-xs ${
                paid ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {paid
                ? `Logged as sales for ${selectedCustomer.name} — will not affect their ledger.`
                : `Will be added to ${selectedCustomer.name}'s bill (₹${total.toFixed(2)}).`}
            </p>
          )}

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
              ? `${order.quantity.toFixed(order.unit === "cup" ? 1 : order.unit === "piece" ? 0 : 2)} ${order.unit}`
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
