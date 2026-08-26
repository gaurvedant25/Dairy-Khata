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
    // Autopay is stopped, but they keep access until the paid period ends.
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Cancel autopay
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="mb-3 text-sm text-red-800">
        Stop automatic monthly renewals? You&apos;ll keep access until your current paid period ends,
        and won&apos;t be charged again.
      </p>
      <div className="flex gap-2">
        <button
          onClick={cancel}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Cancelling..." : "Yes, stop autopay"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Keep autopay
        </button>
      </div>
    </div>
  );
}
