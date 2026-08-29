import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubscription, PRICE_INR, TRIAL_DAYS } from "@/lib/subscription";
import { CancelSubscriptionButton } from "@/components/CancelSubscriptionButton";
import { SubscribeButton } from "@/components/SubscribeButton";

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const sub = await getSubscription(session.user.id);

  const statusLabel =
    sub.status === "active" ? "Active" : sub.status === "trialing" ? "Free trial" : "Expired";
  const statusClass =
    sub.status === "expired" ? "bg-[#FFE1D0] text-[#402310]" : "bg-[#E1EECC] text-[#3D472B]";

  // The date access currently runs until.
  const accessUntil =
    sub.status === "active" ? sub.paidUntil : sub.status === "trialing" ? sub.trialEndsAt : null;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link href="/settings" className="text-sm text-slate-500 hover:underline">
        ← Back to settings
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-[#402310]">Your subscription</h1>

      <div className="mt-4 space-y-3 rounded-2xl border border-[#E0CB9E] bg-[#FBF3D1] p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Plan</span>
          <span className="text-sm font-medium text-[#402310]">Dairy Ledger Premium</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Price</span>
          <span className="text-sm font-medium text-[#402310]">₹{PRICE_INR} / month</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Status</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}>{statusLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            {sub.status === "active" ? "Renews on" : sub.status === "trialing" ? "Trial ends" : "Ended"}
          </span>
          <span className="text-sm font-medium text-[#402310]">{fmt(accessUntil)}</span>
        </div>
        {sub.status === "trialing" && (
          <p className="text-xs text-slate-500">
            You&apos;re on your {TRIAL_DAYS}-day free trial — {sub.daysLeft}{" "}
            {sub.daysLeft === 1 ? "day" : "days"} left. You won&apos;t be charged until it ends.
          </p>
        )}
      </div>

      <div className="mt-5">
        {sub.hasAccess ? (
          <CancelSubscriptionButton />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">Your access has ended. Subscribe to continue.</p>
            <SubscribeButton />
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Payments are processed securely by Razorpay via UPI Autopay. You can cancel anytime — you&apos;ll
        keep access until your current paid month ends.
      </p>
    </div>
  );
}
