"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang } from "@/lib/i18n";

type Order = {
  id: string;
  customerName: string;
  product: string;
  unit: string;
  quantity: number;
  amount: number;
  paid: boolean;
  date: string;
};

export function WalkInRecent({ orders, lang = "en" }: { orders: Order[]; lang?: Lang }) {
  const router = useRouter();
  const t = (k: string, v?: Record<string, string | number>) => translate(lang, k, v);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function togglePaid(o: Order) {
    setBusyId(o.id);
    await fetch(`/api/one-time-orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !o.paid }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(o: Order) {
    setBusyId(o.id);
    await fetch(`/api/one-time-orders/${o.id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmId(null);
    router.refresh();
  }

  return (
    <section>
      <h2 className="font-heading mb-2 px-1 text-[17px] text-[var(--color-accent-900)]">{t("walk.recent")}</h2>
      {orders.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-neutral-600)]">{t("dash.noWalkin")}</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl" style={{ background: "var(--color-neutral-100)" }}>
          {orders.map((o, i) => {
            const busy = busyId === o.id;
            const qty = o.unit ? `${o.quantity.toFixed(o.unit === "piece" ? 0 : 1)} ${o.unit}` : "";
            return (
              <li
                key={o.id}
                className="flex items-center gap-2.5 px-3.5 py-2.5"
                style={i > 0 ? { borderTop: "1px solid var(--color-divider)" } : undefined}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[var(--color-accent-900)]">
                    {o.customerName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-neutral-600)]">
                    {o.product}
                    {qty ? ` · ${qty}` : ""} · {new Date(o.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[var(--color-accent-900)]">
                  ₹{o.amount.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => togglePaid(o)}
                  disabled={busy}
                  className="min-h-[34px] shrink-0 rounded-full px-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-60"
                  style={
                    o.paid
                      ? { background: "var(--color-accent-2-200)", color: "var(--color-accent-2-800)" }
                      : { background: "var(--color-accent-200)", color: "var(--color-accent-800)" }
                  }
                >
                  {o.paid ? t("walk.paid") : t("walk.onCredit")}
                </button>
                {confirmId === o.id ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => remove(o)}
                      disabled={busy}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: "var(--color-accent-900)" }}
                    >
                      {busy ? "…" : t("walk.deleteYes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="px-1 text-xs text-[var(--color-neutral-600)]"
                    >
                      {t("common.cancel")}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(o.id)}
                    aria-label={`Delete ${o.product}`}
                    className="w-5 shrink-0 text-[var(--color-neutral-500)]"
                  >
                    ✕
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
