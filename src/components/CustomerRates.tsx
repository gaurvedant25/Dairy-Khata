"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductRow = { name: string; unit: string; globalPrice: number };

export function CustomerRates({
  customerId,
  customerName,
  products,
  starred,
  initialRates,
}: {
  customerId: string;
  customerName: string;
  products: ProductRow[];
  starred: string[];
  initialRates: Record<string, number>;
}) {
  const router = useRouter();
  const starredSet = useMemo(() => new Set(starred), [starred]);

  const initialStrings = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of products) m[p.name] = initialRates[p.name] != null ? String(initialRates[p.name]) : "";
    return m;
  }, [products, initialRates]);

  const [values, setValues] = useState<Record<string, string>>(initialStrings);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = products.some((p) => (values[p.name] ?? "") !== (initialStrings[p.name] ?? ""));

  function set(name: string, v: string) {
    setValues((s) => ({ ...s, [name]: v }));
    setConfirming(false);
    setMessage(null);
  }

  async function save() {
    const rates: Record<string, number> = {};
    for (const p of products) {
      const raw = (values[p.name] ?? "").trim();
      if (raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) rates[p.name] = Math.round(n * 100) / 100;
    }
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/customers/${customerId}/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rates }),
    });
    setSaving(false);
    setConfirming(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Could not save");
      return;
    }
    const data = (await res.json()) as { repriced: number };
    setMessage(
      data.repriced > 0
        ? `Saved · ${data.repriced} of this month's deliveries re-priced.`
        : "Saved.",
    );
    router.refresh();
  }

  const starredRows = products.filter((p) => starredSet.has(p.name));
  const otherRows = products.filter((p) => !starredSet.has(p.name));

  function Row({ p, highlight }: { p: ProductRow; highlight?: boolean }) {
    const custom = (values[p.name] ?? "").trim() !== "";
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold"
            style={{ color: highlight ? "var(--color-accent-2-900)" : "var(--color-accent-900)" }}
          >
            {p.name}
          </p>
          <p
            className="text-[12px]"
            style={{ color: highlight ? "var(--color-accent-2-700)" : "var(--color-neutral-600)" }}
          >
            Standard ₹{p.globalPrice.toFixed(2)}
            {p.unit ? ` / ${p.unit}` : ""}
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2.5"
          style={{
            background: "var(--color-bg)",
            border: `1.5px solid ${custom ? "var(--color-accent-600)" : "var(--color-neutral-300)"}`,
          }}
        >
          <span className="text-[13px] font-semibold text-[var(--color-neutral-600)]">₹</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={values[p.name] ?? ""}
            onChange={(e) => set(p.name, e.target.value)}
            placeholder={p.globalPrice.toFixed(0)}
            aria-label={`Custom rate for ${p.name}`}
            className="h-10 w-[64px] bg-transparent text-right text-[15px] font-semibold text-[var(--color-accent-900)] outline-none placeholder:font-normal placeholder:text-[var(--color-neutral-500)]"
          />
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-4"
      style={{ background: "var(--color-neutral-100)", borderColor: "var(--color-neutral-300)" }}
    >
      <h2 className="text-sm font-semibold text-[var(--color-accent-900)]">Rates for {customerName}</h2>
      <p className="mt-0.5 text-[12px] text-[var(--color-neutral-600)]">
        Set a special price for this customer. Blank = standard rate.
      </p>

      {starredRows.length > 0 && (
        <div
          className="mt-3 rounded-xl px-3 py-1"
          style={{ background: "var(--color-accent-2-100)", border: "1.5px solid var(--color-accent-2-300)" }}
        >
          <div className="flex items-center gap-1.5 pt-2 text-[11px] font-bold uppercase tracking-[.06em]" style={{ color: "var(--color-accent-2-700)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M11.5 3.2 14 8.4l5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
            </svg>
            Starred items
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-accent-2-300)" }}>
            {starredRows.map((p) => (
              <Row key={p.name} p={p} highlight />
            ))}
          </div>
        </div>
      )}

      {otherRows.length > 0 && (
        <div className="mt-2 divide-y" style={{ borderColor: "var(--color-divider)" }}>
          {otherRows.map((p) => (
            <Row key={p.name} p={p} />
          ))}
        </div>
      )}

      <div className="mt-3">
        {confirming ? (
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--color-peach-bg)", color: "var(--color-peach-fg)" }}
          >
            <p className="text-[13px] font-medium">
              Applies to this month&apos;s deliveries and future orders. Previous months are not changed.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex min-h-[40px] items-center rounded-full px-4 text-[13.5px] font-bold text-white disabled:opacity-60"
                style={{ background: "var(--color-accent-600)" }}
              >
                {saving ? "Saving…" : "Save rates"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-2 text-[13px] font-semibold text-[var(--color-neutral-600)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!dirty || saving}
              className="flex min-h-[44px] items-center rounded-full px-5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--color-accent-600)" }}
            >
              Save rates
            </button>
            {message && <p className="text-sm text-[var(--color-neutral-600)]">{message}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
