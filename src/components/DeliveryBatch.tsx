"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang } from "@/lib/i18n";
import { BottomSheet, NumPad } from "@/components/BottomSheet";

type Line = {
  key: string;
  product: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  costPerUnit: number;
  isMilk: boolean;
};

type CustomerRow = {
  customerId: string;
  name: string;
  address: string | null;
  done: boolean; // has saved entries for this date
  lines: Line[];
};

type AvailableProduct = {
  product: string;
  unit: string;
  pricePerUnit: number;
  costPerUnit: number;
};

type SheetLine = Omit<Line, "key">;
type SheetCustomer = {
  customerId: string;
  name: string;
  address: string | null;
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
    address: c.address,
    done: c.saved,
    lines: c.lines.map((l) => ({ ...l, key: randKey() })),
  };
}

/** Litres step in halves, weights in quarters, countables in whole units. */
function stepFor(unit: string) {
  if (unit === "piece" || unit === "packet" || unit === "dozen") return 1;
  if (unit === "kg" || unit === "g") return 0.25;
  return 0.5;
}

function fmtQty(q: number, unit: string) {
  if (unit === "piece" || unit === "packet" || unit === "dozen") return String(Math.round(q));
  return Number.isInteger(q) ? String(q) : String(Math.round(q * 100) / 100);
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
  const t = (k: string, v?: Record<string, string | number>) => translate(lang, k, v);

  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<CustomerRow[]>(initialCustomers.map(toRow));
  const [loading, startLoading] = useTransition();
  const [savingAll, setSavingAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  // Customers whose lines changed and need writing back (only ones already
  // marked delivered — undelivered houses stay drafts until you mark them).
  const [dirty, setDirty] = useState<string[]>([]);
  const [autoSaving, setAutoSaving] = useState<string[]>([]);

  const [qtySheet, setQtySheet] = useState<{ customerId: string; key: string; input: string } | null>(null);
  const [itemSheet, setItemSheet] = useState<string | null>(null);
  // One-off item typed inline (not one of the saved products).
  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState({ name: "", unit: "", price: "" });

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.lines.reduce((ls, l) => ls + l.quantity * l.pricePerUnit, 0), 0),
    [rows],
  );
  const doneCount = rows.filter((r) => r.done).length;

  useEffect(() => {
    if (date === initialDate) return;
    startLoading(async () => {
      const res = await fetch(`/api/deliveries?date=${date}`);
      if (!res.ok) return;
      const data = (await res.json()) as { customers: SheetCustomer[] };
      setRows(data.customers.map(toRow));
    });
  }, [date, initialDate]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  function markDirty(customerId: string) {
    setDirty((prev) => (prev.includes(customerId) ? prev : [...prev, customerId]));
  }

  function patchLine(customerId: string, key: string, patch: Partial<Line>) {
    markDirty(customerId);
    setRows((prev) =>
      prev.map((r) =>
        r.customerId === customerId
          ? { ...r, lines: r.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }
          : r,
      ),
    );
  }

  function bumpQty(customerId: string, key: string, delta: number) {
    markDirty(customerId);
    setRows((prev) =>
      prev.map((r) =>
        r.customerId === customerId
          ? {
              ...r,
              lines: r.lines.map((l) =>
                l.key === key
                  ? { ...l, quantity: Math.max(0, Math.round((l.quantity + delta) * 100) / 100) }
                  : l,
              ),
            }
          : r,
      ),
    );
  }

  function closeItemSheet() {
    setItemSheet(null);
    setCustomMode(false);
    setCustomDraft({ name: "", unit: "", price: "" });
  }

  /** Add a one-off item that isn't in the saved product list. */
  function addCustomLine(customerId: string) {
    const name = customDraft.name.trim();
    if (!name) return;
    addLine(customerId, {
      product: name,
      unit: customDraft.unit.trim(),
      pricePerUnit: Math.max(0, Number(customDraft.price) || 0),
      costPerUnit: 0,
    });
    setCustomMode(false);
    setCustomDraft({ name: "", unit: "", price: "" });
  }

  function addLine(customerId: string, product: AvailableProduct) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.customerId !== customerId) return r;
        if (r.lines.some((l) => l.product === product.product)) return r;
        return {
          ...r,
          lines: [
            ...r.lines,
            {
              key: randKey(),
              product: product.product,
              unit: product.unit,
              quantity: 1,
              pricePerUnit: product.pricePerUnit,
              costPerUnit: product.costPerUnit,
              isMilk: product.product === "Milk",
            },
          ],
        };
      }),
    );
    markDirty(customerId);
    setItemSheet(null);
  }

  function removeLine(customerId: string, key: string) {
    markDirty(customerId);
    setRows((prev) =>
      prev.map((r) => (r.customerId === customerId ? { ...r, lines: r.lines.filter((l) => l.key !== key) } : r)),
    );
  }

  function payloadFor(list: CustomerRow[]) {
    return list.map((r) => ({
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
    }));
  }

  /** Save one house as you go, so an interrupted round never loses work. */
  async function toggleDelivered(row: CustomerRow) {
    setBusyId(row.customerId);
    const undo = row.done;
    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        customers: undo ? [{ customerId: row.customerId, lines: [] }] : payloadFor([row]),
      }),
    });
    setBusyId(null);
    if (!res.ok) return showToast(t("deliv.saveFailed"));
    setRows((prev) => prev.map((r) => (r.customerId === row.customerId ? { ...r, done: !undo } : r)));
    if (!undo) showToast(t("deliv.markedDelivered", { name: row.name }));
    router.refresh();
  }

  /**
   * Write edits back for houses already marked delivered. Their delivery is
   * already recorded, so a quantity change has to update that record — without
   * this the change would live only in local state and tomorrow's sheet would
   * carry forward the old amount.
   */
  useEffect(() => {
    if (dirty.length === 0) return;
    const timer = window.setTimeout(async () => {
      const targets = rows.filter((r) => dirty.includes(r.customerId) && r.done);
      setDirty([]);
      if (targets.length === 0) return;
      const ids = targets.map((r) => r.customerId);
      setAutoSaving(ids);
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, customers: payloadFor(targets) }),
      });
      setAutoSaving([]);
      if (!res.ok) {
        showToast(t("deliv.saveFailed"));
        return;
      }
      router.refresh();
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, rows, date]);

  /**
   * Houses that would be newly marked delivered by a bulk save. The sheet
   * pre-fills quantities by carrying forward the last round, so saving blindly
   * would record deliveries for houses that were never visited — we confirm
   * these first.
   */
  const pending = rows.filter((r) => !r.done && r.lines.length > 0);

  async function saveAll() {
    setConfirmSave(false);
    setSavingAll(true);
    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, customers: payloadFor(rows) }),
    });
    setSavingAll(false);
    if (!res.ok) return showToast(t("deliv.saveFailed"));
    setRows((prev) => prev.map((r) => ({ ...r, done: r.lines.length > 0 })));
    showToast(t("deliv.roundSaved"));
    router.refresh();
  }

  const sheetRow = qtySheet ? rows.find((r) => r.customerId === qtySheet.customerId) : null;
  const sheetLine = sheetRow?.lines.find((l) => l.key === qtySheet?.key) ?? null;
  const itemRow = itemSheet ? rows.find((r) => r.customerId === itemSheet) : null;
  const addable = itemRow
    ? availableProducts.filter((a) => !itemRow.lines.some((l) => l.product === a.product))
    : [];

  return (
    <div className="space-y-3 pb-24">
      {/* Date pill + day total */}
      <div className="flex items-center gap-3">
        <label
          className="flex h-12 flex-1 items-center gap-2.5 rounded-full px-4"
          style={{ background: "var(--color-neutral-100)" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent-700)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 11h18" />
          </svg>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={t("deliv.date")}
            className="w-full bg-transparent text-[15px] font-semibold text-[var(--color-accent-900)] outline-none"
          />
        </label>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-600)]">
            {t("deliv.dayTotal")}
          </p>
          <p className="font-heading text-[20px] leading-tight text-[var(--color-accent-800)]">
            ₹{total.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="px-1 text-xs text-[var(--color-neutral-600)]">
        {t("deliv.progress", { done: doneCount, total: rows.length })}
      </p>

      {loading && <p className="px-1 text-xs text-[var(--color-neutral-500)]">…</p>}

      {/* One card per house */}
      <div className="space-y-3">
        {rows.map((r) => {
          const custTotal = r.lines.reduce((s, l) => s + l.quantity * l.pricePerUnit, 0);
          return (
            <div
              key={r.customerId}
              className="rounded-2xl border p-3.5 transition-colors duration-300"
              style={{
                background: r.done ? "var(--color-accent-2-200)" : "var(--color-neutral-100)",
                borderColor: r.done ? "var(--color-accent-2-300)" : "var(--color-divider)",
              }}
            >
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-[var(--color-accent-900)]">{r.name}</p>
                  {r.address && <p className="truncate text-xs text-[var(--color-neutral-600)]">{r.address}</p>}
                </div>
                <span className="flex shrink-0 items-center gap-1.5">
                  {autoSaving.includes(r.customerId) && (
                    <span className="text-[11px] font-semibold text-[var(--color-accent-2-700)]">
                      {t("deliv.updating")}
                    </span>
                  )}
                  <span className="font-heading text-[18px] text-[var(--color-accent-800)]">
                    ₹{custTotal.toFixed(2)}
                  </span>
                </span>
              </div>

              <ul className="space-y-2">
                {r.lines.map((l) => (
                  <li key={l.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQtySheet({ customerId: r.customerId, key: l.key, input: String(l.quantity || "") })
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-semibold text-[var(--color-accent-900)]">
                        {l.product}
                      </span>
                      <span className="block text-xs text-[var(--color-neutral-600)]">
                        ₹{l.pricePerUnit.toFixed(2)}
                        {l.unit ? `/${l.unit}` : ""}
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Less ${l.product}`}
                        onClick={() => bumpQty(r.customerId, l.key, -stepFor(l.unit))}
                        className="flex h-11 w-11 items-center justify-center rounded-full border text-xl text-[var(--color-accent-800)] transition active:scale-90"
                        style={{ borderColor: "var(--color-divider)", background: "var(--color-bg)" }}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setQtySheet({ customerId: r.customerId, key: l.key, input: String(l.quantity || "") })
                        }
                        className="font-heading flex h-11 w-[62px] items-center justify-center rounded-xl text-[17px] text-[var(--color-accent-900)]"
                        style={{ background: "var(--color-bg)" }}
                      >
                        {fmtQty(l.quantity, l.unit)}
                      </button>
                      <button
                        type="button"
                        aria-label={`More ${l.product}`}
                        onClick={() => bumpQty(r.customerId, l.key, stepFor(l.unit))}
                        className="flex h-11 w-11 items-center justify-center rounded-full border text-xl text-[var(--color-accent-800)] transition active:scale-90"
                        style={{ borderColor: "var(--color-divider)", background: "var(--color-bg)" }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${l.product}`}
                        onClick={() => removeLine(r.customerId, l.key)}
                        className="w-5 text-[var(--color-neutral-500)]"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleDelivered(r)}
                  disabled={busyId === r.customerId}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-full text-sm font-bold transition active:scale-[0.98] disabled:opacity-60"
                  style={
                    r.done
                      ? { background: "var(--color-accent-2-600)", color: "#f3f7ec" }
                      : { background: "var(--color-peach-bg)", color: "var(--color-peach-fg)" }
                  }
                >
                  {busyId === r.customerId ? "…" : r.done ? t("deliv.delivered") : t("deliv.markDelivered")}
                </button>
                <button
                  type="button"
                  onClick={() => setItemSheet(r.customerId)}
                  className="flex min-h-[44px] items-center justify-center rounded-full border-[1.5px] px-4 text-sm font-semibold text-[var(--color-accent-700)] transition active:scale-[0.98]"
                  style={{ borderColor: "var(--color-accent-300)" }}
                >
                  {t("deliv.plusItem")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating save bar, clear of the tab bar */}
      <div className="fixed inset-x-0 bottom-[82px] z-30 px-4 pb-2 pt-8 md:static md:p-0 md:pt-2">
        <div
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{ background: "linear-gradient(to top, var(--color-bg) 60%, transparent)" }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => (pending.length > 0 ? setConfirmSave(true) : saveAll())}
          disabled={savingAll}
          className="font-heading relative mx-auto flex h-[54px] w-full max-w-md items-center justify-center rounded-full text-[15px] text-white transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: "var(--color-accent-600)", boxShadow: "var(--shadow-md)" }}
        >
          {savingAll ? t("deliv.saving") : t("deliv.save")}
        </button>
      </div>

      {/* Quantity sheet */}
      <BottomSheet
        open={!!qtySheet && !!sheetLine}
        onClose={() => setQtySheet(null)}
        title={sheetLine?.product}
        subtitle={sheetRow?.name}
      >
        {sheetLine && qtySheet && (
          <>
            <p className="font-heading dl-pop mb-1 text-center text-[44px] leading-none text-[var(--color-accent-900)]">
              {qtySheet.input || "0"}
              <span className="ml-1 text-[18px] text-[var(--color-neutral-600)]">{sheetLine.unit}</span>
            </p>
            <p className="mb-4 text-center text-xs text-[var(--color-neutral-600)]">
              ₹{((Number(qtySheet.input) || 0) * sheetLine.pricePerUnit).toFixed(2)}
            </p>
            <NumPad value={qtySheet.input} onChange={(next) => setQtySheet({ ...qtySheet, input: next })} />
            <button
              type="button"
              onClick={() => {
                patchLine(qtySheet.customerId, qtySheet.key, {
                  quantity: Math.max(0, Number(qtySheet.input) || 0),
                });
                setQtySheet(null);
              }}
              className="font-heading mt-4 flex h-[54px] w-full items-center justify-center rounded-full text-[15px] text-white transition active:scale-[0.98]"
              style={{ background: "var(--color-accent-600)" }}
            >
              {t("common.save")}
            </button>
          </>
        )}
      </BottomSheet>

      {/* Saved-items picker, with a one-off custom item */}
      <BottomSheet
        open={!!itemSheet}
        onClose={closeItemSheet}
        title={customMode ? t("deliv.customItem") : t("deliv.addItem")}
      >
        {customMode ? (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">
                {t("deliv.itemName")}
              </span>
              <input
                autoFocus
                value={customDraft.name}
                onChange={(e) => setCustomDraft({ ...customDraft, name: e.target.value })}
                placeholder={t("deliv.itemNamePlaceholder")}
                className="h-12 w-full rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none"
                style={{ background: "var(--color-neutral-100)" }}
              />
            </label>
            <div className="flex gap-3">
              <label className="block flex-1">
                <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">
                  {t("deliv.unitOptional")}
                </span>
                <input
                  value={customDraft.unit}
                  onChange={(e) => setCustomDraft({ ...customDraft, unit: e.target.value })}
                  placeholder="L, kg…"
                  className="h-12 w-full rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none"
                  style={{ background: "var(--color-neutral-100)" }}
                />
              </label>
              <label className="block flex-1">
                <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">
                  {t("deliv.priceLabel")}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={customDraft.price}
                  onChange={(e) => setCustomDraft({ ...customDraft, price: e.target.value })}
                  placeholder="0"
                  className="h-12 w-full rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none"
                  style={{ background: "var(--color-neutral-100)" }}
                />
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className="flex h-[54px] flex-1 items-center justify-center rounded-full text-[15px] font-semibold text-[var(--color-neutral-700)]"
                style={{ background: "var(--color-neutral-200)" }}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={!customDraft.name.trim()}
                onClick={() => itemSheet && addCustomLine(itemSheet)}
                className="font-heading flex h-[54px] flex-[1.5] items-center justify-center rounded-full text-[15px] text-white transition active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--color-accent-600)" }}
              >
                {t("deliv.addBtn")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {addable.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--color-neutral-600)]">
                {t("deliv.allItemsAdded")}
              </p>
            ) : (
              <ul className="max-h-[40vh] overflow-y-auto">
                {addable.map((a) => (
                  <li key={a.product}>
                    <button
                      type="button"
                      onClick={() => itemSheet && addLine(itemSheet, a)}
                      className="flex h-14 w-full items-center justify-between gap-3 border-b text-left"
                      style={{ borderColor: "var(--color-divider)" }}
                    >
                      <span className="text-[15px] font-semibold text-[var(--color-accent-900)]">{a.product}</span>
                      <span className="text-[13px] text-[var(--color-neutral-600)]">
                        ₹{a.pricePerUnit.toFixed(2)}
                        {a.unit ? `/${a.unit}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className="mt-3 flex h-[54px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-dashed text-[15px] font-semibold text-[var(--color-accent-700)] transition active:scale-[0.98]"
              style={{ borderColor: "var(--color-accent-400)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {t("deliv.customItem")}
            </button>
          </>
        )}
      </BottomSheet>

      {/* Confirm bulk save — names the houses that would be newly delivered */}
      <BottomSheet
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        title={t("deliv.confirmTitle")}
        subtitle={t("deliv.confirmSubtitle", { n: pending.length })}
      >
        <ul
          className="mb-4 max-h-[34vh] overflow-y-auto rounded-2xl px-4"
          style={{ background: "var(--color-neutral-100)" }}
        >
          {pending.map((r, i) => (
            <li
              key={r.customerId}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
              style={i > 0 ? { borderTop: "1px solid var(--color-divider)" } : undefined}
            >
              <span className="truncate font-semibold text-[var(--color-accent-900)]">{r.name}</span>
              <span className="shrink-0 text-[var(--color-neutral-600)]">
                {r.lines
                  .map((l) => `${fmtQty(l.quantity, l.unit)}${l.unit ? ` ${l.unit}` : ""} ${l.product}`)
                  .join(", ")}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmSave(false)}
            className="flex h-[54px] flex-1 items-center justify-center rounded-full text-[15px] font-semibold text-[var(--color-neutral-700)]"
            style={{ background: "var(--color-neutral-200)" }}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={saveAll}
            className="font-heading flex h-[54px] flex-[1.5] items-center justify-center rounded-full text-[15px] text-white transition active:scale-[0.98]"
            style={{ background: "var(--color-accent-600)" }}
          >
            {t("deliv.confirmSave")}
          </button>
        </div>
      </BottomSheet>

      {toast && (
        <div
          className="dl-toast fixed bottom-[104px] left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-semibold"
          style={{ background: "var(--color-accent-900)", color: "var(--color-bg)" }}
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
