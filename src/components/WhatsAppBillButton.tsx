"use client";

import { useRouter } from "next/navigation";

export function WhatsAppBillButton({
  customerId,
  link,
  disabledReason,
}: {
  customerId: string;
  link: string | null;
  disabledReason?: string;
}) {
  const router = useRouter();

  if (!link) {
    return (
      <p className="text-xs text-[var(--color-neutral-500)]">{disabledReason ?? "Add a phone number to send a WhatsApp bill."}</p>
    );
  }

  function handleClick() {
    // Mark as reminded for the owner's own tracking, then open WhatsApp.
    fetch(`/api/customers/${customerId}/remind`, { method: "POST" })
      .catch(() => {})
      .finally(() => router.refresh());
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white"
      style={{ background: "var(--color-accent-2-600)" }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.95 1.36-.5.05-.97.24-3.28-.68-2.77-1.09-4.53-3.92-4.67-4.1-.14-.19-1.12-1.49-1.12-2.84 0-1.35.71-2.02.96-2.29.24-.27.53-.34.71-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.81 2 .88 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.61-.13.25.09 1.59.75 1.86.89.27.14.45.2.51.31.07.12.07.63-.17 1.31Z" />
      </svg>
      Send WhatsApp bill
    </a>
  );
}
