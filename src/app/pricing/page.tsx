import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Pricing · Dairy Ledger" };

export default function PricingPage() {
  return (
    <LegalPage title="Pricing">
      <p>Dairy Ledger is a subscription service for milk delivery businesses.</p>
      <div className="rounded-xl border border-[#E0CB9E] bg-[#FBF3D1] p-5">
        <p className="text-2xl font-bold text-[#402310]">
          ₹249 <span className="text-sm font-normal text-slate-500">/ month</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">14-day free trial · cancel anytime</p>
        <ul className="mt-4 space-y-1 text-sm">
          <li>✓ Unlimited daily customers &amp; deliveries</li>
          <li>✓ Multiple products with custom units and prices</li>
          <li>✓ Dues tracking and WhatsApp bills</li>
          <li>✓ Walk-in orders and daily/monthly summaries</li>
        </ul>
        <Link
          href="/signup"
          className="mt-5 inline-block rounded-lg bg-[#C67139] px-4 py-2 text-sm font-semibold text-white hover:bg-[#402310]"
        >
          Start free trial
        </Link>
      </div>
      <p>
        All prices are in Indian Rupees (INR) and inclusive of applicable taxes. Your subscription renews monthly
        until cancelled. You can cancel anytime from Settings → Your subscription.
      </p>
    </LegalPage>
  );
}
