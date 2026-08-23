"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dailyQuantity, setDailyQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        address,
        dailyQuantity: dailyQuantity ? Number(dailyQuantity) : 1,
        defaultPricePerUnit: price ? Number(price) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    setName("");
    setPhone("");
    setAddress("");
    setDailyQuantity("1");
    setPrice("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Add daily customer
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-4 border border-slate-200">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Name</span>
          <input
            required
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
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            Address <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Daily liters</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            value={dailyQuantity}
            onChange={(e) => setDailyQuantity(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            Price per liter <span className="font-normal text-slate-400">(optional, overrides default)</span>
          </span>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
