import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubscription, PRICE_INR, TRIAL_DAYS } from "@/lib/subscription";
import { SignOutButton } from "@/components/SignOutButton";
import { SubscribeButton } from "@/components/SubscribeButton";

export default async function BillingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const sub = await getSubscription(session.user.id);
  const expired = sub.status === "expired";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C67139]" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-[#402310]">Dairy Ledger</span>
        </div>
        <h1 className="text-2xl font-bold text-[#402310]">
          {expired ? "Your free trial has ended" : "Dairy Ledger Premium"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {expired
            ? "Subscribe to keep using your ledger, deliveries, and dues."
            : sub.status === "trialing"
            ? `You have ${sub.daysLeft} ${sub.daysLeft === 1 ? "day" : "days"} left in your free trial.`
            : "Your subscription is active."}
        </p>
      </div>

      <div className="rounded-2xl border border-[#E0CB9E] bg-[#FBF3D1] p-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-[#402310]">₹{PRICE_INR}</span>
          <span className="text-sm text-slate-500">/ month</span>
        </div>
        <p className="mt-1 text-center text-xs text-slate-500">{TRIAL_DAYS}-day free trial · cancel anytime</p>

        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          {[
            "Unlimited daily customers & deliveries",
            "Multiple products with custom units & prices",
            "Dues tracking & WhatsApp bills",
            "Walk-in orders & daily summaries",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#C67139]">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <SubscribeButton />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        {sub.hasAccess && (
          <Link href="/dashboard" className="font-medium text-[#C67139] hover:underline">
            ← Back to app
          </Link>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
