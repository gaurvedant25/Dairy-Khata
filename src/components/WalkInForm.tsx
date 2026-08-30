"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang } from "@/lib/i18n";

type UserProduct = { id: string; name: string; unit: string; pricePerUnit: number };
type DailyCustomer = { id: string; name: string };

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

type Item = {
  key: string;
  productId: string; // "" => custom
  qty: number;
  customName: string;
  customPrice: string;
};

function randKey() {
  return Math.random().toString(36).slice(2, 9);
}

export function WalkInForm({
  initialOrders,
  dailyCustomers = [],
  userProducts = [],
  lang = "en",
  bare = false,
  onClose,
}: {
  initialOrders: Order[];
  dailyCustomers?: DailyCustomer[];
  userProducts?: UserProduct[];
  lang?: Lang;
  bare?: boolean; // rendered inside a bottom sheet — no outer card chrome
  onClose?: () => void;
}) {
  const router = useRouter();
  const t = (k: string, v?: Record<string, string | number>) => translate(lang, k, v);

  const firstId = userProducts[0]?.id ?? "";
  const newItem = (): Item => ({ key: randKey(), productId: firstId, qty: 1, customName: "", customPrice: "" });

  const [who, setWho] = useState<"walkin" | "regular">("walkin");
  const [walkinName, setWalkinName] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [customer, setCustomer] = useState<DailyCustomer | null>(null);
  const [items, setItems] = useState<Item[]>(() => [newItem()]);
  const [paid, setPaid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productById = (id: string) => userProducts.find((p) => p.id === id) ?? null;
  const isCustom = (it: Item) => it.productId === "";
  const isNoUnit = (it: Item) => {
    const p = productById(it.productId);
    return !!p && p.unit === "";
  };
  const showQty = (it: Item) => !isCustom(it) && !isNoUnit(it);

  function lineAmount(it: Item) {
    if (isCustom(it) || isNoUnit(it)) return Math.max(0, Number(it.customPrice) || 0);
    const p = productById(it.productId);
    return p ? Math.round(it.qty * p.pricePerUnit * 100) / 100 : 0;
  }

  const total = useMemo(() => items.reduce((s, it) => s + lineAmount(it), 0), [items]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dailyCustomers.slice(0, 6);
    return dailyCustomers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [dailyCustomers, search]);

  function patch(key: string, p: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)));
  }

  function pickProduct(key: string, productId: string) {
    const prod = productById(productId);
    patch(key, {
      productId,
      qty: 1,
      // A no-unit product is priced per sale — seed its default.
      customPrice: prod && prod.unit === "" ? String(prod.pricePerUnit || "") : "",
    });
  }

  function resetForm() {
    setWho("walkin");
    setWalkinName("");
    setSearch("");
    setCustomer(null);
    setItems([newItem()]);
    setPaid(true);
    setError(null);
  }

  async function save() {
    if (total <= 0) return;
    setSaving(true);
    setError(null);
    const payloadItems = items.map((it) => {
      const prod = productById(it.productId);
      if (isCustom(it)) {
        return { product: "Custom", customProductName: it.customName, customAmount: it.customPrice };
      }
      if (prod && prod.unit === "") {
        return { product: "Custom", customProductName: prod.name, customAmount: it.customPrice };
      }
      return { product: "UserProduct", userProductId: it.productId, quantity: String(it.qty) };
    });
    const res = await fetch("/api/one-time-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        existingCustomerId: who === "regular" ? customer?.id : undefined,
        customerName: who === "regular" ? undefined : walkinName,
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
    onClose?.();
    router.refresh();
  }

  const chipBase =
    "flex-1 rounded-full py-3 text-center text-[13.5px] font-semibold transition active:scale-[0.98]";
  const inputCls =
    "h-12 w-full rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none";

  const Wrapper = bare
    ? (props: { children: React.ReactNode }) => <div className="flex flex-col gap-5">{props.children}</div>
    : (props: { children: React.ReactNode }) => (
        <section
          className="flex flex-col gap-5 rounded-[28px] border p-[22px]"
          style={{
            background: "var(--color-neutral-100)",
            borderColor: "var(--color-neutral-300)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {props.children}
        </section>
      );

  return (
    <Wrapper>
      <div>
        <h2 className="font-heading text-[23px] leading-[1.15] text-[var(--color-accent-900)]">
          {t("walk.formTitle")}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--color-neutral-600)]">{t("walk.formSubtitle")}</p>
      </div>

      {/* Customer */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11.5px] font-semibold uppercase tracking-[.08em] text-[var(--color-neutral-600)]">
          {t("walk.customer")}
        </span>
        <div className="flex gap-2.5">
          {(["walkin", "regular"] as const).map((w) => {
            const on = who === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setWho(w);
                  setCustomer(null);
                  setSearch("");
                }}
                className={chipBase}
                style={
                  on
                    ? {
                        background: "var(--color-accent-600)",
                        color: "#fff",
                        border: "1.5px solid var(--color-accent-600)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--color-neutral-700)",
                        border: "1.5px solid var(--color-neutral-300)",
                      }
                }
              >
                {w === "walkin" ? t("walk.newWalkin") : t("walk.regular")}
              </button>
            );
          })}
        </div>

        {who === "walkin" && (
          <input
            value={walkinName}
            onChange={(e) => setWalkinName(e.target.value)}
            placeholder={t("walk.namePlaceholder")}
            className={inputCls}
            style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-neutral-300)" }}
          />
        )}

        {who === "regular" && (
          <div className="relative">
            {customer ? (
              <div
                className="flex items-center justify-between rounded-2xl px-3.5 py-2.5"
                style={{ background: "var(--color-accent-100)", border: "1.5px solid var(--color-accent-300)" }}
              >
                <span className="text-sm font-semibold text-[var(--color-accent-800)]">{customer.name}</span>
                <button
                  type="button"
                  onClick={() => setCustomer(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[13px] text-[var(--color-neutral-700)]"
                  aria-label="Clear"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder={t("walk.searchCustomer")}
                  className={inputCls}
                  style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-neutral-300)" }}
                />
                {searchOpen && (
                  <div
                    className="absolute inset-x-0 top-[calc(100%+6px)] z-10 overflow-hidden rounded-2xl"
                    style={{
                      background: "var(--color-neutral-100)",
                      border: "1.5px solid var(--color-neutral-300)",
                      boxShadow: "var(--shadow-md)",
                    }}
                  >
                    {matches.length === 0 ? (
                      <p className="px-3.5 py-3 text-[13px] text-[var(--color-neutral-600)]">
                        {t("walk.noCustomer")}
                      </p>
                    ) : (
                      matches.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setCustomer(c);
                            setSearchOpen(false);
                          }}
                          className="block w-full px-3.5 py-3 text-left text-sm font-semibold text-[var(--color-accent-900)]"
                        >
                          {c.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Items — flat rows divided by a rule */}
      <div className="flex flex-col gap-4">
        {items.map((it, idx) => {
          const prod = productById(it.productId);
          const rate = prod ? `₹${prod.pricePerUnit.toFixed(0)}${prod.unit ? `/${prod.unit}` : ""}` : "";
          return (
            <div
              key={it.key}
              className="flex flex-col gap-2.5 pt-4"
              style={idx > 0 ? { borderTop: "1.5px solid var(--color-neutral-300)" } : undefined}
            >
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-[11.5px] font-semibold uppercase tracking-[.08em] text-[var(--color-neutral-600)]">
                  {t("walk.item", { n: idx + 1 })}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((x) => x.key !== it.key))}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[var(--color-neutral-700)]"
                    style={{ background: "var(--color-neutral-200)" }}
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Product chips — only starred items get a quick chip */}
              {userProducts.length === 0 && (
                <p className="text-[12px] text-[var(--color-neutral-600)]">{t("walk.starHint")}</p>
              )}
              <div className="flex flex-wrap gap-2.5">
                {userProducts.map((p) => {
                  const on = it.productId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pickProduct(it.key, p.id)}
                      className="grow basis-[calc(33.333%-7px)] rounded-full py-2.5 text-center text-[13px] font-semibold transition active:scale-[0.98]"
                      style={
                        on
                          ? {
                              background: "var(--color-accent-600)",
                        color: "#fff",
                        border: "1.5px solid var(--color-accent-600)",
                            }
                          : {
                              background: "var(--color-bg)",
                              color: "var(--color-neutral-700)",
                              border: "1.5px solid var(--color-neutral-300)",
                            }
                      }
                    >
                      {p.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => patch(it.key, { productId: "", customName: "", customPrice: "" })}
                  className="grow basis-[calc(33.333%-7px)] rounded-full py-2.5 text-center text-[13px] font-semibold transition active:scale-[0.98]"
                  style={
                    isCustom(it)
                      ? {
                          background: "var(--color-accent-600)",
                        color: "#fff",
                        border: "1.5px solid var(--color-accent-600)",
                        }
                      : {
                          background: "var(--color-bg)",
                          color: "var(--color-neutral-700)",
                          border: "1.5px solid var(--color-neutral-300)",
                        }
                  }
                >
                  {t("walk.customChip")}
                </button>
              </div>

              {/* Custom item inputs */}
              {isCustom(it) && (
                <div className="flex gap-2.5">
                  <input
                    value={it.customName}
                    onChange={(e) => patch(it.key, { customName: e.target.value })}
                    placeholder={t("walk.itemName")}
                    className="h-12 min-w-0 flex-1 rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none"
                    style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-neutral-300)" }}
                  />
                  <input
                    value={it.customPrice}
                    onChange={(e) => patch(it.key, { customPrice: e.target.value })}
                    inputMode="numeric"
                    placeholder={t("walk.pricePlaceholder")}
                    className="h-12 w-[104px] rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none"
                    style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-neutral-300)" }}
                  />
                </div>
              )}

              {/* No-unit product: just a price */}
              {isNoUnit(it) && (
                <input
                  value={it.customPrice}
                  onChange={(e) => patch(it.key, { customPrice: e.target.value })}
                  inputMode="numeric"
                  placeholder={t("walk.pricePlaceholder")}
                  className="h-12 w-full rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none"
                  style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-neutral-300)" }}
                />
              )}

              {/* Stepper + line total */}
              <div className="flex items-center gap-2.5">
                {showQty(it) && (
                  <>
                    <button
                      type="button"
                      onClick={() => patch(it.key, { qty: Math.max(0, Math.round((it.qty - 0.5) * 100) / 100) })}
                      className="font-heading flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full text-[23px] text-[var(--color-text,#402310)]"
                      style={{ background: "var(--color-neutral-200)", border: "1.5px solid var(--color-neutral-300)" }}
                      aria-label="Less"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <div className="font-heading text-[22px] leading-none text-[var(--color-accent-900)]">
                        {Number.isInteger(it.qty) ? it.qty : it.qty.toFixed(2).replace(/0$/, "")}
                        {prod?.unit ? ` ${prod.unit}` : ""}
                      </div>
                      <div className="mt-[3px] text-[11.5px] font-medium text-[var(--color-neutral-600)]">{rate}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => patch(it.key, { qty: Math.round((it.qty + 0.5) * 100) / 100 })}
                      className="font-heading flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full text-[23px] text-white"
                      style={{ background: "var(--color-accent-600)", border: "1.5px solid var(--color-accent-600)" }}
                      aria-label="More"
                    >
                      +
                    </button>
                  </>
                )}
                <div className="font-heading ml-auto min-w-[84px] text-right text-[20px] text-[var(--color-accent-2-800)]">
                  ₹{lineAmount(it).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add another item */}
      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, newItem()])}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border-[1.5px] border-dashed text-[13.5px] font-semibold text-[var(--color-neutral-700)]"
        style={{ borderColor: "var(--color-neutral-400)" }}
      >
        <span className="text-lg leading-none">+</span>
        {t("walk.addItem")}
      </button>

      {/* Total bar */}
      <div
        className="flex items-center justify-between rounded-full px-5 py-[15px]"
        style={{ background: "var(--color-accent-2-200)" }}
      >
        <span className="text-[13.5px] font-semibold text-[var(--color-accent-2-800)]">
          {t("walk.itemCount", { n: items.length })}
        </span>
        <span className="font-heading text-[26px] leading-none text-[var(--color-accent-2-900)]">
          ₹{total.toFixed(2)}
        </span>
      </div>

      {/* Paid toggle */}
      <button type="button" onClick={() => setPaid((p) => !p)} className="flex items-center justify-between gap-3">
        <span className="text-[14.5px] font-semibold text-[var(--color-accent-900)]">{t("walk.paidSpot")}</span>
        <span
          className="flex h-8 w-[54px] flex-none items-center p-[3px]"
          style={{
            borderRadius: 999,
            background: paid ? "var(--color-accent-2-600)" : "var(--color-neutral-300)",
            justifyContent: paid ? "flex-end" : "flex-start",
          }}
        >
          <span className="h-[26px] w-[26px] rounded-full bg-white" style={{ boxShadow: "var(--shadow-sm)" }} />
        </span>
      </button>

      {error && <p className="text-center text-sm text-[#8C491A]">{error}</p>}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={save}
          disabled={saving || total <= 0}
          className="flex min-h-[56px] items-center justify-center rounded-full text-[16.5px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
          style={{ background: "var(--color-accent-600)", boxShadow: "var(--shadow-md)" }}
        >
          {saving ? t("deliv.saving") : t("walk.saveSale", { amt: `₹${total.toFixed(2)}` })}
        </button>
        <button
          type="button"
          onClick={() => (onClose ? onClose() : resetForm())}
          className="text-center text-[13.5px] font-semibold text-[var(--color-neutral-600)]"
        >
          {t("common.cancel")}
        </button>
      </div>
    </Wrapper>
  );
}
