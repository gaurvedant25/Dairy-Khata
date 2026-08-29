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
      className="rounded-lg bg-[#C67139] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8C491A] disabled:opacity-60"
    >
      {loading ? "..." : lastRemindedAt ? "Remind again" : "Mark reminded"}
    </button>
  );
}
