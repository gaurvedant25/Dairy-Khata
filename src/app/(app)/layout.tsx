import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { getSubscription } from "@/lib/subscription";
import { NavLinks } from "@/components/NavLinks";
import { SignOutButton } from "@/components/SignOutButton";
import { PageTransition } from "@/components/PageTransition";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-block h-[11px] w-[11px] shrink-0 rounded-full"
        style={{ background: "var(--color-accent-500)" }}
        aria-hidden
      />
      <span className="font-heading text-[19px] tracking-tight text-[var(--color-accent-900)]">Dairy Ledger</span>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const lang = await getLang();

  // Gate the app behind the trial / subscription.
  const sub = await getSubscription(session!.user.id);
  if (!sub.hasAccess) redirect("/billing");

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <aside
        className="hidden w-60 shrink-0 border-r p-4 md:flex md:flex-col"
        style={{ borderColor: "var(--color-divider)", background: "var(--color-neutral-100)" }}
      >
        <div className="mb-6 px-2">
          <Wordmark />
          <p className="mt-1 truncate text-xs text-[var(--color-neutral-600)]">{session?.user?.name}</p>
        </div>
        <NavLinks orientation="vertical" lang={lang} />
        <div className="mt-auto px-2 pt-4">
          <SignOutButton />
        </div>
      </aside>

      {/* overflow-x-hidden keeps the decorative bloom from widening the page */}
      <main className="relative flex-1 overflow-x-hidden pb-28 md:pb-0">
        {/* Soft accent bloom behind the top of the screen */}
        <div
          className="pointer-events-none absolute -right-[90px] -top-[120px] h-[280px] w-[280px] rounded-full md:hidden"
          style={{ background: "var(--color-bloom)", opacity: 0.75 }}
          aria-hidden
        />

        <header className="relative flex items-center gap-2.5 px-5 pb-2.5 pt-[18px] md:hidden">
          <Wordmark />
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </header>

        {sub.status === "trialing" && (
          <Link
            href="/billing"
            className="relative mx-4 mt-1.5 flex items-center justify-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium"
            style={{ background: "var(--color-peach-bg)", color: "var(--color-peach-fg)" }}
          >
            <span>
              {sub.daysLeft} {sub.daysLeft === 1 ? "day" : "days"} left in your free trial
            </span>
            <span className="inline-flex items-center gap-1 font-bold">
              Subscribe
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        )}

        <div className="relative mx-auto max-w-5xl px-4 py-4 md:py-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 md:hidden"
        style={{
          background: "var(--color-neutral-100)",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -6px 24px rgba(46,43,37,.10)",
        }}
      >
        <NavLinks orientation="horizontal" lang={lang} />
      </nav>
    </div>
  );
}
