"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { translate, type Lang } from "@/lib/i18n";

type Period = "today" | "month";

function useCountUp(target: number) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}

/**
 * Today's sales card. Both figures are fetched on the server and passed in, so
 * switching period is instant on the client — no navigation, no refetch.
 */
export function SalesCard({
  todaySales,
  monthSales,
  lang = "en",
}: {
  todaySales: number;
  monthSales: number;
  lang?: Lang;
}) {
  const [period, setPeriod] = useState<Period>("today");
  const t = (k: string) => translate(lang, k);

  const value = period === "today" ? todaySales : monthSales;
  const shown = useCountUp(value);

  return (
    <section
      className="relative overflow-hidden rounded-[28px] px-[22px] pb-5 pt-[22px]"
      style={{ background: "var(--color-accent-600)", boxShadow: "var(--shadow-md)" }}
    >
      <div
        className="pointer-events-none absolute -bottom-[70px] -right-10 h-[180px] w-[180px] rounded-full"
        style={{ background: "rgba(255,255,255,.07)" }}
        aria-hidden
      />

      <div className="relative flex items-center justify-between gap-3">
        <span
          className="text-[12.5px] font-semibold uppercase tracking-[.1em]"
          style={{ color: "var(--color-accent-200)" }}
        >
          {period === "month" ? t("home.monthSales") : t("home.todaySales")}
        </span>

        {/* Segmented switch with a sliding indicator */}
        <div
          role="tablist"
          aria-label={t("home.salesPeriod")}
          className="relative flex shrink-0 items-center rounded-full p-0.5"
          style={{ background: "rgba(255,255,255,.18)" }}
        >
          <span
            aria-hidden
            className="absolute left-0.5 top-0.5 rounded-full will-change-transform"
            style={{
              width: "calc(50% - 2px)",
              height: "calc(100% - 4px)",
              background: "var(--color-neutral-100)",
              transform: period === "today" ? "translateX(0%)" : "translateX(100%)",
              transition: "transform .32s cubic-bezier(.22,1,.36,1)",
            }}
          />
          {(["today", "month"] as Period[]).map((p) => {
            const on = period === p;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPeriod(p)}
                className="relative z-10 w-[54px] rounded-full py-1 text-[11.5px] font-bold transition-colors duration-200"
                style={{ color: on ? "var(--color-accent-800)" : "rgba(255,255,255,.85)" }}
              >
                {p === "today" ? t("home.periodToday") : t("home.periodMonth")}
              </button>
            );
          })}
        </div>
      </div>

      <p className="font-heading relative mt-1.5 text-[46px] leading-[1.1] text-white">
        ₹{shown.toFixed(2)}
      </p>

      <div className="relative mt-5 flex gap-2.5">
        <Link
          href="/deliveries"
          className="font-heading flex min-h-[48px] flex-1 items-center justify-center rounded-full px-4 text-[15px] text-[var(--color-accent-800)] transition active:scale-[0.97]"
          style={{ background: "var(--color-neutral-100)" }}
        >
          {t("home.startRound")}
        </Link>
        <Link
          href="/walk-in"
          className="font-heading flex min-h-[48px] flex-1 items-center justify-center rounded-full border-[1.5px] px-4 text-[15px] text-white transition active:scale-[0.97]"
          style={{ borderColor: "rgba(255,255,255,.65)" }}
        >
          {t("home.walkinSale")}
        </Link>
      </div>
    </section>
  );
}
