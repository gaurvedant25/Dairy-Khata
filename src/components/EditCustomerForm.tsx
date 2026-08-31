"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditCustomerForm({
  customerId,
  initial,
}: {
  customerId: string;
  initial: { name: string; phone: string; address: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
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
      body: JSON.stringify({ name, phone, address }),
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
          <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-accent-900)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-accent-900)]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">Address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-accent-900)]"
          />
        </label>
      </div>
      {error && <p className="text-sm text-[var(--color-accent-700)]">{error}</p>}
      {saved && <p className="text-sm text-[var(--color-accent-2-700)]">Saved.</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--color-accent-600)" }}
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
