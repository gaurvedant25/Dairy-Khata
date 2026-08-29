"use client";

import { useEffect } from "react";

/**
 * Shared bottom-sheet shell used by the quantity, payment, item-picker and
 * price sheets. Backdrop dismisses; Escape closes; body scroll is locked while
 * it's open.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="dl-fade absolute inset-0 h-full w-full"
        style={{ background: "rgba(46,43,37,.42)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dl-sheet relative mx-auto w-full max-w-md px-5 pb-[max(26px,env(safe-area-inset-bottom))] pt-2.5"
        style={{
          background: "var(--color-bg)",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 12px 32px rgba(46,43,37,.22)",
        }}
      >
        <div
          className="mx-auto mb-3 h-[5px] w-11 rounded-full"
          style={{ background: "var(--color-neutral-300)" }}
          aria-hidden
        />
        {title && (
          <div className="mb-3">
            <h2 className="font-heading text-[20px] text-[var(--color-accent-900)]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--color-neutral-600)]">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** 3-column numeric pad: 1-9, decimal point, 0, backspace. */
export function NumPad({
  value,
  onChange,
  allowDecimal = true,
}: {
  value: string;
  onChange: (next: string) => void;
  allowDecimal?: boolean;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", allowDecimal ? "." : "", "0", "⌫"];

  function press(k: string) {
    if (!k) return;
    if (k === "⌫") return onChange(value.slice(0, -1));
    if (k === ".") {
      if (value.includes(".")) return;
      return onChange((value === "" ? "0" : value) + ".");
    }
    if (value === "0") return onChange(k);
    onChange(value + k);
  }

  return (
    <div className="grid grid-cols-3 gap-[9px]">
      {keys.map((k, i) => (
        <button
          key={i}
          type="button"
          disabled={!k}
          onClick={() => press(k)}
          className="font-heading flex h-14 items-center justify-center rounded-2xl text-[22px] text-[var(--color-accent-900)] transition active:scale-[0.94] disabled:opacity-0"
          style={{ background: k ? "var(--color-neutral-100)" : "transparent" }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}
