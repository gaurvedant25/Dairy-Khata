"use client";

import { useState } from "react";

/**
 * A tappable stat card that expands to reveal its breakdown.
 * Sage panel from the mobile design system, with a circular chevron.
 */
export function ExpandableStat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="overflow-hidden rounded-[28px]"
      style={{ background: "var(--color-accent-2-200)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 px-[22px] py-[18px] text-left"
      >
        <span className="flex-1">
          <span
            className="block text-[13px] font-semibold uppercase tracking-[.06em]"
            style={{ color: "var(--color-accent-2-700)" }}
          >
            {label}
          </span>
          <span
            className="font-heading mt-1 block text-[32px] leading-[1.15]"
            style={{ color: "var(--color-accent-2-800)" }}
          >
            {value}
          </span>
        </span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200"
          style={{
            background: "rgba(255,255,255,.55)",
            color: "var(--color-accent-2-800)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-[22px] pb-[18px]">{children}</div>
        </div>
      </div>
    </section>
  );
}
