"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function SubscribeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setError(null);
    setLoading(true);
    try {
      const order = await fetch("/api/razorpay/order", { method: "POST" }).then((r) => r.json());
      if (!order.orderId) {
        setError(order.error ?? "Could not start payment");
        setLoading(false);
        return;
      }

      const ok = await loadCheckout();
      if (!ok) {
        setError("Couldn't load the payment window. Check your connection and try again.");
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        order_id: order.orderId,
        name: "Dairy Ledger",
        description: "Monthly subscription — ₹249",
        notes: { userId: order.userId },
        theme: { color: "#9D6638" },
        handler: async (resp: any) => {
          const v = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          }).then((r) => r.json());
          if (v.ok) {
            router.push("/dashboard");
            router.refresh();
          } else {
            setError(v.error ?? "Payment verification failed. If money was deducted, contact us.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={subscribe}
        disabled={loading}
        className="w-full rounded-lg bg-[#9D6638] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4E220F] disabled:opacity-60"
      >
        {loading ? "Opening payment…" : "Subscribe ₹249/month"}
      </button>
      {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
