"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemindButton({ customerId, lastRemindedAt }: { customerId: string; lastRemindedAt: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function mark() {
    setLoading(true);
    await fetch(`/api/customers/${customerId}/remind`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={mark}
      disabled={loading}
      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
      style={{ background: "var(--color-accent-600)" }}
    >
      {loading ? "..." : lastRemindedAt ? "Remind again" : "Mark reminded"}
    </button>
  );
}
