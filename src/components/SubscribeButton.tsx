"use client";

import { useState } from "react";

// Placeholder until a payment gateway (Razorpay) is connected. When keys are
// added, this button will open Razorpay Checkout for the ₹249/month plan.
export function SubscribeButton() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-lg bg-[#9D6638] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4E220F]"
      >
        Subscribe ₹249/month
      </button>
      {open && (
        <p className="mt-3 rounded-lg bg-[#F3E7C7] px-3 py-2 text-center text-xs text-slate-700">
          Online payment is being set up. Please contact us to activate your subscription.
        </p>
      )}
    </div>
  );
}
