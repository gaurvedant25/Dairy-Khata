"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    await fetch("/api/subscription/cancel", { method: "POST" }).catch(() => {});
    setLoading(false);
    // Access is now revoked → the app will send them to the paywall.
    router.push("/billing");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="mb-3 text-sm text-red-800">
        Are you sure? You&apos;ll lose access to your ledger until you subscribe again.
      </p>
      <div className="flex gap-2">
        <button
          onClick={cancel}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Cancelling..." : "Yes, cancel"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Keep subscription
        </button>
      </div>
    </div>
  );
}
