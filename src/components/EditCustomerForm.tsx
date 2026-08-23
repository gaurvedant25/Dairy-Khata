"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditCustomerForm({
  customerId,
  initial,
}: {
  customerId: string;
  initial: {
    phone: string;
    address: string;
    defaultPricePerUnit: string;
    dailyQuantity: string;
    manualTrustRating: number;
  };
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [price, setPrice] = useState(initial.defaultPricePerUnit);
  const [dailyQuantity, setDailyQuantity] = useState(initial.dailyQuantity);
  const [rating, setRating] = useState(initial.manualTrustRating);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        address,
        defaultPricePerUnit: price ? Number(price) : null,
        dailyQuantity: Number(dailyQuantity),
        manualTrustRating: rating,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            value={dailyQuantity}
            onChange={(e) => setDailyQuantity(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            Price per liter <span className="font-normal text-slate-400">(leave blank to use business default)</span>
          </span>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            Your trust rating <span className="font-normal text-slate-400">(baseline — auto-lowers if payments run late)</span>
          </span>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-2xl leading-none ${n <= rating ? "text-amber-500" : "text-slate-300"}`}
                aria-label={`${n} star`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
