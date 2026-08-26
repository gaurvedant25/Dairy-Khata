import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#9D6638]" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-[#4E220F]">Dairy Ledger</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-medium text-[#9D6638] hover:underline">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#9D6638] px-3 py-1.5 font-medium text-white hover:bg-[#4E220F]"
          >
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-12 text-center sm:py-20">
          <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-[#4E220F] sm:text-4xl">
            The simplest ledger for milk delivery businesses
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Track daily deliveries, know exactly who owes you money, send bills on WhatsApp, and manage walk-in
            sales — all in one clean app, in English or Hindi.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-[#9D6638] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4E220F]"
            >
              Start 14-day free trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-[#D6BE8C] px-5 py-3 text-sm font-semibold text-[#4E220F] hover:bg-[#FBF3D1]"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">₹249/month after trial · cancel anytime</p>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-3">
          {[
            ["Daily deliveries", "Log each customer's order in seconds, with multiple products and units."],
            ["Dues & WhatsApp bills", "See outstanding amounts and send itemised bills to customers on WhatsApp."],
            ["Walk-in & reports", "Record one-off sales and see clear daily and monthly summaries."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-[#E0CB9E] bg-[#FBF3D1] p-5">
              <h3 className="text-sm font-semibold text-[#4E220F]">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[#E0CB9E]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Dairy Ledger</p>
          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/pricing" className="hover:text-[#4E220F]">Pricing</Link>
            <Link href="/contact" className="hover:text-[#4E220F]">Contact</Link>
            <Link href="/terms" className="hover:text-[#4E220F]">Terms</Link>
            <Link href="/privacy" className="hover:text-[#4E220F]">Privacy</Link>
            <Link href="/refund" className="hover:text-[#4E220F]">Refunds</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
