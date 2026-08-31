"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { translate, type Lang } from "@/lib/i18n";
import { BottomSheet } from "@/components/BottomSheet";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  dues: number;
};

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function CustomerList({ customers, lang = "en" }: { customers: CustomerRow[]; lang?: Lang }) {
  const router = useRouter();
  const t = (k: string, v?: Record<string, string | number>) => translate(lang, k, v);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    // Match name, phone or address, however the owner remembers them.
    return customers.filter((c) =>
      [c.name, c.phone ?? "", c.address ?? ""].some((f) => f.toLowerCase().includes(q)),
    );
  }, [customers, query]);

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    setDraft({ name: "", phone: "", address: "" });
    setOpen(false);
    router.refresh();
  }

  const field = "h-12 w-full rounded-full px-4 text-[15px] text-[var(--color-accent-900)] outline-none";

  return (
    <div className="space-y-3">
      {/* Search pill */}
      <label
        className="flex h-12 items-center gap-2.5 rounded-full px-4"
        style={{ background: "var(--color-neutral-100)" }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-neutral-600)"
          strokeWidth="2.75"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cust.search")}
          aria-label={t("cust.search")}
          className="w-full bg-transparent text-[15px] text-[var(--color-accent-900)] outline-none placeholder:text-[var(--color-neutral-500)]"
        />
      </label>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-neutral-600)]">
          {customers.length === 0 ? t("cust.none") : t("cust.noMatch")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl" style={{ background: "var(--color-neutral-100)" }}>
          {shown.map((c, i) => (
            <li key={c.id} style={i > 0 ? { borderTop: "1px solid var(--color-divider)" } : undefined}>
              <Link
                href={`/customers/${c.id}`}
                className="flex min-h-[64px] items-center gap-3 px-3.5 py-2.5 transition active:bg-[var(--color-neutral-200)]"
              >
                <span
                  className="font-heading flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] text-[var(--color-peach-fg)]"
                  style={{ background: "var(--color-peach-bg)" }}
                  aria-hidden
                >
                  {initial(c.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[var(--color-accent-900)]">
                    {c.name}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-neutral-600)]">
                    {[c.phone, c.address].filter(Boolean).join(" · ") || t("cust.noContact")}
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={
                    c.dues > 0
                      ? { background: "var(--color-peach-bg)", color: "var(--color-peach-fg)" }
                      : { background: "var(--color-accent-2-200)", color: "var(--color-accent-2-800)" }
                  }
                >
                  {c.dues > 0 ? t("cust.due", { amt: `₹${c.dues.toFixed(2)}` }) : t("cust.paidUp")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-dashed text-[15px] font-semibold text-[var(--color-accent-700)] transition active:scale-[0.98]"
        style={{ borderColor: "var(--color-accent-400)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        {t("cust.add")}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={t("cust.newTitle")}>
        <form onSubmit={addCustomer} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">
              {t("cust.name")}
            </span>
            <input
              required
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={field}
              style={{ background: "var(--color-neutral-100)" }}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">
              {t("cust.phoneOptional")}
            </span>
            <input
              inputMode="tel"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className={field}
              style={{ background: "var(--color-neutral-100)" }}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--color-neutral-700)]">
              {t("cust.addressOptional")}
            </span>
            <input
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              className={field}
              style={{ background: "var(--color-neutral-100)" }}
            />
          </label>
          {error && <p className="text-sm text-[#8C491A]">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-[54px] flex-1 items-center justify-center rounded-full text-[15px] font-semibold text-[var(--color-neutral-700)]"
              style={{ background: "var(--color-neutral-200)" }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || !draft.name.trim()}
              className="font-heading flex h-[54px] flex-[1.5] items-center justify-center rounded-full text-[15px] text-white transition active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--color-accent-600)" }}
            >
              {saving ? t("deliv.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
